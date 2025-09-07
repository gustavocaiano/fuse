import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { cameraRouter } from './routes/cameras';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/cameras', cameraRouter);

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
});


