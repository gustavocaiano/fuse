"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCameraStmt = exports.getCameraStmt = exports.listCamerasStmt = exports.insertCamera = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbFile = path_1.default.resolve(process.env.DB_FILE || path_1.default.join(process.cwd(), 'data.db'));
const db = new better_sqlite3_1.default(dbFile);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS cameras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rtsp TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
`);
exports.insertCamera = db.prepare(`
  INSERT INTO cameras (id, name, rtsp, createdAt) VALUES (@id, @name, @rtsp, @createdAt)
`);
exports.listCamerasStmt = db.prepare(`
  SELECT id, name, rtsp, createdAt FROM cameras ORDER BY createdAt DESC
`);
exports.getCameraStmt = db.prepare(`
  SELECT id, name, rtsp, createdAt FROM cameras WHERE id = ?
`);
exports.deleteCameraStmt = db.prepare(`
  DELETE FROM cameras WHERE id = ?
`);
exports.default = db;
//# sourceMappingURL=db.js.map