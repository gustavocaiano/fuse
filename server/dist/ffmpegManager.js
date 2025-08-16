"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffmpegManager = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class FfmpegManager {
    constructor() {
        this.cameraIdToProcess = new Map();
    }
    ensureTranscoding(cameraId, rtspUrl, baseOutputDir) {
        const existing = this.cameraIdToProcess.get(cameraId);
        if (existing)
            return existing;
        const outputDir = path_1.default.join(baseOutputDir, cameraId);
        fs_1.default.mkdirSync(outputDir, { recursive: true });
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
            path_1.default.join(outputDir, 'index.m3u8')
        ];
        const child = (0, child_process_1.spawn)('ffmpeg', args, { stdio: 'ignore' });
        child.on('exit', () => {
            this.cameraIdToProcess.delete(cameraId);
        });
        const handle = { cameraId, process: child, outputDir };
        this.cameraIdToProcess.set(cameraId, handle);
        return handle;
    }
    stopTranscoding(cameraId) {
        const handle = this.cameraIdToProcess.get(cameraId);
        if (!handle)
            return;
        handle.process.kill('SIGTERM');
        this.cameraIdToProcess.delete(cameraId);
    }
}
exports.ffmpegManager = new FfmpegManager();
//# sourceMappingURL=ffmpegManager.js.map