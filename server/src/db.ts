import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'camuser',
  password: process.env.DB_PASSWORD || 'campassword',
  database: process.env.DB_NAME || 'cam_parser',
  timezone: process.env.TZ || 'Europe/Lisbon'
};

let pool: mysql.Pool | undefined;

export const initializeDatabase = async () => {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test the connection
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();

    // Initialize tables
    await initializeTables();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const initializeTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS cameras (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      rtsp TEXT NOT NULL,
      createdAt VARCHAR(255) NOT NULL,
      recordEnabled TINYINT(1) NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL,
      createdAt VARCHAR(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS camera_access (
      userId VARCHAR(255) NOT NULL,
      cameraId VARCHAR(255) NOT NULL,
      PRIMARY KEY (userId, cameraId),
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(cameraId) REFERENCES cameras(id) ON DELETE CASCADE
    )`
  ];

  for (const query of queries) {
    await pool.execute(query);
  }
};

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

// Camera operations
export const insertCamera = async (camera: Camera): Promise<void> => {
  if (!pool) throw new Error('Database not initialized');
  const query = `
    INSERT INTO cameras (id, name, rtsp, createdAt, recordEnabled) 
    VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(query, [camera.id, camera.name, camera.rtsp, camera.createdAt, camera.recordEnabled || 0]);
};

export const listCameras = async (): Promise<Camera[]> => {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.execute(`
    SELECT id, name, rtsp, createdAt, recordEnabled 
    FROM cameras 
    ORDER BY createdAt DESC
  `);
  return rows as Camera[];
};

export const getCamera = async (id: string): Promise<Camera | null> => {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.execute(`
    SELECT id, name, rtsp, createdAt, recordEnabled 
    FROM cameras 
    WHERE id = ?
  `, [id]);
  const cameras = rows as Camera[];
  return cameras.length > 0 ? cameras[0] : null;
};

export const deleteCamera = async (id: string): Promise<void> => {
  if (!pool) throw new Error('Database not initialized');
  await pool.execute(`DELETE FROM cameras WHERE id = ?`, [id]);
};

export const updateCameraRecording = async (id: string, recordEnabled: number): Promise<void> => {
  if (!pool) throw new Error('Database not initialized');
  await pool.execute(`
    UPDATE cameras 
    SET recordEnabled = ? 
    WHERE id = ?
  `, [recordEnabled, id]);
};

export const updateCamera = async (id: string, name: string, rtsp: string): Promise<void> => {
  if (!pool) throw new Error('Database not initialized');
  await pool.execute(`
    UPDATE cameras 
    SET name = ?, rtsp = ? 
    WHERE id = ?
  `, [name, rtsp, id]);
};

// User operations
export const insertUser = async (user: User): Promise<void> => {
  if (!pool) throw new Error('Database not initialized');
  const query = `
    INSERT INTO users (id, name, role, createdAt) 
    VALUES (?, ?, ?, ?)
  `;
  await pool.execute(query, [user.id, user.name, user.role, user.createdAt]);
};

export const listUsers = async (): Promise<User[]> => {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.execute(`
    SELECT id, name, role, createdAt 
    FROM users 
    ORDER BY createdAt DESC
  `);
  return rows as User[];
};

export const getUser = async (id: string): Promise<User | null> => {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.execute(`
    SELECT id, name, role, createdAt 
    FROM users 
    WHERE id = ?
  `, [id]);
  const users = rows as User[];
  return users.length > 0 ? users[0] : null;
};

export const grantAccess = async (userId: string, cameraId: string): Promise<void> => {
  if (!pool) throw new Error('Database not initialized');
  await pool.execute(`
    INSERT IGNORE INTO camera_access (userId, cameraId) 
    VALUES (?, ?)
  `, [userId, cameraId]);
};

export const revokeAccess = async (userId: string, cameraId: string): Promise<void> => {
  if (!pool) throw new Error('Database not initialized');
  await pool.execute(`
    DELETE FROM camera_access 
    WHERE userId = ? AND cameraId = ?
  `, [userId, cameraId]);
};

export const listAccessibleCameraIdsForUser = async (userId: string): Promise<string[]> => {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.execute(`
    SELECT cameraId 
    FROM camera_access 
    WHERE userId = ?
  `, [userId]);
  return (rows as { cameraId: string }[]).map(row => row.cameraId);
};

export const listUsersWithAccessForCamera = async (cameraId: string): Promise<User[]> => {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.execute(`
    SELECT u.id, u.name, u.role, u.createdAt 
    FROM users u
    INNER JOIN camera_access a ON a.userId = u.id
    WHERE a.cameraId = ?
  `, [cameraId]);
  return rows as User[];
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
  }
};

export default () => pool;