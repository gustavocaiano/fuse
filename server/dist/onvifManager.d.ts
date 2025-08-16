import type { Camera } from './db';
export type PtzMovePayload = {
    type: 'continuous' | 'relative';
    pan?: number;
    tilt?: number;
    zoom?: number;
    speed?: number;
    timeoutMs?: number;
};
export type PtzStopPayload = {
    panTilt?: boolean;
    zoom?: boolean;
};
type CamInstance = any;
declare class OnvifManager {
    private cameraIdToCam;
    getCamForCamera(camera: Camera): Promise<CamInstance>;
    release(cameraId: string): void;
    continuousMove(cam: CamInstance, payload: PtzMovePayload): Promise<void>;
    relativeMove(cam: CamInstance, payload: PtzMovePayload): Promise<void>;
    stop(cam: CamInstance, payload?: PtzStopPayload): Promise<void>;
    private createCam;
}
export declare const onvifManager: OnvifManager;
export {};
//# sourceMappingURL=onvifManager.d.ts.map