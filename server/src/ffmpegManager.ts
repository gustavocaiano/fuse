import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export type TranscodeHandle = {
  cameraId: string;
  process: ChildProcess;
  outputDir: string;
};

class FfmpegManager {
  private cameraIdToProcess: Map<string, TranscodeHandle> = new Map();

  ensureTranscoding(cameraId: string, rtspUrl: string, baseOutputDir: string): TranscodeHandle {
    const existing = this.cameraIdToProcess.get(cameraId);
    if (existing) return existing;

    const outputDir = path.join(baseOutputDir, cameraId);
    fs.mkdirSync(outputDir, { recursive: true });

    const args = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-fflags', '+genpts',
      // balanced x264 encode for stability
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-profile:v', 'baseline',
      '-x264-params', 'keyint=50:min-keyint=50:scenecut=0',
      // target ~2s keyframe interval for 2s segments
      '-g', '50',
      '-sc_threshold', '0',
      // drop audio to avoid extra mux/demux latency (enable if needed)
      '-an',
      // reduce muxing delay
      '-flush_packets', '1',
      '-f', 'hls',
      // 2s segments, 3 in playlist ≈ ~6s window
      '-hls_time', '2',
      '-hls_list_size', '3',
      // make segments independently decodable and trim old ones
      '-hls_flags', 'delete_segments+append_list+program_date_time+independent_segments',
      path.join(outputDir, 'index.m3u8')
    ];

    const child = spawn('ffmpeg', args, { stdio: 'ignore' });

    child.on('exit', () => {
      this.cameraIdToProcess.delete(cameraId);
    });

    child.on('error', (err) => {
      // Simple visibility into spawn failures
      console.error(`ffmpeg spawn error for camera ${cameraId}:`, err?.message || err);
      this.cameraIdToProcess.delete(cameraId);
    });

    const handle: TranscodeHandle = { cameraId, process: child, outputDir };
    this.cameraIdToProcess.set(cameraId, handle);
    return handle;
  }

  stopTranscoding(cameraId: string) {
    const handle = this.cameraIdToProcess.get(cameraId);
    if (!handle) return;
    handle.process.kill('SIGTERM');
    this.cameraIdToProcess.delete(cameraId);
  }
}

export const ffmpegManager = new FfmpegManager();


