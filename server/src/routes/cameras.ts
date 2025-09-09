import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Camera, insertCamera, listCamerasStmt, getCameraStmt, deleteCameraStmt, updateCameraRecordingStmt, listAccessibleCameraIdsForUserStmt, getUserStmt } from '../db';
import { ffmpegManager } from '../ffmpegManager';
import { onvifManager, PtzMovePayload, PtzStopPayload } from '../onvifManager';

export const cameraRouter = Router();

const baseHlsDir = process.env.HLS_DIR ? path.resolve(process.env.HLS_DIR) : path.resolve(path.join(__dirname, '..', 'hls'));
fs.mkdirSync(baseHlsDir, { recursive: true });

// Attach user from x-user-id header
cameraRouter.use((req, _res, next) => {
  const userId = (req.headers['x-user-id'] as string) || '';
  const user = userId ? (getUserStmt.get(userId) as any) : null;
  (req as any).user = user || null;
  next();
});

// List cameras (filter by access for non-admin)
cameraRouter.get('/', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const rows = listCamerasStmt.all() as Camera[];
  if (!user || user.role !== 'admin') {
    // if user is not provided, treat as no access
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    const filtered = rows.map(c => ({ ...c, rtsp: undefined as any })).filter(c => allowedIds.includes(c.id));
    return res.json(filtered);
  }
  res.json(rows);
});

// Create camera
cameraRouter.post('/', (req, res) => {
  const { name, rtsp, recordEnabled } = req.body as Partial<Camera>;
  if (!name || !rtsp) return res.status(400).json({ error: 'name and rtsp are required' });

  const id = uuidv4();
  const cam: Camera = { id, name, rtsp, createdAt: new Date().toISOString(), recordEnabled: recordEnabled ? 1 : 0 } as any;
  insertCamera.run(cam);
  res.status(201).json(cam);
});

// Get a camera (hide rtsp for non-admin)
cameraRouter.get('/:id', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });
  if (!user || user.role !== 'admin') {
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    if (!allowedIds.includes(cam.id)) return res.status(403).json({ error: 'forbidden' });
    const { rtsp, ...rest } = cam as any;
    return res.json(rest);
  }
  res.json(cam);
});

// Delete a camera (stops all processes, removes data, releases resources, deletes DB row)
cameraRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  const cam = getCameraStmt.get(id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Stop the always-recording process (includes streaming)
  ffmpegManager.stopAlwaysRecording(id);
  onvifManager.release(id);

  // Remove HLS output directory for this camera
  const camHlsDir = path.join(baseHlsDir, id);
  try {
    fs.rmSync(camHlsDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }

  // Remove DB record
  deleteCameraStmt.run(id);
  console.log(`Deleted camera ${id} and cleaned up all resources`);
  res.status(204).end();
});

// Note: In the new always-record system, this endpoint doesn't actually toggle recording
// Recording is always on. This endpoint is kept for backward compatibility
cameraRouter.post('/:id/recording', (req, res) => {
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });
  const { enabled } = req.body as { enabled: boolean };
  updateCameraRecordingStmt.run(enabled ? 1 : 0, cam.id);

  console.log(`Recording preference set to ${enabled} for camera ${cam.id} (always recording in background)`);

  const updated = getCameraStmt.get(cam.id) as Camera;
  res.json({ 
    id: updated.id, 
    recordEnabled: updated.recordEnabled,
    note: "Recording is always active in background - this setting is for preference tracking only"
  });
});

// Start HLS streaming for camera (recording is always active)
cameraRouter.post('/:id/start', async (req, res) => {
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });
  
  try {
    const recordDir = process.env.RECORDINGS_DIR ? path.resolve(process.env.RECORDINGS_DIR) : '';
    const recordMinutes = Number(process.env.RECORD_SEGMENT_MINUTES || 10);
    
    fs.mkdirSync(baseHlsDir, { recursive: true });
    fs.mkdirSync(recordDir, { recursive: true });
    
    // Ensure camera is always recording and now also streaming HLS
    const handle = ffmpegManager.ensureAlwaysRecording(
      cam.id,
      cam.rtsp,
      recordDir,
      baseHlsDir,
      recordMinutes,
      true // Enable HLS output
    );
    
    const playlistUrl = `/hls/${cam.id}/index.m3u8`;

    // Wait briefly for the HLS playlist to appear to avoid an initial 404 in the player
    const playlistPath = path.join(baseHlsDir, cam.id, 'index.m3u8');

    const waitForFile = async (filePath: string, timeoutMs = 12000, pollMs = 300) => {
      const start = Date.now();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          fs.accessSync(filePath, fs.constants.F_OK);
          return true;
        } catch {}
        if (Date.now() - start > timeoutMs) return false;
        await new Promise(r => setTimeout(r, pollMs));
      }
    };

    await waitForFile(playlistPath);

    console.log(`Started HLS streaming for camera ${cam.id} (always recording in background)`);

    res.json({ 
      playlistUrl, 
      outputDir: handle.hlsOutputDir,
      recording: true, // Always recording
      streaming: handle.isStreamingHLS,
      note: "Camera is always recording - HLS streaming is now enabled"
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Start camera error:', e);
    res.status(500).json({ error: 'Failed to start camera stream' });
  }
});

// PTZ move
cameraRouter.post('/:id/ptz/move', async (req, res) => {
  const camRow = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!camRow) return res.status(404).json({ error: 'not found' });
  const payload = req.body as PtzMovePayload;
  if (!payload || (payload.type !== 'continuous' && payload.type !== 'relative')) {
    return res.status(400).json({ error: 'invalid payload' });
  }
  try {
    const cam = await onvifManager.getCamForCamera(camRow);
    if (payload.type === 'continuous') {
      await onvifManager.continuousMove(cam, payload);
    } else {
      await onvifManager.relativeMove(cam, payload);
    }
    res.status(204).end();
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// PTZ stop
cameraRouter.post('/:id/ptz/stop', async (req, res) => {
  const camRow = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!camRow) return res.status(404).json({ error: 'not found' });
  const payload = req.body as PtzStopPayload;
  try {
    const cam = await onvifManager.getCamForCamera(camRow);
    await onvifManager.stop(cam, payload);
    res.status(204).end();
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Get camera status (always-recording and streaming state)
cameraRouter.get('/:id/status', (req, res) => {
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  const handle = ffmpegManager.getHandle(cam.id);

  const status = {
    cameraId: cam.id,
    alwaysRecording: {
      active: Boolean(handle),
      processId: handle?.process?.pid || null,
      currentHour: handle?.currentHourKey || null,
      recordingDir: handle?.recordingBaseDir || null,
    },
    hlsStreaming: {
      active: Boolean(handle?.isStreamingHLS),
      outputDir: handle?.hlsOutputDir || null,
      playlistUrl: handle?.isStreamingHLS ? `/hls/${cam.id}/index.m3u8` : null,
    },
    config: {
      recordEnabled: Boolean(cam.recordEnabled), // Preference only
      rtspUrl: cam.rtsp,
      segmentMinutes: handle?.segmentMinutes || null,
    },
    system: {
      architecture: "always-record + on-demand-hls",
      singleStream: true,
      cameraLoad: "minimal - single RTSP connection",
    }
  };

  res.json(status);
});

// Stop HLS streaming for camera (keep recording active)
cameraRouter.post('/:id/stop', (req, res) => {
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  const success = ffmpegManager.disableHLS(cam.id);
  
  if (success) {
    console.log(`Stopped HLS streaming for camera ${cam.id} (still recording in background)`);
    res.json({ 
      message: 'HLS streaming stopped',
      recording: true, // Always recording
      streaming: false,
      note: "Camera continues recording in background"
    });
  } else {
    res.status(404).json({ error: 'Camera not found or not streaming' });
  }
});


