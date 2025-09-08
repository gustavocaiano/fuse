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

// Delete a camera (stops streaming, removes HLS data, releases resources, deletes DB row)
cameraRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  const cam = getCameraStmt.get(id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Stop any active transcoding and release ONVIF resources
  ffmpegManager.stopTranscoding(id);
  ffmpegManager.stopRecording(id);
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
  res.status(204).end();
});

// Toggle recording per camera
cameraRouter.post('/:id/recording', (req, res) => {
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });
  const { enabled } = req.body as { enabled: boolean };
  updateCameraRecordingStmt.run(enabled ? 1 : 0, cam.id);

  const recordDir = process.env.RECORDINGS_DIR ? path.resolve(process.env.RECORDINGS_DIR) : '';
  const recordMinutes = Number(process.env.RECORD_SEGMENT_MINUTES || 10);
  if (recordDir) {
    if (enabled) {
      try {
        fs.mkdirSync(recordDir, { recursive: true });
        ffmpegManager.ensureRecording(cam.id, cam.rtsp, recordDir, recordMinutes);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Recording toggle on error:', e);
      }
    } else {
      ffmpegManager.stopRecording(cam.id);
    }
  }

  const updated = getCameraStmt.get(cam.id) as Camera;
  res.json({ id: updated.id, recordEnabled: updated.recordEnabled });
});

// Start HLS for camera and return m3u8 URL
cameraRouter.post('/:id/start', async (req, res) => {
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });
  const handle = ffmpegManager.ensureTranscoding(cam.id, cam.rtsp, baseHlsDir);
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

  // Start recording if configured and enabled
  const recordDir = process.env.RECORDINGS_DIR ? path.resolve(process.env.RECORDINGS_DIR) : '';
  const recordMinutes = Number(process.env.RECORD_SEGMENT_MINUTES || 10);
  if (recordDir && cam.recordEnabled) {
    try {
      fs.mkdirSync(recordDir, { recursive: true });
      ffmpegManager.ensureRecording(cam.id, cam.rtsp, recordDir, recordMinutes);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Recording start error:', e);
    }
  }

  res.json({ playlistUrl, outputDir: handle.outputDir, recording: Boolean(recordDir) });
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


