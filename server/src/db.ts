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
  createdAt TEXT NOT NULL
);
`);

export type Camera = {
  id: string;
  name: string;
  rtsp: string;
  createdAt: string;
};

export const insertCamera = db.prepare<Camera>(`
  INSERT INTO cameras (id, name, rtsp, createdAt) VALUES (@id, @name, @rtsp, @createdAt)
`);

export const listCamerasStmt = db.prepare(`
  SELECT id, name, rtsp, createdAt FROM cameras ORDER BY createdAt DESC
`);

export const getCameraStmt = db.prepare(`
  SELECT id, name, rtsp, createdAt FROM cameras WHERE id = ?
`);

export const deleteCameraStmt = db.prepare(`
  DELETE FROM cameras WHERE id = ?
`);

export default db;


