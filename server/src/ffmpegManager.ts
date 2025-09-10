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
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const dir = path.join(baseDir, cameraId, year, month, day, hour);
    const hourKey = `${year}-${month}-${day}-${hour}`;
    return { dir, hourKey };
  }

  private getNext10MinuteBoundary(date: Date): Date {
    const nextBoundary = new Date(date);
    const currentMinutes = nextBoundary.getMinutes();
    
    // Calculate next 10-minute boundary (00, 10, 20, 30, 40, 50)
    const nextMinutes = Math.ceil(currentMinutes / 10) * 10;
    
    if (nextMinutes >= 60) {
      // If we go past 60, move to next hour at 00 minutes
      nextBoundary.setHours(nextBoundary.getHours() + 1);
      nextBoundary.setMinutes(0);
    } else {
      nextBoundary.setMinutes(nextMinutes);
    }
    
    nextBoundary.setSeconds(0);
    nextBoundary.setMilliseconds(0);
    return nextBoundary;
  }

  private get10MinutePeriodStart(date: Date): Date {
    const periodStart = new Date(date);
    const currentMinutes = periodStart.getMinutes();
    
    // Get current 10-minute period start (00, 10, 20, 30, 40, 50)
    const periodMinutes = Math.floor(currentMinutes / 10) * 10;
    periodStart.setMinutes(periodMinutes);
    periodStart.setSeconds(0);
    periodStart.setMilliseconds(0);
    return periodStart;
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
      
      // Calculate the current 10-minute period for proper directory and filename
      const periodStart = this.get10MinutePeriodStart(now);
      const { dir, hourKey } = this.buildRecordingDir(recordingBaseDir, cameraId, periodStart);
      fs.mkdirSync(dir, { recursive: true });

      // Create filename that reflects the 10-minute recording period
      const year = periodStart.getFullYear();
      const month = String(periodStart.getMonth() + 1).padStart(2, '0');
      const day = String(periodStart.getDate()).padStart(2, '0');
      const hour = String(periodStart.getHours()).padStart(2, '0');
      const minute = String(periodStart.getMinutes()).padStart(2, '0');
      
      const videoFilename = `${year}-${month}-${day}_${hour}-${minute}.mp4`;
      const recordingFile = path.join(dir, videoFilename);
      const hlsOutput = path.join(hlsOutputDir, 'index.m3u8');
      
      let args: string[];
      
      if (enableHLS) {
        // Both recording and HLS - use tee to split output
        args = [
          '-rtsp_transport', 'tcp',
          '-fflags', '+genpts+flush_packets',
          '-flags', 'low_delay',
          '-probesize', '32',
          '-analyzeduration', '0',
          '-i', rtspUrl,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-tune', 'zerolatency',
          '-profile:v', 'baseline',
          '-x264-params', 'keyint=15:min-keyint=15:scenecut=0:bframes=0',       
          '-b:v', '1000k',
          '-maxrate', '1200k',
          '-bufsize', '2000k',
          '-s', '1280x720',
          '-r', '15',
          '-g', '30',
          '-sc_threshold', '0',
          '-an',
          '-f', 'tee',
          '-map', '0:v',
          `[f=segment:segment_time=${segmentSeconds}:reset_timestamps=1]${recordingFile.replace('.mp4', '_%03d.mp4')}|[f=hls:hls_time=0.5:hls_list_size=2:hls_flags=delete_segments+append_list+independent_segments:hls_allow_cache=0]${hlsOutput}`
        ];
      } else {
        // Recording only - simple segment output
        args = [
          '-rtsp_transport', 'tcp',
          '-fflags', '+genpts+flush_packets',
          '-flags', 'low_delay',
          '-probesize', '32',
          '-analyzeduration', '0',
          '-i', rtspUrl,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-profile:v', 'baseline',
          '-x264-params', 'keyint=15:min-keyint=15:scenecut=0:bframes=0',
          '-b:v', '1000k',
          '-maxrate', '1200k',
          '-bufsize', '2000k',
          '-s', '1280x720',
          '-r', '15',
          '-g', '30',
          '-sc_threshold', '0',
          '-an',
          '-f', 'segment',
          '-segment_time', String(segmentSeconds),
          '-reset_timestamps', '1',
          recordingFile.replace('.mp4', '_%03d.mp4')
        ];
      }

      console.log(`Starting ${enableHLS ? 'recording+streaming' : 'recording-only'} for camera ${cameraId}`);
      console.log(`FFmpeg command: ffmpeg ${args.join(' ')}`);
      
      const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      
      // Capture stdout and stderr for debugging
      child.stdout?.on('data', (data) => {
        console.log(`FFmpeg stdout ${cameraId}: ${data}`);
      });
      
      child.stderr?.on('data', (data) => {
        console.log(`FFmpeg stderr ${cameraId}: ${data}`);
      });
      
      child.on('error', (err) => {
        console.error(`FFmpeg spawn error for camera ${cameraId}:`, err?.message || err);
        this.cameraIdToHandle.delete(cameraId);
      });

      child.on('exit', (code) => {
        console.error(`FFmpeg process for camera ${cameraId} exited with code ${code}`);
      });

      return { child, hourKey };
    };

    // Check if we should wait for the next 10-minute boundary
    const now = new Date();
    const nextBoundary = this.getNext10MinuteBoundary(now);
    const waitMs = nextBoundary.getTime() - now.getTime();
    
    let initialProcess: { child: any; hourKey: string };
    
    if (waitMs > 60000) { // If more than 1 minute to wait, start immediately
      console.log(`Starting recording immediately for camera ${cameraId}`);
      initialProcess = startProcess();
    } else if (waitMs > 5000) { // If 5 seconds to 1 minute, wait for boundary
      console.log(`Waiting ${Math.round(waitMs/1000)}s for next 10-minute boundary for camera ${cameraId}`);
      // Start a temporary process that will be replaced at the boundary
      initialProcess = startProcess();
    } else { // We're very close to or at a boundary
      console.log(`Starting at 10-minute boundary for camera ${cameraId}`);
      initialProcess = startProcess();
    }
    
    const handle: AlwaysRecordingHandle = {
      cameraId,
      process: initialProcess.child,
      rtspUrl,
      currentHourKey: initialProcess.hourKey,
      interval: setInterval(() => {}, 1),
      recordingBaseDir,
      hlsBaseDir,
      segmentMinutes,
      isStreamingHLS: enableHLS,
      hlsOutputDir,
    };

    // Supervision interval for 10-minute boundary rotation
    const interval = setInterval(() => {
      const now = new Date();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      // Check if we're at a 10-minute boundary (within 5 seconds)
      const is10MinuteBoundary = (currentMinutes % 10 === 0) && (currentSeconds <= 5);
      
      if (is10MinuteBoundary) {
        // Restart process at 10-minute boundary for new recording segment
        try { handle.process.kill('SIGTERM'); } catch {}
        const restarted = startProcess();
        handle.process = restarted.child;
        handle.currentHourKey = restarted.hourKey;
        console.log(`Rotated to new 10-minute period: ${currentMinutes} for camera ${cameraId}`);
        return;
      }
      
      // Also check for hour directory changes
      const { hourKey: newKey } = this.buildRecordingDir(recordingBaseDir, cameraId, now);
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
    }, 5 * 1000); // Check every 5 seconds for more precise boundary detection
    
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


