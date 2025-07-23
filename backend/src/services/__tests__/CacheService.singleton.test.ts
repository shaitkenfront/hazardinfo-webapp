import { SQLiteCacheService, getCacheService, setCacheService } from '../CacheService';
import fs from 'fs';
import path from 'path';

describe('Cache Service Singleton', () => {
  afterEach(async () => {
    // Reset singleton for clean tests
    setCacheService(null);
  });

  it('should return the same instance on multiple calls', () => {
    const instance1 = getCacheService();
    const instance2 = getCacheService();
    
    expect(instance1).toBe(instance2);
  });

  it('should allow setting a custom cache service instance', async () => {
    const testDbPath = path.join(__dirname, `singleton-test-${Date.now()}.db`);
    const customService = new SQLiteCacheService(testDbPath);
    
    // Wait for initialization
    await (customService as any).initialized;
    
    setCacheService(customService);
    const retrieved = getCacheService();
    
    expect(retrieved).toBe(customService);
    
    // Cleanup
    await customService.close();
    await new Promise(resolve => setTimeout(resolve, 50));
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});