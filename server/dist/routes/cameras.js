"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cameraRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("../db");
const ffmpegManager_1 = require("../ffmpegManager");
const onvifManager_1 = require("../onvifManager");
exports.cameraRouter = (0, express_1.Router)();
const baseHlsDir = process.env.HLS_DIR ? path_1.default.resolve(process.env.HLS_DIR) : path_1.default.resolve(path_1.default.join(__dirname, '..', 'hls'));
fs_1.default.mkdirSync(baseHlsDir, { recursive: true });
// List cameras
exports.cameraRouter.get('/', (_req, res) => {
    const rows = db_1.listCamerasStmt.all();
    res.json(rows);
});
// Create camera
exports.cameraRouter.post('/', (req, res) => {
    const { name, rtsp } = req.body;
    if (!name || !rtsp)
        return res.status(400).json({ error: 'name and rtsp are required' });
    const id = (0, uuid_1.v4)();
    const cam = { id, name, rtsp, createdAt: new Date().toISOString() };
    db_1.insertCamera.run(cam);
    res.status(201).json(cam);
});
// Get a camera
exports.cameraRouter.get('/:id', (req, res) => {
    const cam = db_1.getCameraStmt.get(req.params.id);
    if (!cam)
        return res.status(404).json({ error: 'not found' });
    res.json(cam);
});
// Delete a camera
exports.cameraRouter.delete('/:id', (req, res) => {
    ffmpegManager_1.ffmpegManager.stopTranscoding(req.params.id);
    db_1.deleteCameraStmt.run(req.params.id);
    res.status(204).end();
});
// Start HLS for camera and return m3u8 URL
exports.cameraRouter.post('/:id/start', (req, res) => {
    const cam = db_1.getCameraStmt.get(req.params.id);
    if (!cam)
        return res.status(404).json({ error: 'not found' });
    const handle = ffmpegManager_1.ffmpegManager.ensureTranscoding(cam.id, cam.rtsp, baseHlsDir);
    const playlistUrl = `/hls/${cam.id}/index.m3u8`;
    res.json({ playlistUrl, outputDir: handle.outputDir });
});
// PTZ move
exports.cameraRouter.post('/:id/ptz/move', async (req, res) => {
    const camRow = db_1.getCameraStmt.get(req.params.id);
    if (!camRow)
        return res.status(404).json({ error: 'not found' });
    const payload = req.body;
    if (!payload || (payload.type !== 'continuous' && payload.type !== 'relative')) {
        return res.status(400).json({ error: 'invalid payload' });
    }
    try {
        const cam = await onvifManager_1.onvifManager.getCamForCamera(camRow);
        if (payload.type === 'continuous') {
            await onvifManager_1.onvifManager.continuousMove(cam, payload);
        }
        else {
            await onvifManager_1.onvifManager.relativeMove(cam, payload);
        }
        res.status(204).end();
    }
    catch (e) {
        res.status(500).json({ error: String(e?.message || e) });
    }
});
// PTZ stop
exports.cameraRouter.post('/:id/ptz/stop', async (req, res) => {
    const camRow = db_1.getCameraStmt.get(req.params.id);
    if (!camRow)
        return res.status(404).json({ error: 'not found' });
    const payload = req.body;
    try {
        const cam = await onvifManager_1.onvifManager.getCamForCamera(camRow);
        await onvifManager_1.onvifManager.stop(cam, payload);
        res.status(204).end();
    }
    catch (e) {
        res.status(500).json({ error: String(e?.message || e) });
    }
});
//# sourceMappingURL=cameras.js.map