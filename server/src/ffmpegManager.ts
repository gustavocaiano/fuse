import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export type AlwaysRecordingHandle = {
  cameraId: string;
  process: ChildProcess;
  rtspUrl: string;
  currentHourKey: string;
  interval: NodeJS.Timeout;
  recordingBaseDir: string;
  hlsBaseDir: string;
  segmentMinutes: number;
  isStreamingHLS: boolean;
  hlsOutputDir: string;
};

class FfmpegManager {
  private cameraIdToHandle: Map<string, AlwaysRecordingHandle> = new Map();

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

  // Main method: Always record, optionally stream HLS
  ensureAlwaysRecording(
    cameraId: string,
    rtspUrl: string,
    recordingBaseDir: string,
    hlsBaseDir: string,
    segmentMinutes: number,
    enableHLS: boolean = false
  ): AlwaysRecordingHandle {
    const existing = this.cameraIdToHandle.get(cameraId);
    
    // If exists and HLS state matches, return it
    if (existing && existing.isStreamingHLS === enableHLS) {
      return existing;
    }

    // If exists but HLS state differs, restart with new state
    if (existing) {
      this.stopAlwaysRecording(cameraId);
    }

    const segmentSeconds = Math.max(1, Math.floor(segmentMinutes * 60));
    const hlsOutputDir = path.join(hlsBaseDir, cameraId);
    
    // Create directories
    fs.mkdirSync(recordingBaseDir, { recursive: true });
    if (enableHLS) {
      fs.mkdirSync(hlsOutputDir, { recursive: true });
    }

    const startProcess = () => {
      const now = new Date();
      const { dir, hourKey } = this.buildRecordingDir(recordingBaseDir, cameraId, now);
      fs.mkdirSync(dir, { recursive: true });

      const recordingPattern = path.join(dir, 'part-%03d.mp4');
      const hlsOutput = path.join(hlsOutputDir, 'index.m3u8');
      
      const args = [
        '-rtsp_transport', 'tcp',
        '-fflags', '+genpts+flush_packets',
        '-flags', 'low_delay',
        '-probesize', '32',
        '-analyzeduration', '0',
        '-i', rtspUrl,
        // Ultra-low latency encoding
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-profile:v', 'baseline',
        '-x264-params', 'keyint=15:min-keyint=15:scenecut=0:bframes=0',
        '-g', '15',
        '-sc_threshold', '0',
        '-an', // No audio for simplicity
        '-f', 'tee'
      ];

      // Build tee destinations
      let teeDestinations = `[f=segment:segment_time=${segmentSeconds}:segment_atclocktime=1:reset_timestamps=1]${recordingPattern}`;
      
      if (enableHLS) {
        teeDestinations += `|[f=hls:hls_time=0.5:hls_list_size=2:hls_flags=delete_segments+append_list+independent_segments:hls_allow_cache=0:hls_segment_type=mpegts]${hlsOutput}`;
      }

      args.push(teeDestinations);

      console.log(`Starting ${enableHLS ? 'recording+streaming' : 'recording-only'} for camera ${cameraId}`);
      
      const child = spawn('ffmpeg', args, { stdio: 'ignore' });
      
      child.on('error', (err) => {
        console.error(`FFmpeg error for camera ${cameraId}:`, err?.message || err);
        this.cameraIdToHandle.delete(cameraId);
      });

      child.on('exit', (code) => {
        console.log(`FFmpeg process for camera ${cameraId} exited with code ${code}`);
      });

      return { child, hourKey };
    };

    const initial = startProcess();
    
    const handle: AlwaysRecordingHandle = {
      cameraId,
      process: initial.child,
      rtspUrl,
      currentHourKey: initial.hourKey,
      interval: setInterval(() => {}, 1),
      recordingBaseDir,
      hlsBaseDir,
      segmentMinutes,
      isStreamingHLS: enableHLS,
      hlsOutputDir,
    };

    // Supervision interval for hourly rotation
    const interval = setInterval(() => {
      const now = new Date();
      const { hourKey: newKey } = this.buildRecordingDir(recordingBaseDir, cameraId, now);
      
      // Restart for new hour directory
      if (newKey !== handle.currentHourKey) {
        try { handle.process.kill('SIGTERM'); } catch {}
        const restarted = startProcess();
        handle.process = restarted.child;
        handle.currentHourKey = restarted.hourKey;
        console.log(`Rotated to new hour: ${newKey} for camera ${cameraId}`);
        return;
      }
      
      // Restart if process died unexpectedly
      if (handle.process.exitCode !== null) {
        const restarted = startProcess();
        handle.process = restarted.child;
        handle.currentHourKey = restarted.hourKey;
        console.log(`Restarted failed process for camera ${cameraId}`);
      }
    }, 60 * 1000);
    
    handle.interval = interval;
    this.cameraIdToHandle.set(cameraId, handle);
    return handle;
  }

  stopAlwaysRecording(cameraId: string) {
    const handle = this.cameraIdToHandle.get(cameraId);
    if (!handle) return;
    
    try { clearInterval(handle.interval); } catch {}
    try { handle.process.kill('SIGTERM'); } catch {}
    this.cameraIdToHandle.delete(cameraId);
    console.log(`Stopped always-recording for camera ${cameraId}`);
  }

  // Convenience methods for HLS control
  enableHLS(cameraId: string): boolean {
    const handle = this.cameraIdToHandle.get(cameraId);
    if (!handle) return false;

    if (handle.isStreamingHLS) return true; // Already enabled

    // Restart with HLS enabled
    this.ensureAlwaysRecording(
      cameraId,
      handle.rtspUrl,
      handle.recordingBaseDir,
      handle.hlsBaseDir,
      handle.segmentMinutes,
      true
    );
    return true;
  }

  disableHLS(cameraId: string): boolean {
    const handle = this.cameraIdToHandle.get(cameraId);
    if (!handle) return false;

    if (!handle.isStreamingHLS) return true; // Already disabled

    // Restart without HLS
    this.ensureAlwaysRecording(
      cameraId,
      handle.rtspUrl,
      handle.recordingBaseDir,
      handle.hlsBaseDir,
      handle.segmentMinutes,
      false
    );
    return true;
  }

  // Getter methods
  getHandle(cameraId: string): AlwaysRecordingHandle | undefined {
    return this.cameraIdToHandle.get(cameraId);
  }

  isRecording(cameraId: string): boolean {
    return this.cameraIdToHandle.has(cameraId);
  }

  isStreamingHLS(cameraId: string): boolean {
    const handle = this.cameraIdToHandle.get(cameraId);
    return handle?.isStreamingHLS ?? false;
  }

  // Backward compatibility methods
  ensureTranscoding(cameraId: string, rtspUrl: string, baseOutputDir: string): AlwaysRecordingHandle {
    // In the new system, this starts recording+HLS
    const recordingDir = process.env.RECORDINGS_DIR ? path.resolve(process.env.RECORDINGS_DIR) : path.join(baseOutputDir, '..', 'recordings');
    return this.ensureAlwaysRecording(cameraId, rtspUrl, recordingDir, baseOutputDir, 10, true);
  }

  stopTranscoding(cameraId: string) {
    this.disableHLS(cameraId);
  }

  ensureRecording(cameraId: string, rtspUrl: string, baseRecordingsDir: string, segmentMinutes: number): AlwaysRecordingHandle {
    // In the new system, this starts recording-only
    const hlsDir = process.env.HLS_DIR ? path.resolve(process.env.HLS_DIR) : path.join(baseRecordingsDir, '..', 'hls');
    return this.ensureAlwaysRecording(cameraId, rtspUrl, baseRecordingsDir, hlsDir, segmentMinutes, false);
  }

  stopRecording(cameraId: string) {
    this.stopAlwaysRecording(cameraId);
  }

  getStreamingHandle(cameraId: string): AlwaysRecordingHandle | undefined {
    const handle = this.cameraIdToHandle.get(cameraId);
    return handle?.isStreamingHLS ? handle : undefined;
  }

  getRecordingHandle(cameraId: string): AlwaysRecordingHandle | undefined {
    return this.cameraIdToHandle.get(cameraId);
  }

  // Legacy method for backward compatibility
  ensurePipeline(
    cameraId: string,
    rtspUrl: string,
    baseHlsDir: string,
    baseRecordingsDir: string,
    segmentMinutes: number,
    recordingEnabled: boolean
  ): AlwaysRecordingHandle {
    // Always record, optionally stream
    return this.ensureAlwaysRecording(
      cameraId,
      rtspUrl,
      baseRecordingsDir || baseHlsDir,
      baseHlsDir,
      segmentMinutes,
      true // Always enable HLS when someone requests the pipeline
    );
  }

  stopPipeline(cameraId: string) {
    this.stopAlwaysRecording(cameraId);
  }
}

export const ffmpegManager = new FfmpegManager();


