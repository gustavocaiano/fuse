import type { Camera } from './db';

// Use require to avoid type issues if @types are not present
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Cam } = require('onvif');

export type PtzMovePayload = {
  type: 'continuous' | 'relative';
  pan?: number; // -1..1
  tilt?: number; // -1..1
  zoom?: number; // -1..1
  speed?: number; // 0..1 multiplier for continuous
  timeoutMs?: number; // only for continuous
};

export type PtzStopPayload = {
  panTilt?: boolean;
  zoom?: boolean;
};

type CamInstance = any; // Cam type from 'onvif'

class OnvifManager {
  private cameraIdToCam: Map<string, Promise<CamInstance>> = new Map();

  async getCamForCamera(camera: Camera): Promise<CamInstance> {
    const existing = this.cameraIdToCam.get(camera.id);
    if (existing) return existing;
    const created = this.createCam(camera);
    this.cameraIdToCam.set(camera.id, created);
    return created;
  }

  release(cameraId: string) {
    this.cameraIdToCam.delete(cameraId);
  }

  async continuousMove(cam: CamInstance, payload: PtzMovePayload): Promise<void> {
    const x = clamp(payload.pan ?? 0) * (payload.speed ?? 1);
    const y = clamp(payload.tilt ?? 0) * (payload.speed ?? 1);
    const z = clamp(payload.zoom ?? 0) * (payload.speed ?? 1);
    const timeout = Math.max(100, Math.min(10000, payload.timeoutMs ?? 1000));
    await new Promise<void>((resolve, reject) => {
      cam.continuousMove({ x, y, zoom: z, timeout }, (err: unknown) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async relativeMove(cam: CamInstance, payload: PtzMovePayload): Promise<void> {
    const x = clamp(payload.pan ?? 0);
    const y = clamp(payload.tilt ?? 0);
    const z = clamp(payload.zoom ?? 0);
    await new Promise<void>((resolve, reject) => {
      cam.relativeMove({ x, y, zoom: z }, (err: unknown) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async stop(cam: CamInstance, payload: PtzStopPayload = { panTilt: true, zoom: true }): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      cam.stop({ panTilt: !!payload.panTilt, zoom: !!payload.zoom }, (err: unknown) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  private async createCam(camera: Camera): Promise<CamInstance> {
    const { hostname, username, password } = parseRtsp(camera.rtsp) as { hostname: string; username: string; password: string };
    const onvifPortEnv = process.env.ONVIF_PORT;
    const port = onvifPortEnv ? Number(onvifPortEnv) : 80;

    return await new Promise<CamInstance>((resolve, reject) => {
      try {
        const cam = new Cam(
          {
            hostname,
            username,
            password,
            port
          },
          function (this: CamInstance, err: unknown) {
            if (err) return reject(err);
            resolve(this);
          }
        );
        void cam;
      } catch (e) {
        reject(e);
      }
    });
  }
}

function clamp(value: number, min = -1, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function parseRtsp(rtspUrl: string): { hostname: string; username: string; password: string } {
  try {
    const url = new URL(rtspUrl);
    const hostname: string = url.hostname || '';
    const username: string = decodeURIComponent(url.username || '');
    const password: string = decodeURIComponent(url.password || '');
    return { hostname, username, password };
  } catch {
    // Fallback: attempt naive parse
    const withoutScheme = rtspUrl.replace(/^rtsp:\/\//i, '');
    const atIdx = withoutScheme.indexOf('@');
    const creds = atIdx !== -1 ? withoutScheme.slice(0, atIdx) : '';
    const hostPart = atIdx !== -1 ? withoutScheme.slice(atIdx + 1).split('/')[0] : withoutScheme.split('/')[0];
    const [user, pass] = creds.split(':');
    const hostname: string = hostPart || '';
    const username: string = decodeURIComponent(user || '');
    const password: string = decodeURIComponent(pass || '');
    return { hostname, username, password };
  }
}

export const onvifManager = new OnvifManager();


