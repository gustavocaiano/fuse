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
      '-preset', 'veryfast',
      '-g', '48',
      '-sc_threshold', '0',
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '6',
      '-hls_flags', 'delete_segments+append_list+program_date_time',
      path.join(outputDir, 'index.m3u8')
    ];

    const child = spawn('ffmpeg', args, { stdio: 'ignore' });

    child.on('exit', () => {
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


