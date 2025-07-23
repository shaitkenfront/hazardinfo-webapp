import { SQLiteCacheService, getCacheService, setCacheService } from '../CacheService';
import fs from 'fs';
import path from 'path';

describe('SQLiteCacheService', () => {
  let cacheService: SQLiteCacheService;
  let testDbPath: string;

  beforeEach(() => {
    // Create a unique test database for each test
    testDbPath = path.join(__dirname, `test-cache-${Date.now()}-${Math.random()}.db`);
    cacheService = new SQLiteCacheService(testDbPath);
  });

  afterEach(async () => {
    try {
      await cacheService.close();
    } catch (error) {
      // Ignore close errors
    }
    
    // Clean up test database file with retry
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('set and get operations', () => {
    it('should store and retrieve a string value', async () => {
      const key = 'test-string';
      const value = 'Hello, World!';
      const ttl = 60; // 60 seconds

      await cacheService.set(key, value, ttl);
      const retrieved = await cacheService.get<string>(key);

      expect(retrieved).toBe(value);
    });

    it('should store and retrieve an object value', async () => {
      const key = 'test-object';
      const value = { name: 'John', age: 30, active: true };
      const ttl = 60;

      await cacheService.set(key, value, ttl);
      const retrieved = await cacheService.get<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should store and retrieve an array value', async () => {
      const key = 'test-array';
      const value = [1, 2, 3, 'four', { five: 5 }];
      const ttl = 60;

      await cacheService.set(key, value, ttl);
      const retrieved = await cacheService.get<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const retrieved = await cacheService.get('non-existent-key');
      expect(retrieved).toBeNull();
    });

    it('should overwrite existing key with new value', async () => {
      const key = 'overwrite-test';
      const value1 = 'first value';
      const value2 = 'second value';
      const ttl = 60;

      await cacheService.set(key, value1, ttl);
      await cacheService.set(key, value2, ttl);
      
      const retrieved = await cacheService.get<string>(key);
      expect(retrieved).toBe(value2);
    });
  });

  describe('TTL (Time To Live) functionality', () => {
    it('should return null for expired entries', async () => {
      const key = 'expired-test';
      const value = 'This will expire';
      const ttl = 1; // 1 second

      await cacheService.set(key, value, ttl);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const retrieved = await cacheService.get<string>(key);
      expect(retrieved).toBeNull();
    });

    it('should return value before expiration', async () => {
      const key = 'not-expired-test';
      const value = 'This should not expire yet';
      const ttl = 5; // 5 seconds

      await cacheService.set(key, value, ttl);
      
      // Check immediately
      const retrieved = await cacheService.get<string>(key);
      expect(retrieved).toBe(value);
    });

    it('should handle zero TTL correctly', async () => {
      const key = 'zero-ttl-test';
      const value = 'Zero TTL';
      const ttl = 0;

      await cacheService.set(key, value, ttl);
      
      // Should be expired immediately
      const retrieved = await cacheService.get<string>(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('invalidate functionality', () => {
    beforeEach(async () => {
      // Set up test data
      await cacheService.set('user:1', { name: 'John' }, 60);
      await cacheService.set('user:2', { name: 'Jane' }, 60);
      await cacheService.set('product:1', { name: 'Widget' }, 60);
      await cacheService.set('product:2', { name: 'Gadget' }, 60);
      await cacheService.set('config:app', { theme: 'dark' }, 60);
    });

    it('should invalidate all entries with wildcard pattern', async () => {
      await cacheService.invalidate('*');
      
      const user1 = await cacheService.get('user:1');
      const product1 = await cacheService.get('product:1');
      const config = await cacheService.get('config:app');
      
      expect(user1).toBeNull();
      expect(product1).toBeNull();
      expect(config).toBeNull();
    });

    it('should invalidate entries matching prefix pattern', async () => {
      await cacheService.invalidate('user:*');
      
      const user1 = await cacheService.get('user:1');
      const user2 = await cacheService.get('user:2');
      const product1 = await cacheService.get('product:1');
      const config = await cacheService.get('config:app');
      
      expect(user1).toBeNull();
      expect(user2).toBeNull();
      expect(product1).not.toBeNull();
      expect(config).not.toBeNull();
    });

    it('should invalidate entries matching suffix pattern', async () => {
      await cacheService.invalidate('*:1');
      
      const user1 = await cacheService.get('user:1');
      const user2 = await cacheService.get('user:2');
      const product1 = await cacheService.get('product:1');
      const product2 = await cacheService.get('product:2');
      
      expect(user1).toBeNull();
      expect(user2).not.toBeNull();
      expect(product1).toBeNull();
      expect(product2).not.toBeNull();
    });

    it('should invalidate specific key', async () => {
      await cacheService.invalidate('user:1');
      
      const user1 = await cacheService.get('user:1');
      const user2 = await cacheService.get('user:2');
      
      expect(user1).toBeNull();
      expect(user2).not.toBeNull();
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key2', 'value2', 60);
      await cacheService.set('key3', 'value3', 60);
    });

    it('should return correct cache size', async () => {
      const size = await cacheService.size();
      expect(size).toBe(3);
    });

    it('should clear all entries', async () => {
      await cacheService.clear();
      
      const size = await cacheService.size();
      expect(size).toBe(0);
      
      const key1 = await cacheService.get('key1');
      expect(key1).toBeNull();
    });

    it('should return all keys', async () => {
      const keys = await cacheService.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should return keys matching pattern', async () => {
      await cacheService.set('user:1', 'user1', 60);
      await cacheService.set('user:2', 'user2', 60);
      
      const userKeys = await cacheService.keys('user:*');
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
    });
  });

  describe('error handling', () => {
    it('should handle corrupted JSON data gracefully', async () => {
      // Manually insert corrupted data using the public interface
      const key = 'corrupted-key';
      
      // Wait for initialization first
      await (cacheService as any).initialized;
      
      // Access the private dbRun method through type assertion
      const dbRun = (cacheService as any).dbRun;
      await dbRun(
        'INSERT INTO cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)',
        [key, 'invalid-json{', Date.now() + 60000, Date.now()]
      );

      const retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
      
      // Verify the corrupted entry was removed
      const keys = await cacheService.keys();
      expect(keys).not.toContain(key);
    });
  });

  describe('automatic cleanup', () => {
    it('should automatically clean up expired entries on get operations', async () => {
      const key = 'cleanup-test';
      const value = 'Will be cleaned up';
      const ttl = 1; // 1 second

      await cacheService.set(key, value, ttl);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // This should trigger cleanup
      await cacheService.get('some-other-key');
      
      // Check that expired entry was cleaned up
      const size = await cacheService.size();
      expect(size).toBe(0);
    });
  });
});

