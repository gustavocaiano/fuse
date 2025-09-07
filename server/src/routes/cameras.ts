import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Camera, insertCamera, listCamerasStmt, getCameraStmt, deleteCameraStmt } from '../db';
import { ffmpegManager } from '../ffmpegManager';
import { onvifManager, PtzMovePayload, PtzStopPayload } from '../onvifManager';

export const cameraRouter = Router();

const baseHlsDir = process.env.HLS_DIR ? path.resolve(process.env.HLS_DIR) : path.resolve(path.join(__dirname, '..', 'hls'));
fs.mkdirSync(baseHlsDir, { recursive: true });

// List cameras
cameraRouter.get('/', (_req, res) => {
  const rows = listCamerasStmt.all() as Camera[];
  res.json(rows);
});

// Create camera
cameraRouter.post('/', (req, res) => {
  const { name, rtsp } = req.body as Partial<Camera>;
  if (!name || !rtsp) return res.status(400).json({ error: 'name and rtsp are required' });

  const id = uuidv4();
  const cam: Camera = { id, name, rtsp, createdAt: new Date().toISOString() };
  insertCamera.run(cam);
  res.status(201).json(cam);
});

// Get a camera
cameraRouter.get('/:id', (req, res) => {
  const cam = getCameraStmt.get(req.params.id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });
  res.json(cam);
});

// Delete a camera (stops streaming, removes HLS data, releases resources, deletes DB row)
cameraRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  const cam = getCameraStmt.get(id) as Camera | undefined;
  if (!cam) return res.status(404).json({ error: 'not found' });

  // Stop any active transcoding and release ONVIF resources
  ffmpegManager.stopTranscoding(id);
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

  res.json({ playlistUrl, outputDir: handle.outputDir });
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


