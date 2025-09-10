import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

export interface StorageInfo {
  totalFiles: number;
  totalSizeBytes: number;
  oldestFile: Date | null;
  newestFile: Date | null;
  availableSpaceBytes: number;
  usedSpaceBytes: number;
}

export class StorageManager {
  private recordingsDir: string;

  constructor(recordingsDir: string) {
    this.recordingsDir = recordingsDir;
  }

  async getStorageInfo(): Promise<StorageInfo> {
    const files = await this.getAllVideoFiles();
    let totalSize = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    for (const file of files) {
      const stats = await stat(file.path);
      totalSize += stats.size;
      
      const fileDate = stats.mtime;
      if (!oldestDate || fileDate < oldestDate) {
        oldestDate = fileDate;
      }
      if (!newestDate || fileDate > newestDate) {
        newestDate = fileDate;
      }
    }

    // Get disk space info
    const diskStats = await this.getDiskSpace();

    return {
      totalFiles: files.length,
      totalSizeBytes: totalSize,
      oldestFile: oldestDate,
      newestFile: newestDate,
      availableSpaceBytes: diskStats.available,
      usedSpaceBytes: diskStats.used
    };
  }

  async cleanupOldFiles(maxAgeDays: number = 7): Promise<{ deletedFiles: number; freedBytes: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    const files = await this.getAllVideoFiles();
    let deletedCount = 0;
    let freedBytes = 0;

    for (const file of files) {
      const stats = await stat(file.path);
      
      if (stats.mtime < cutoffDate) {
        try {
          console.log(`🗑️ Deleting old recording: ${file.relativePath} (${this.formatBytes(stats.size)})`);
          await unlink(file.path);
          deletedCount++;
          freedBytes += stats.size;
        } catch (error) {
          console.error(`❌ Failed to delete ${file.path}:`, error);
        }
      }
    }

    // Clean up empty directories
    await this.cleanupEmptyDirectories();

    console.log(`✅ Cleanup complete: Deleted ${deletedCount} files, freed ${this.formatBytes(freedBytes)}`);
    return { deletedFiles: deletedCount, freedBytes };
  }

  async emergencyCleanup(targetFreeSpacePercent: number = 20): Promise<{ deletedFiles: number; freedBytes: number }> {
    const diskStats = await this.getDiskSpace();
    const totalSpace = diskStats.available + diskStats.used;
    const requiredFreeSpace = totalSpace * (targetFreeSpacePercent / 100);
    
    if (diskStats.available >= requiredFreeSpace) {
      console.log('💾 Disk space is sufficient, no emergency cleanup needed');
      return { deletedFiles: 0, freedBytes: 0 };
    }

    const spaceToClear = requiredFreeSpace - diskStats.available;
    console.log(`🚨 Emergency cleanup needed: ${this.formatBytes(spaceToClear)} to free`);

    // Get all files sorted by age (oldest first)
    const files = await this.getAllVideoFiles();
    const fileStats = await Promise.all(files.map(async (file) => {
      const stats = await stat(file.path);
      return { ...file, mtime: stats.mtime, size: stats.size };
    }));
    
    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    let deletedCount = 0;
    let freedBytes = 0;

    for (const file of fileStats) {
      if (freedBytes >= spaceToClear) break;

      try {
        console.log(`🗑️ Emergency delete: ${file.relativePath} (${this.formatBytes(file.size)})`);
        await unlink(file.path);
        deletedCount++;
        freedBytes += file.size;
      } catch (error) {
        console.error(`❌ Failed to delete ${file.path}:`, error);
      }
    }

    await this.cleanupEmptyDirectories();

    console.log(`🆘 Emergency cleanup complete: Deleted ${deletedCount} files, freed ${this.formatBytes(freedBytes)}`);
    return { deletedFiles: deletedCount, freedBytes };
  }

  private async getAllVideoFiles(): Promise<Array<{ path: string; relativePath: string }>> {
    const files: Array<{ path: string; relativePath: string }> = [];
    
    async function scanDirectory(dir: string, baseDir: string) {
      try {
        const entries = await readdir(dir);
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await stat(fullPath);
          
          if (stats.isDirectory()) {
            await scanDirectory(fullPath, baseDir);
          } else if (entry.endsWith('.mp4')) {
            const relativePath = path.relative(baseDir, fullPath);
            files.push({ path: fullPath, relativePath });
          }
        }
      } catch (error) {
        // Directory might not exist or be accessible, skip
      }
    }

    await scanDirectory(this.recordingsDir, this.recordingsDir);
    return files;
  }

  private async cleanupEmptyDirectories() {
    async function removeEmptyDirs(dir: string): Promise<boolean> {
      try {
        const entries = await readdir(dir);
        
        if (entries.length === 0) {
          await fs.promises.rmdir(dir);
          console.log(`📁 Removed empty directory: ${dir}`);
          return true;
        }

        // Check subdirectories
        let allEmpty = true;
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await stat(fullPath);
          
          if (stats.isDirectory()) {
            const wasEmpty = await removeEmptyDirs(fullPath);
            if (!wasEmpty) allEmpty = false;
          } else {
            allEmpty = false;
          }
        }

        // If all subdirectories were empty and removed, try to remove this directory
        if (allEmpty) {
          const remainingEntries = await readdir(dir);
          if (remainingEntries.length === 0) {
            await fs.promises.rmdir(dir);
            console.log(`📁 Removed empty directory: ${dir}`);
            return true;
          }
        }
        
        return false;
      } catch (error) {
        return false;
      }
    }

    await removeEmptyDirs(this.recordingsDir);
  }

  private async getDiskSpace(): Promise<{ available: number; used: number }> {
    try {
      const stats = await fs.promises.statfs(this.recordingsDir);
      const available = stats.bavail * stats.bsize;
      const total = stats.blocks * stats.bsize;
      const used = total - available;
      
      return { available, used };
    } catch (error) {
      // Fallback - assume we have some space but can't measure exactly
      console.warn('Could not get disk space stats:', error);
      return { available: 10 * 1024 * 1024 * 1024, used: 0 }; // Assume 10GB available
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatStorageInfo(info: StorageInfo): string {
    const usagePercent = info.usedSpaceBytes / (info.availableSpaceBytes + info.usedSpaceBytes) * 100;
    
    return `📊 Storage Status:
• Files: ${info.totalFiles} recordings
• Total Size: ${this.formatBytes(info.totalSizeBytes)}
• Available: ${this.formatBytes(info.availableSpaceBytes)}
• Used: ${this.formatBytes(info.usedSpaceBytes)} (${usagePercent.toFixed(1)}%)
• Oldest: ${info.oldestFile?.toISOString().split('T')[0] || 'N/A'}
• Newest: ${info.newestFile?.toISOString().split('T')[0] || 'N/A'}`;
  }
}
