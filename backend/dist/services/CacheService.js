"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteCacheService = void 0;
exports.getCacheService = getCacheService;
exports.setCacheService = setCacheService;
const sqlite3_1 = __importDefault(require("sqlite3"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
class SQLiteCacheService {
    constructor(dbPath) {
        this.closed = false;
        const defaultPath = path_1.default.join(process.cwd(), 'cache.db');
        this.initialized = new Promise((resolve, reject) => {
            this.db = new sqlite3_1.default.Database(dbPath || defaultPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                // Promisify database methods after successful connection
                this.dbRun = (0, util_1.promisify)(this.db.run.bind(this.db));
                this.dbGet = (0, util_1.promisify)(this.db.get.bind(this.db));
                this.dbAll = (0, util_1.promisify)(this.db.all.bind(this.db));
                // Initialize the database schema
                this.initializeDatabase().then(resolve).catch(reject);
            });
        });
    }
    async initializeDatabase() {
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
        }
        catch (error) {
            console.error('Failed to initialize cache database:', error);
            throw error;
        }
    }
    async get(key) {
        await this.initialized;
        await this.cleanupExpired();
        const now = Date.now();
        const row = await this.dbGet('SELECT value FROM cache WHERE key = ? AND expires_at > ?', [key, now]);
        if (!row) {
            return null;
        }
        try {
            return JSON.parse(row.value);
        }
        catch (error) {
            // If JSON parsing fails, remove the corrupted entry
            await this.dbRun('DELETE FROM cache WHERE key = ?', [key]);
            return null;
        }
    }
    async set(key, value, ttl) {
        await this.initialized;
        const now = Date.now();
        const expiresAt = now + (ttl * 1000); // Convert TTL from seconds to milliseconds
        const serializedValue = JSON.stringify(value);
        await this.dbRun('INSERT OR REPLACE INTO cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)', [key, serializedValue, expiresAt, now]);
    }
    async invalidate(pattern) {
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
    async close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async cleanupExpired() {
        const now = Date.now();
        await this.dbRun('DELETE FROM cache WHERE expires_at <= ?', [now]);
    }
    // Additional utility methods
    async size() {
        await this.initialized;
        const row = await this.dbGet('SELECT COUNT(*) as count FROM cache');
        return row.count;
    }
    async clear() {
        await this.initialized;
        await this.dbRun('DELETE FROM cache');
    }
    async keys(pattern) {
        await this.initialized;
        let sql = 'SELECT key FROM cache';
        let params = [];
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
exports.SQLiteCacheService = SQLiteCacheService;
// Singleton instance for application use
let cacheServiceInstance = null;
function getCacheService() {
    if (!cacheServiceInstance) {
        cacheServiceInstance = new SQLiteCacheService();
    }
    return cacheServiceInstance;
}
function setCacheService(service) {
    cacheServiceInstance = service;
}
//# sourceMappingURL=CacheService.js.map