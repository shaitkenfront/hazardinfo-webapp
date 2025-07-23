export interface CacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl: number): Promise<void>;
    invalidate(pattern: string): Promise<void>;
    close(): Promise<void>;
}
export declare class SQLiteCacheService implements CacheService {
    private db;
    private dbRun;
    private dbGet;
    private dbAll;
    private initialized;
    private closed;
    constructor(dbPath?: string);
    private initializeDatabase;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl: number): Promise<void>;
    invalidate(pattern: string): Promise<void>;
    close(): Promise<void>;
    private cleanupExpired;
    size(): Promise<number>;
    clear(): Promise<void>;
    keys(pattern?: string): Promise<string[]>;
}
export declare function getCacheService(): SQLiteCacheService;
export declare function setCacheService(service: SQLiteCacheService | null): void;
//# sourceMappingURL=CacheService.d.ts.map