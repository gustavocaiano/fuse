import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { cameraRouter } from './routes/cameras';
import { userRouter } from './routes';
import { listCamerasStmt } from './db';
import { ffmpegManager } from './ffmpegManager';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/cameras', cameraRouter);
app.use('/api/users', userRouter);

// Serve HLS output static directory
const hlsDir = path.resolve(process.env.HLS_DIR || path.join(__dirname, 'hls'));
app.use('/hls', express.static(hlsDir, {
	setHeaders: (res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
	}
}));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
	console.log(`cam-parser server listening on http://localhost:${port}`);

	// Auto-start recordings for cameras that have recording enabled
	try {
		const recordDir = process.env.RECORDINGS_DIR ? path.resolve(process.env.RECORDINGS_DIR) : '';
		const recordMinutes = Number(process.env.RECORD_SEGMENT_MINUTES || 10);
		if (recordDir) {
			try { fs.mkdirSync(recordDir, { recursive: true }); } catch {}
			const rows = listCamerasStmt.all() as Array<{ id: string; rtsp: string; recordEnabled: number }>;
			for (const cam of rows) {
				if (cam.recordEnabled) {
					try {
						ffmpegManager.ensureRecording(cam.id, cam.rtsp, recordDir, recordMinutes);
					} catch (e) {
						// eslint-disable-next-line no-console
						console.error('Auto-start recording error:', cam.id, e);
					}
				}
			}
		}
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Auto-start recordings supervisor error:', e);
	}
});


