"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onvifManager = void 0;
// Use require to avoid type issues if @types are not present
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Cam } = require('onvif');
class OnvifManager {
    constructor() {
        this.cameraIdToCam = new Map();
    }
    async getCamForCamera(camera) {
        const existing = this.cameraIdToCam.get(camera.id);
        if (existing)
            return existing;
        const created = this.createCam(camera);
        this.cameraIdToCam.set(camera.id, created);
        return created;
    }
    release(cameraId) {
        this.cameraIdToCam.delete(cameraId);
    }
    async continuousMove(cam, payload) {
        const x = clamp(payload.pan ?? 0) * (payload.speed ?? 1);
        const y = clamp(payload.tilt ?? 0) * (payload.speed ?? 1);
        const z = clamp(payload.zoom ?? 0) * (payload.speed ?? 1);
        const timeout = Math.max(100, Math.min(10000, payload.timeoutMs ?? 1000));
        await new Promise((resolve, reject) => {
            cam.continuousMove({ x, y, zoom: z, timeout }, (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
    async relativeMove(cam, payload) {
        const x = clamp(payload.pan ?? 0);
        const y = clamp(payload.tilt ?? 0);
        const z = clamp(payload.zoom ?? 0);
        await new Promise((resolve, reject) => {
            cam.relativeMove({ x, y, zoom: z }, (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
    async stop(cam, payload = { panTilt: true, zoom: true }) {
        await new Promise((resolve, reject) => {
            cam.stop({ panTilt: !!payload.panTilt, zoom: !!payload.zoom }, (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
    async createCam(camera) {
        const { hostname, username, password } = parseRtsp(camera.rtsp);
        const onvifPortEnv = process.env.ONVIF_PORT;
        const port = onvifPortEnv ? Number(onvifPortEnv) : 80;
        return await new Promise((resolve, reject) => {
            try {
                const cam = new Cam({
                    hostname,
                    username,
                    password,
                    port
                }, function (err) {
                    if (err)
                        return reject(err);
                    resolve(this);
                });
                void cam;
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
function clamp(value, min = -1, max = 1) {
    return Math.max(min, Math.min(max, value));
}
function parseRtsp(rtspUrl) {
    try {
        const url = new URL(rtspUrl);
        const hostname = url.hostname || '';
        const username = decodeURIComponent(url.username || '');
        const password = decodeURIComponent(url.password || '');
        return { hostname, username, password };
    }
    catch {
        // Fallback: attempt naive parse
        const withoutScheme = rtspUrl.replace(/^rtsp:\/\//i, '');
        const atIdx = withoutScheme.indexOf('@');
        const creds = atIdx !== -1 ? withoutScheme.slice(0, atIdx) : '';
        const hostPart = atIdx !== -1 ? withoutScheme.slice(atIdx + 1).split('/')[0] : withoutScheme.split('/')[0];
        const [user, pass] = creds.split(':');
        const hostname = hostPart || '';
        const username = decodeURIComponent(user || '');
        const password = decodeURIComponent(pass || '');
        return { hostname, username, password };
    }
}
exports.onvifManager = new OnvifManager();
//# sourceMappingURL=onvifManager.js.map