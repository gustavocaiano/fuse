import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { cameraRouter } from './routes/cameras';
import { userRouter } from './routes';
import { listCamerasStmt } from './db';
import { ffmpegManager } from './ffmpegManager';
import { StorageManager } from './storageManager';

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
		} else if (path.endsWith('.ts') || path.endsWith('.mp4')) {
			// Segment files: allow minimal caching since they're immutable once created
			res.setHeader('Cache-Control', 'public, max-age=1, immutable');
		}
		
		// Additional headers for streaming optimization
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Content-Type-Options', 'nosniff');
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
		
		// Initialize storage manager
		const storageManager = new StorageManager(recordDirEnv);
		
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
	
	// Setup storage management
	console.log('💾 Setting up storage management...');
	
	// Initial storage info
	storageManager.getStorageInfo().then(info => {
		console.log(storageManager.formatStorageInfo(info));
	});
	
	// Schedule daily cleanup at 2 AM
	const scheduleCleanup = () => {
		const now = new Date();
		const tomorrow2AM = new Date(now);
		tomorrow2AM.setDate(now.getDate() + 1);
		tomorrow2AM.setHours(2, 0, 0, 0);
		
		const msUntil2AM = tomorrow2AM.getTime() - now.getTime();
		
		setTimeout(async () => {
			console.log('🧹 Running scheduled cleanup...');
			try {
				// Regular 7-day cleanup
				await storageManager.cleanupOldFiles(7);
				
				// Check if we need emergency cleanup (if disk is >80% full)
				const info = await storageManager.getStorageInfo();
				const usagePercent = info.usedSpaceBytes / (info.availableSpaceBytes + info.usedSpaceBytes) * 100;
				
				if (usagePercent > 80) {
					console.log('🚨 Disk usage > 80%, running emergency cleanup...');
					await storageManager.emergencyCleanup(20); // Keep 20% free space
				}
				
				// Log final storage status
				const finalInfo = await storageManager.getStorageInfo();
				console.log(storageManager.formatStorageInfo(finalInfo));
				
			} catch (error) {
				console.error('❌ Cleanup error:', error);
			}
			
			// Schedule next cleanup
			scheduleCleanup();
		}, msUntil2AM);
		
		console.log(`⏰ Next cleanup scheduled for: ${tomorrow2AM.toISOString()}`);
	};
	
	scheduleCleanup();
	
} catch (e) {
	// eslint-disable-next-line no-console
	console.error('❌ Auto-start supervisor error:', e);
}
});


