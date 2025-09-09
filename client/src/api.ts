import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export type Camera = {
  id: string;
  name: string;
  rtsp?: string;
  createdAt: string;
  recordEnabled?: number;
};

export type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
};

export function setAuthUser(userId: string | null) {
  const clean = (userId ?? '').trim();
  if (clean) axios.defaults.headers.common['x-user-id'] = clean;
  else delete axios.defaults.headers.common['x-user-id'];
}

export async function getMe(): Promise<User | null> {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me`);
    return data as User;
  } catch {
    return null;
  }
}

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

export async function getCamera(id: string): Promise<Camera> {
  const { data } = await axios.get(`${API_BASE}/cameras/${id}`);
  return data;
}

export async function deleteCamera(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/cameras/${id}`);
}

export async function setRecording(id: string, enabled: boolean): Promise<{ id: string; recordEnabled: number }>{
  const { data } = await axios.post(`${API_BASE}/cameras/${id}/recording`, { enabled });
  return data;
}

// Admin APIs
export async function updateCamera(id: string, payload: { name: string; rtsp: string }) {
  const { data } = await axios.put(`${API_BASE}/users/cameras/${id}`, payload);
  return data as Camera;
}

export async function createUser(name: string, role: 'admin' | 'user') {
  const { data } = await axios.post(`${API_BASE}/users`, { name, role });
  return data as User;
}

export async function listUsers() {
  const { data } = await axios.get(`${API_BASE}/users`);
  return data as User[];
}

export async function grantAccess(userId: string, cameraId: string) {
  await axios.post(`${API_BASE}/users/${userId}/access/${cameraId}`);
}

export async function revokeAccess(userId: string, cameraId: string) {
  await axios.delete(`${API_BASE}/users/${userId}/access/${cameraId}`);
}

export async function getAccessibleCameraIds(): Promise<'ALL' | string[]> {
  const { data } = await axios.get(`${API_BASE}/users/me/cameras`);
  return data.cameraIds as any;
}

export async function listUsersWithAccess(cameraId: string): Promise<User[]> {
  const { data } = await axios.get(`${API_BASE}/users/cameras/${cameraId}/users`);
  return data as User[];
}

export async function ptzMove(cameraId: string, payload: { type: 'relative' | 'continuous'; pan?: number; tilt?: number; zoom?: number; speed?: number; timeoutMs?: number }) {
  await axios.post(`${API_BASE}/cameras/${cameraId}/ptz/move`, payload);
}

export async function ptzStop(cameraId: string, payload: { panTilt?: boolean; zoom?: boolean } = { panTilt: true, zoom: true }) {
  await axios.post(`${API_BASE}/cameras/${cameraId}/ptz/stop`, payload);
}

// Recording playback APIs
export async function getRecordingYears(cameraId: string): Promise<string[]> {
  const { data } = await axios.get(`${API_BASE}/cameras/${cameraId}/recordings/years`);
  return data;
}

export async function getRecordingMonths(cameraId: string, year: string): Promise<string[]> {
  const { data } = await axios.get(`${API_BASE}/cameras/${cameraId}/recordings/${year}/months`);
  return data;
}

export async function getRecordingDays(cameraId: string, year: string, month: string): Promise<string[]> {
  const { data } = await axios.get(`${API_BASE}/cameras/${cameraId}/recordings/${year}/${month}/days`);
  return data;
}

export async function getRecordingHours(cameraId: string, year: string, month: string, day: string): Promise<string[]> {
  const { data } = await axios.get(`${API_BASE}/cameras/${cameraId}/recordings/${year}/${month}/${day}/hours`);
  return data;
}

export type RecordingFile = {
  filename: string;
  size: number;
  created: string;
  modified: string;
  duration: number | null;
};

export async function getRecordingFiles(cameraId: string, year: string, month: string, day: string, hour: string): Promise<RecordingFile[]> {
  const { data } = await axios.get(`${API_BASE}/cameras/${cameraId}/recordings/${year}/${month}/${day}/${hour}/files`);
  return data;
}

// Generate video access token
export async function generateVideoToken(cameraId: string, year: string, month: string, day: string, hour: string, filename: string): Promise<string> {
  const { data } = await axios.post(`${API_BASE}/cameras/${cameraId}/recordings/${year}/${month}/${day}/${hour}/token/${filename}`);
  return data.token;
}

export function getRecordingFileUrl(cameraId: string, year: string, month: string, day: string, hour: string, filename: string, token?: string): string {
  const baseUrl = `${API_BASE}/cameras/${cameraId}/recordings/${year}/${month}/${day}/${hour}/file/${filename}`;
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
}


