import type { ShardFileMetadata } from '../../schemas/index.js';
export declare function getCacheDir(subDir: string): string;
export declare function getModelsCacheDir(): string;
export declare function getKVCacheDir(): string;
/**
 * Get cache directory for sharded model
 * Returns: cache/sharded/<hyperdriveKey>/
 */
export declare function getShardedModelCacheDir(hyperdriveKey: string): string;
/**
 * Get cache directory for a companion set.
 * Returns: cache/sets/<setKey>/
 */
export declare function getCompanionSetCacheDir(setKey: string): string;
/**
 * Get full path to a file within a companion set cache.
 * Returns: cache/sets/<setKey>/<targetName>
 */
export declare function getCompanionSetPath(setKey: string, targetName: string): string;
/**
 * Get cache path for a single (non-sharded, non-companion) registry model.
 */
export declare function getSingleFileCachePath(registryPath: string): string;
/**
 * Get full path to specific shard file
 * Returns: cache/sharded/<hyperdriveKey>/<shardFilename>
 */
export declare function getShardPath(hyperdriveKey: string, shardFilename: string): string;
/**
 * Returns the deletion target for `clearStorage`. Scoped to the QVAC cache
 * directory — companion set and legacy ONNX paths delete the parent directory.
 */
export declare function getClearStorageTarget(modelPath: string): {
    path: string;
    kind: 'file' | 'directory';
};
/**
 * Check if all shards exist and are valid (size + checksum check)
 * Returns array of missing/invalid shard indices (0-based)
 * @param onChecksumTimeMs - Optional callback to report checksum validation time
 */
export declare function checkShardCompleteness(hyperdriveKey: string, shardFilenames: readonly string[], shardMetadata: readonly ShardFileMetadata[], onChecksumTimeMs?: (ms: number) => void): Promise<number[]>;
