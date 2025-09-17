# Cam Parser - Docker Setup

This project has been converted to use Docker Compose with MySQL as the database instead of SQLite.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd cam-parser
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to customize your database credentials if needed.

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - MySQL: localhost:3306

## Available Commands

```bash
# Build all containers
npm run docker:build

# Start all services in background
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Restart services
npm run docker:restart
```

## Services

### Client (Frontend)
- **Port:** 80
- **Technology:** React + Vite + Nginx
- **Container:** `cam-parser-client`

### Server (Backend)
- **Port:** 3000
- **Technology:** Node.js + Express + TypeScript
- **Container:** `cam-parser-server`
- **Dependencies:** FFmpeg for video processing

### MySQL Database
- **Port:** 3306
- **Container:** `cam-parser-mysql`
- **Database:** `cam_parser`
- **Persistent Volume:** `mysql_data`

## Environment Variables

Create a `.env` file with the following variables:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=cam_parser
MYSQL_USER=camuser
MYSQL_PASSWORD=campassword

# Application Configuration
NODE_ENV=production
PORT=3000
TZ=Europe/Lisbon
```

## Data Persistence

- **MySQL data:** Stored in Docker volume `mysql_data`
- **Recordings:** Stored in `./server/recordings` (mounted as volume)
- **HLS streams:** Stored in `./server/hls` (mounted as volume)

## Development

For development, you can still use the original commands:

```bash
# Start development servers
npm run dev

# Or start individually
npm run dev:server
npm run dev:client
```

## Troubleshooting

### Check container status:
```bash
docker-compose ps
```

### View logs for specific service:
```bash
docker-compose logs client
docker-compose logs server
docker-compose logs mysql
```

### Restart a specific service:
```bash
docker-compose restart server
```

### Access MySQL directly:
```bash
docker-compose exec mysql mysql -u camuser -p cam_parser
```

### Clean up (removes all data):
```bash
docker-compose down -v
```

## Architecture

The application now uses:
- **MySQL 8.0** instead of SQLite for better scalability
- **Docker Compose** for orchestration
- **Nginx** for serving the frontend and proxying API requests
- **Persistent volumes** for data storage
- **Health checks** to ensure proper startup order

## Migration from SQLite

The database schema has been automatically migrated to MySQL. The application will:
1. Connect to MySQL on startup
2. Create tables if they don't exist
3. Maintain the same API interface
4. Preserve all existing functionality




