import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export type Camera = {
  id: string;
  name: string;
  rtsp: string;
  createdAt: string;
};

export async function listCameras(): Promise<Camera[]> {
  const { data } = await axios.get(`${API_BASE}/cameras`);
  return data;
}

export async function createCamera(name: string, rtsp: string): Promise<Camera> {
  const { data } = await axios.post(`${API_BASE}/cameras`, { name, rtsp });
  return data;
}

export async function startCamera(id: string): Promise<{ playlistUrl: string }> {
  const { data } = await axios.post(`${API_BASE}/cameras/${id}/start`);
  // server serves hls at same origin (client dev proxy will map): return relative url
  return data;
}

export async function ptzMove(cameraId: string, payload: { type: 'relative' | 'continuous'; pan?: number; tilt?: number; zoom?: number; speed?: number; timeoutMs?: number }) {
  await axios.post(`${API_BASE}/cameras/${cameraId}/ptz/move`, payload);
}

export async function ptzStop(cameraId: string, payload: { panTilt?: boolean; zoom?: boolean } = { panTilt: true, zoom: true }) {
  await axios.post(`${API_BASE}/cameras/${cameraId}/ptz/stop`, payload);
}


