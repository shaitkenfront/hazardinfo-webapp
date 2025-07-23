import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  close(): Promise<void>;
}

export class SQLiteCacheService implements CacheService {
  private db!: sqlite3.Database;
  private dbRun!: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  private dbGet!: (sql: string, params?: any[]) => Promise<any>;
  private dbAll!: (sql: string, params?: any[]) => Promise<any[]>;
  private initialized: Promise<void>;
  private closed: boolean = false;

  constructor(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'cache.db');
    
    this.initialized = new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath || defaultPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Promisify database methods after successful connection
        this.dbRun = promisify(this.db.run.bind(this.db));
        this.dbGet = promisify(this.db.get.bind(this.db));
        this.dbAll = promisify(this.db.all.bind(this.db));
        
        // Initialize the database schema
        this.initializeDatabase().then(resolve).catch(reject);
      });
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `;
      
      const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at)
      `;

      await this.dbRun(createTableSQL);
      await this.dbRun(createIndexSQL);
      
      // Clean up expired entries on initialization
      await this.cleanupExpired();
    } catch (error) {
      console.error('Failed to initialize cache database:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.initialized;
    await this.cleanupExpired();
    
    const now = Date.now();
    const row = await this.dbGet(
      'SELECT value FROM cache WHERE key = ? AND expires_at > ?',
      [key, now]
    );

    if (!row) {
      return null;
    }

    try {
      return JSON.parse(row.value) as T;
    } catch (error) {
      // If JSON parsing fails, remove the corrupted entry
      await this.dbRun('DELETE FROM cache WHERE key = ?', [key]);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.initialized;
    const now = Date.now();
    const expiresAt = now + (ttl * 1000); // Convert TTL from seconds to milliseconds
    const serializedValue = JSON.stringify(value);

    await this.dbRun(
      'INSERT OR REPLACE INTO cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)',
      [key, serializedValue, expiresAt, now]
    );
  }

  async invalidate(pattern: string): Promise<void> {
    await this.initialized;
    if (pattern === '*') {
      // Clear all cache
      await this.dbRun('DELETE FROM cache');
      return;
    }

    // Convert glob pattern to SQL LIKE pattern
    const sqlPattern = pattern
      .replace(/\*/g, '%')
      .replace(/\?/g, '_');

    await this.dbRun('DELETE FROM cache WHERE key LIKE ?', [sqlPattern]);
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    
    this.closed = true;
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    await this.dbRun('DELETE FROM cache WHERE expires_at <= ?', [now]);
  }

  // Additional utility methods
  async size(): Promise<number> {
    await this.initialized;
    const row = await this.dbGet('SELECT COUNT(*) as count FROM cache');
    return row.count;
  }

  async clear(): Promise<void> {
    await this.initialized;
    await this.dbRun('DELETE FROM cache');
  }

  async keys(pattern?: string): Promise<string[]> {
    await this.initialized;
    let sql = 'SELECT key FROM cache';
    let params: any[] = [];

    if (pattern) {
      const sqlPattern = pattern
        .replace(/\*/g, '%')
        .replace(/\?/g, '_');
      sql += ' WHERE key LIKE ?';
      params = [sqlPattern];
    }

    const rows = await this.dbAll(sql, params);
    return rows.map(row => row.key);
  }
}

// Singleton instance for application use
let cacheServiceInstance: SQLiteCacheService | null = null;

export function getCacheService(): SQLiteCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new SQLiteCacheService();
  }
  return cacheServiceInstance;
}

export function setCacheService(service: SQLiteCacheService | null): void {
  cacheServiceInstance = service;
}