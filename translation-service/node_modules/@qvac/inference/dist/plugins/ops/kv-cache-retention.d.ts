export interface AutoCacheRetentionOptions {
    activeCachePaths: string[];
    maxBytes: number;
    maxIdleMs: number;
    nowMs: number;
}
export declare function markAutoCacheKey(cacheKey: string): Promise<void>;
export declare function removeAutoCacheMarker(cacheKey: string): Promise<void>;
export declare function removeAutoCacheMarkerIfMissing(cacheKey: string): Promise<void>;
export declare function isCachePathWithinDirectory(directoryPath: string, cachePath: string): boolean;
export declare function planAutoCacheEvictions(options: AutoCacheRetentionOptions): Promise<string[]>;
