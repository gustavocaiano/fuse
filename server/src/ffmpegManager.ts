import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export type TranscodeHandle = {
  cameraId: string;
  process: ChildProcess;
  outputDir: string;
};

export type RecordingHandle = {
  cameraId: string;
  process: ChildProcess;
  currentHourKey: string;
  interval: NodeJS.Timeout;
  baseDir: string;
  segmentSeconds: number;
};

class FfmpegManager {
  private cameraIdToProcess: Map<string, TranscodeHandle> = new Map();
  private cameraIdToRecording: Map<string, RecordingHandle> = new Map();

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

  private getMonthShortLower(date: Date): string {
    return date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  }

  private buildRecordingDir(baseDir: string, cameraId: string, date: Date): { dir: string; hourKey: string } {
    const year = String(date.getFullYear());
    const month = this.getMonthShortLower(date);
    const day = String(date.getDate()).padStart(2, '0') + 'day';
    const hour = String(date.getHours()).padStart(2, '0') + 'h';
    const dir = path.join(baseDir, cameraId, year, month, day, hour);
    const hourKey = `${year}-${month}-${day}-${hour}`;
    return { dir, hourKey };
  }

  ensureRecording(cameraId: string, rtspUrl: string, baseRecordingsDir: string, segmentMinutes: number): RecordingHandle {
    const existing = this.cameraIdToRecording.get(cameraId);
    if (existing) return existing;

    const segmentSeconds = Math.max(1, Math.floor(segmentMinutes * 60));

    const startRecordingProcess = () => {
      const now = new Date();
      const { dir, hourKey } = this.buildRecordingDir(baseRecordingsDir, cameraId, now);
      fs.mkdirSync(dir, { recursive: true });

      const outputPattern = path.join(dir, 'part-%03d.mp4');

      const args = [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        // transcode for compatibility and consistent container
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-profile:v', 'baseline',
        '-movflags', '+faststart',
        '-an',
        '-f', 'segment',
        '-segment_time', String(segmentSeconds),
        '-reset_timestamps', '1',
        outputPattern
      ];

      const child = spawn('ffmpeg', args, { stdio: 'ignore' });

      child.on('exit', () => {
        // noop; supervisor interval will recreate if needed
      });

      return { child, hourKey };
    };

    const initial = startRecordingProcess();

    const handle: RecordingHandle = {
      cameraId,
      process: initial.child,
      currentHourKey: initial.hourKey,
      // placeholder; set after creating interval
      interval: setInterval(() => {}, 1),
      baseDir: baseRecordingsDir,
      segmentSeconds,
    };

    // supervise hourly rotation
    const interval = setInterval(() => {
      const now = new Date();
      const { hourKey: newKey } = this.buildRecordingDir(baseRecordingsDir, cameraId, now);
      if (newKey !== handle.currentHourKey) {
        try { handle.process.kill('SIGTERM'); } catch {}
        const restarted = startRecordingProcess();
        handle.process = restarted.child;
        handle.currentHourKey = restarted.hourKey;
      }
    }, 60 * 1000);
    handle.interval = interval;

    this.cameraIdToRecording.set(cameraId, handle);
    return handle;
  }

  stopRecording(cameraId: string) {
    const handle = this.cameraIdToRecording.get(cameraId);
    if (!handle) return;
    try { clearInterval(handle.interval); } catch {}
    try { handle.process.kill('SIGTERM'); } catch {}
    this.cameraIdToRecording.delete(cameraId);
  }
}

export const ffmpegManager = new FfmpegManager();


