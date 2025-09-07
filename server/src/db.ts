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

export type Camera = {
  id: string;
  name: string;
  rtsp: string;
  createdAt: string;
  recordEnabled: number; // 0 or 1
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

export default db;


