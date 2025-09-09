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
	setHeaders: (res, path) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		
		// Ultra-low latency: different caching for manifest vs segments
		if (path.endsWith('.m3u8')) {
			// Playlist files: no caching for live updates
			res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
			res.setHeader('Pragma', 'no-cache');
			res.setHeader('Expires', '0');
			// Additional anti-proxy headers
			res.setHeader('Surrogate-Control', 'no-store');
			res.setHeader('X-Accel-Expires', '0');
		} else if (path.endsWith('.ts') || path.endsWith('.mp4')) {
			// Segment files: allow minimal caching since they're immutable once created
			res.setHeader('Cache-Control', 'public, max-age=1, immutable');
		}
		
		// Additional headers for streaming optimization
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Content-Type-Options', 'nosniff');
		// Anti-proxy buffering headers
		res.setHeader('X-Accel-Buffering', 'no');
		res.setHeader('Proxy-Buffering', 'off');
		// Force proxy to not transform content
		res.setHeader('Cache-Control', res.getHeader('Cache-Control') + ', no-transform');
	}
}));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
	console.log(`cam-parser server listening on http://localhost:${port}`);

	// Auto-start always-recording for all cameras (single stream approach)
	try {
		const recordDirEnv = process.env.RECORDINGS_DIR ? path.resolve(process.env.RECORDINGS_DIR) : path.join(__dirname, '..', 'recordings');
		const recordMinutes = Number(process.env.RECORD_SEGMENT_MINUTES || 10);
		
		// Ensure directories exist
		try { fs.mkdirSync(hlsDir, { recursive: true }); } catch {}
		try { fs.mkdirSync(recordDirEnv, { recursive: true }); } catch {}
		
		const rows = listCamerasStmt.all() as Array<{ id: string; rtsp: string; recordEnabled: number }>;
		console.log(`🎥 Auto-starting always-recording for ${rows.length} cameras...`);
		console.log(`📁 Recordings: ${recordDirEnv}`);
		console.log(`📺 HLS Output: ${hlsDir}`);
		
		for (const cam of rows) {
			try {
				// Always start recording-only mode (HLS will be enabled when users start streaming)
				ffmpegManager.ensureAlwaysRecording(
					cam.id,
					cam.rtsp,
					recordDirEnv,
					hlsDir,
					recordMinutes,
					false // Start with recording-only, HLS on-demand
				);
				console.log(`✅ Started always-recording for camera ${cam.id}`);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(`❌ Auto-start error for camera ${cam.id}:`, e);
			}
		}
		
		console.log(`🚀 Always-recording system active for ${rows.length} cameras`);
		console.log(`💡 Single RTSP stream per camera - optimal performance!`);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('❌ Auto-start supervisor error:', e);
	}
});


