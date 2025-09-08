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

export type PipelineHandle = {
  cameraId: string;
  process: ChildProcess;
  hlsBaseDir: string;
  hlsDir: string;
  recordBaseDir: string;
  recordingEnabled: boolean;
  currentHourKey: string;
  interval: NodeJS.Timeout;
  segmentSeconds: number;
  rtspUrl: string;
};

class FfmpegManager {
  private cameraIdToProcess: Map<string, TranscodeHandle> = new Map();
  private cameraIdToRecording: Map<string, RecordingHandle> = new Map();
  private cameraIdToPipeline: Map<string, PipelineHandle> = new Map();

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

      const forceKeyExpr = `expr:gte(t, n_forced*${segmentSeconds})`;
      const args = [
        '-rtsp_transport', 'tcp',
        // Generate PTS if missing (some RTSP sources)
        '-fflags', '+genpts',
        '-i', rtspUrl,
        // transcode for compatibility and consistent container
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-profile:v', 'baseline',
        // consistent GOP to help clean segmenting
        '-g', '50',
        '-sc_threshold', '0',
        '-x264-params', 'keyint=50:min-keyint=50:scenecut=0',
        // ensure a keyframe exactly at each segment boundary
        '-force_key_frames', forceKeyExpr,
        '-movflags', '+faststart',
        '-an',
        '-f', 'segment',
        '-segment_time', String(segmentSeconds),
        // cut segments aligned to wall clock (00,10,20,30,40,50)
        '-segment_atclocktime', '1',
        '-reset_timestamps', '1',
        outputPattern
      ];

      const child = spawn('ffmpeg', args, { stdio: 'ignore' });

      child.on('exit', () => {
        // noop; supervisor interval will recreate if needed
      });

      return { child, hourKey };
    };

    let { child, hourKey } = startRecordingProcess();

    const handle: RecordingHandle = {
      cameraId,
      process: child,
      currentHourKey: hourKey,
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
      // if the child died unexpectedly, restart within the same hour
      if (handle.process.exitCode !== null) {
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

  // Combined single-pull pipeline for HLS live + segment recordings
  ensurePipeline(
    cameraId: string,
    rtspUrl: string,
    baseHlsDir: string,
    baseRecordingsDir: string,
    segmentMinutes: number,
    recordingEnabled: boolean
  ): PipelineHandle {
    const segmentSeconds = Math.max(1, Math.floor(segmentMinutes * 60));
    const existing = this.cameraIdToPipeline.get(cameraId);
    if (existing) {
      const sameRecFlag = existing.recordingEnabled === Boolean(recordingEnabled && baseRecordingsDir);
      const sameHls = existing.hlsBaseDir === baseHlsDir;
      const sameRecBase = existing.recordBaseDir === baseRecordingsDir;
      const sameSeg = existing.segmentSeconds === segmentSeconds;
      if (sameRecFlag && sameHls && sameRecBase && sameSeg) return existing;
      try { clearInterval(existing.interval); } catch {}
      try { existing.process.kill('SIGTERM'); } catch {}
      this.cameraIdToPipeline.delete(cameraId);
    }

    const hlsDir = path.join(baseHlsDir, cameraId);
    fs.mkdirSync(hlsDir, { recursive: true });

    const startProcess = () => {
      const now = new Date();
      const { dir, hourKey } = this.buildRecordingDir(baseRecordingsDir, cameraId, now);
      if (recordingEnabled && baseRecordingsDir) fs.mkdirSync(dir, { recursive: true });

      const forceKeyExpr = `expr:gte(t, n_forced*${segmentSeconds})`;
      const args: string[] = [
        '-rtsp_transport', 'tcp',
        '-fflags', '+genpts',
        '-i', rtspUrl,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-profile:v', 'baseline',
        '-x264-params', 'keyint=50:min-keyint=50:scenecut=0',
        '-g', '50',
        '-sc_threshold', '0',
        '-an',
      ];

      if (recordingEnabled && baseRecordingsDir) {
        const hlsOut = path.join(hlsDir, 'index.m3u8');
        const segPattern = path.join(dir, 'part-%03d.mp4');
        const teeDest =
          `tee:` +
          `[f=hls:hls_time=2:hls_list_size=3:hls_flags=delete_segments+append_list+program_date_time+independent_segments]${hlsOut}` +
          `|` +
          `[f=segment:segment_time=${segmentSeconds}:segment_atclocktime=1:reset_timestamps=1]${segPattern}`;
        args.push(
          '-force_key_frames', forceKeyExpr,
          '-f', 'tee', teeDest
        );
      } else {
        args.push(
          '-flush_packets', '1',
          '-f', 'hls',
          '-hls_time', '2',
          '-hls_list_size', '3',
          '-hls_flags', 'delete_segments+append_list+program_date_time+independent_segments',
          path.join(hlsDir, 'index.m3u8')
        );
      }

      const child = spawn('ffmpeg', args, { stdio: 'ignore' });
      child.on('error', (err) => {
        console.error(`ffmpeg pipeline spawn error for camera ${cameraId}:`, err?.message || err);
      });
      return { child, hourKey };
    };

    const initial = startProcess();
    const handle: PipelineHandle = {
      cameraId,
      process: initial.child,
      hlsBaseDir: baseHlsDir,
      hlsDir,
      recordBaseDir: baseRecordingsDir,
      recordingEnabled: Boolean(recordingEnabled && baseRecordingsDir),
      currentHourKey: initial.hourKey,
      interval: setInterval(() => {}, 1),
      segmentSeconds,
      rtspUrl,
    };

    const interval = setInterval(() => {
      // Hourly rotation: restart to write into new hour directory when recording
      if (handle.recordingEnabled && handle.recordBaseDir) {
        const now = new Date();
        const { hourKey: newKey } = this.buildRecordingDir(handle.recordBaseDir, cameraId, now);
        if (newKey !== handle.currentHourKey) {
          try { handle.process.kill('SIGTERM'); } catch {}
          const restarted = startProcess();
          handle.process = restarted.child;
          handle.currentHourKey = restarted.hourKey;
          return;
        }
      }
      // Respawn if exited
      if (handle.process.exitCode !== null) {
        const restarted = startProcess();
        handle.process = restarted.child;
        handle.currentHourKey = restarted.hourKey;
      }
    }, 60 * 1000);
    handle.interval = interval;

    this.cameraIdToPipeline.set(cameraId, handle);
    return handle;
  }

  stopPipeline(cameraId: string) {
    const handle = this.cameraIdToPipeline.get(cameraId);
    if (!handle) return;
    try { clearInterval(handle.interval); } catch {}
    try { handle.process.kill('SIGTERM'); } catch {}
    this.cameraIdToPipeline.delete(cameraId);
  }
}

export const ffmpegManager = new FfmpegManager();


