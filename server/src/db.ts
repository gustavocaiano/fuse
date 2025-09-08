import Database from 'better-sqlite3';
import path from 'path';

const dbFile = path.resolve(process.env.DB_FILE || path.join(process.cwd(), 'data.db'));
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS cameras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rtsp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  recordEnabled INTEGER NOT NULL DEFAULT 0
);
`);

// Backfill migration: add recordEnabled if the DB was created before
const columns: Array<{ name: string }> = db.prepare(`PRAGMA table_info(cameras)`).all() as any;
if (!columns.some(c => c.name === 'recordEnabled')) {
  db.exec(`ALTER TABLE cameras ADD COLUMN recordEnabled INTEGER NOT NULL DEFAULT 0`);
}

// Users and access control
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','user')),
  createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS camera_access (
  userId TEXT NOT NULL,
  cameraId TEXT NOT NULL,
  PRIMARY KEY (userId, cameraId),
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(cameraId) REFERENCES cameras(id) ON DELETE CASCADE
);
`);

export type Camera = {
  id: string;
  name: string;
  rtsp: string;
  createdAt: string;
  recordEnabled: number; // 0 or 1
};

export type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
};

export const insertCamera = db.prepare<Camera>(`
  INSERT INTO cameras (id, name, rtsp, createdAt, recordEnabled) VALUES (@id, @name, @rtsp, @createdAt, COALESCE(@recordEnabled, 0))
`);

export const listCamerasStmt = db.prepare(`
  SELECT id, name, rtsp, createdAt, recordEnabled FROM cameras ORDER BY createdAt DESC
`);

export const getCameraStmt = db.prepare(`
  SELECT id, name, rtsp, createdAt, recordEnabled FROM cameras WHERE id = ?
`);

export const deleteCameraStmt = db.prepare(`
  DELETE FROM cameras WHERE id = ?
`);

export const updateCameraRecordingStmt = db.prepare(`
  UPDATE cameras SET recordEnabled = ? WHERE id = ?
`);

export const updateCameraStmt = db.prepare(`
  UPDATE cameras SET name = @name, rtsp = @rtsp WHERE id = @id
`);

// user statements
export const insertUser = db.prepare<User>(`
  INSERT INTO users (id, name, role, createdAt) VALUES (@id, @name, @role, @createdAt)
`);

export const listUsersStmt = db.prepare(`
  SELECT id, name, role, createdAt FROM users ORDER BY createdAt DESC
`);

export const getUserStmt = db.prepare(`
  SELECT id, name, role, createdAt FROM users WHERE id = ?
`);

export const grantAccessStmt = db.prepare(`
  INSERT OR IGNORE INTO camera_access (userId, cameraId) VALUES (?, ?)
`);

export const revokeAccessStmt = db.prepare(`
  DELETE FROM camera_access WHERE userId = ? AND cameraId = ?
`);

export const listAccessibleCameraIdsForUserStmt = db.prepare(`
  SELECT cameraId FROM camera_access WHERE userId = ?
`);

export const listUsersWithAccessForCameraStmt = db.prepare(`
  SELECT u.id, u.name, u.role, u.createdAt FROM users u
  INNER JOIN camera_access a ON a.userId = u.id
  WHERE a.cameraId = ?
`);

export default db;


