-- Initialize the database schema for cam-parser

CREATE TABLE IF NOT EXISTS cameras (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rtsp TEXT NOT NULL,
  createdAt VARCHAR(255) NOT NULL,
  recordEnabled TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL,
  createdAt VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS camera_access (
  userId VARCHAR(255) NOT NULL,
  cameraId VARCHAR(255) NOT NULL,
  PRIMARY KEY (userId, cameraId),
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(cameraId) REFERENCES cameras(id) ON DELETE CASCADE
);


