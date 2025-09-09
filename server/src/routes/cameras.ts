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

// Get available recording years for a camera
cameraRouter.get('/:id/recordings/years', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  console.log(`Recordings years request - User: ${user?.id} (${user?.role}), Camera: ${cam.id}`);

  // Check permissions (same as camera access)
  if (!user || user.role !== 'admin') {
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    if (!allowedIds.includes(cam.id)) {
      console.log(`Access denied - User ${user?.id} not in allowed IDs: ${allowedIds.join(', ')}`);
      return res.status(403).json({ error: 'forbidden' });
    }
  }

  try {
    const recordingsDir = process.env.RECORDINGS_DIR || path.join(__dirname, '..', '..', 'recordings');
    const cameraDir = path.join(recordingsDir, cam.id);
    
    if (!fs.existsSync(cameraDir)) {
      return res.json([]);
    }

    const years = fs.readdirSync(cameraDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => /^\d{4}$/.test(name))
      .sort((a, b) => parseInt(b) - parseInt(a)); // Most recent first

    res.json(years);
  } catch (e) {
    console.error('Error listing recording years:', e);
    res.status(500).json({ error: 'Failed to list years' });
  }
});

// Get available recording months for a camera/year
cameraRouter.get('/:id/recordings/:year/months', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Check permissions
  if (!user || user.role !== 'admin') {
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    if (!allowedIds.includes(cam.id)) return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const recordingsDir = process.env.RECORDINGS_DIR || path.join(__dirname, '..', '..', 'recordings');
    const yearDir = path.join(recordingsDir, cam.id, req.params.year);
    
    if (!fs.existsSync(yearDir)) {
      return res.json([]);
    }

    const monthOrder = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const months = fs.readdirSync(yearDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => monthOrder.includes(name.toLowerCase()))
      .sort((a, b) => monthOrder.indexOf(b.toLowerCase()) - monthOrder.indexOf(a.toLowerCase())); // Most recent first

    res.json(months);
  } catch (e) {
    console.error('Error listing recording months:', e);
    res.status(500).json({ error: 'Failed to list months' });
  }
});

// Get available recording days for a camera/year/month
cameraRouter.get('/:id/recordings/:year/:month/days', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Check permissions
  if (!user || user.role !== 'admin') {
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    if (!allowedIds.includes(cam.id)) return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const recordingsDir = process.env.RECORDINGS_DIR || path.join(__dirname, '..', '..', 'recordings');
    const monthDir = path.join(recordingsDir, cam.id, req.params.year, req.params.month);
    
    if (!fs.existsSync(monthDir)) {
      return res.json([]);
    }

    const days = fs.readdirSync(monthDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => /^\d{2}$/.test(name))
      .sort((a, b) => parseInt(b) - parseInt(a)); // Most recent first

    res.json(days);
  } catch (e) {
    console.error('Error listing recording days:', e);
    res.status(500).json({ error: 'Failed to list days' });
  }
});

// Get available recording hours for a camera/year/month/day
cameraRouter.get('/:id/recordings/:year/:month/:day/hours', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Check permissions
  if (!user || user.role !== 'admin') {
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    if (!allowedIds.includes(cam.id)) return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const recordingsDir = process.env.RECORDINGS_DIR || path.join(__dirname, '..', '..', 'recordings');
    const dayDir = path.join(recordingsDir, cam.id, req.params.year, req.params.month, req.params.day);
    
    if (!fs.existsSync(dayDir)) {
      return res.json([]);
    }

    const hours = fs.readdirSync(dayDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => /^\d{2}$/.test(name))
      .sort((a, b) => parseInt(b) - parseInt(a)); // Most recent first

    res.json(hours);
  } catch (e) {
    console.error('Error listing recording hours:', e);
    res.status(500).json({ error: 'Failed to list hours' });
  }
});

// Get recording files for a specific camera/year/month/day/hour
cameraRouter.get('/:id/recordings/:year/:month/:day/:hour/files', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Check permissions
  if (!user || user.role !== 'admin') {
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    if (!allowedIds.includes(cam.id)) return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const recordingsDir = process.env.RECORDINGS_DIR || path.join(__dirname, '..', '..', 'recordings');
    const hourDir = path.join(recordingsDir, cam.id, req.params.year, req.params.month, req.params.day, req.params.hour);
    
    if (!fs.existsSync(hourDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(hourDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .filter(dirent => dirent.name.endsWith('.mp4'))
      .map(dirent => {
        const filePath = path.join(hourDir, dirent.name);
        const stats = fs.statSync(filePath);
        return {
          filename: dirent.name,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          duration: null, // Could add ffprobe integration later
        };
      })
      .sort((a, b) => a.created.getTime() - b.created.getTime()); // Chronological order

    res.json(files);
  } catch (e) {
    console.error('Error listing recording files:', e);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Serve recorded video files
cameraRouter.get('/:id/recordings/:year/:month/:day/:hour/file/:filename', (req, res) => {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Check permissions
  if (!user || user.role !== 'admin') {
    const allowedIds = user && user.id ? (listAccessibleCameraIdsForUserStmt.all(user.id) as Array<{ cameraId: string }>).map(r => r.cameraId) : [];
    if (!allowedIds.includes(cam.id)) return res.status(403).json({ error: 'forbidden' });
  }

  try {
    const recordingsDir = process.env.RECORDINGS_DIR || path.join(__dirname, '..', '..', 'recordings');
    const resolvedRecordingsDir = path.resolve(recordingsDir);
    const filePath = path.resolve(path.join(recordingsDir, cam.id, req.params.year, req.params.month, req.params.day, req.params.hour, req.params.filename));
    
    console.log(`Playback request - User: ${(req as any).user?.id}, Camera: ${cam.id}, File: ${filePath}`);
    
    // Security: prevent path traversal
    if (!filePath.startsWith(resolvedRecordingsDir)) {
      console.error(`Path traversal attempt: ${filePath} not under ${resolvedRecordingsDir}`);
      return res.status(403).json({ error: 'forbidden' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'file not found' });
    }

    // Set appropriate headers for video streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support range requests for video seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0] || '0', 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (e) {
    console.error('Error serving recording file:', e);
    res.status(500).json({ error: 'Failed to serve file' });
  }
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


