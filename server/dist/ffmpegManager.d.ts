import { type ChildProcess } from 'child_process';
export type TranscodeHandle = {
    cameraId: string;
    process: ChildProcess;
    outputDir: string;
};
declare class FfmpegManager {
    private cameraIdToProcess;
    ensureTranscoding(cameraId: string, rtspUrl: string, baseOutputDir: string): TranscodeHandle;
    stopTranscoding(cameraId: string): void;
}
export declare const ffmpegManager: FfmpegManager;
export {};
//# sourceMappingURL=ffmpegManager.d.ts.map