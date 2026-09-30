import { downloadModelFromHttp } from './http.js';
import { downloadModelFromRegistry } from './registry.js';
import { downloadModelFromHyperdrive } from './hyperdrive.js';
import { nowMs } from '../../profiling/index.js';
function createStatsCollector() {
    return {
        maxBytesDownloaded: 0,
        startTimeMs: nowMs(),
        cacheHit: undefined,
        sharedTransfer: false,
        checksumValidationTimeMsTotal: 0
    };
}
function createStatsHooks(collector) {
    return {
        markCacheHit: () => {
            if (collector.cacheHit === undefined) {
                collector.cacheHit = true;
                collector.maxBytesDownloaded = 0;
            }
        },
        markCacheMiss: () => {
            collector.cacheHit = false;
        },
        markSharedTransfer: () => {
            collector.sharedTransfer = true;
        },
        addChecksumValidationTimeMs: (durationMs) => {
            collector.checksumValidationTimeMsTotal += durationMs;
        }
    };
}
function wrapProgressCallback(collector, originalCallback) {
    return (progress) => {
        // Don't track bytes for cache hits (they're not real network transfer)
        if (collector.cacheHit !== true) {
            const downloaded = progress.fileSetInfo?.overallDownloaded ??
                progress.shardInfo?.overallDownloaded ??
                progress.downloaded ??
                0;
            collector.maxBytesDownloaded = Math.max(collector.maxBytesDownloaded, downloaded);
        }
        originalCallback?.(progress);
    };
}
function computeStats(collector) {
    const downloadTimeMs = nowMs() - collector.startTimeMs;
    const totalBytesDownloaded = collector.maxBytesDownloaded;
    const stats = {};
    if (collector.sharedTransfer) {
        stats.sharedTransfer = true;
    }
    if (collector.cacheHit !== undefined) {
        stats.cacheHit = collector.cacheHit;
    }
    if (collector.checksumValidationTimeMsTotal > 0) {
        stats.checksumValidationTimeMs = collector.checksumValidationTimeMsTotal;
    }
    if (collector.cacheHit === true) {
        return Object.keys(stats).length > 0 ? stats : undefined;
    }
    if (collector.sharedTransfer) {
        if (downloadTimeMs > 0) {
            stats.downloadTimeMs = downloadTimeMs;
        }
        return Object.keys(stats).length > 0 ? stats : undefined;
    }
    if (totalBytesDownloaded > 0) {
        stats.downloadTimeMs = downloadTimeMs;
        stats.totalBytesDownloaded = totalBytesDownloaded;
        if (downloadTimeMs > 0) {
            stats.downloadSpeedBps = (totalBytesDownloaded * 1000) / downloadTimeMs;
        }
    }
    return Object.keys(stats).length > 0 ? stats : undefined;
}
export async function downloadModelFromHttpWithStats(url, progressCallback, downloadHooks, security) {
    const collector = createStatsCollector();
    const hooks = { ...downloadHooks, ...createStatsHooks(collector) };
    const wrappedCallback = wrapProgressCallback(collector, progressCallback);
    const path = await downloadModelFromHttp(url, wrappedCallback, hooks, security);
    const stats = computeStats(collector);
    return stats ? { path, stats } : { path };
}
export async function downloadModelFromRegistryWithStats(registryPath, registrySource, progressCallback, expectedChecksum, downloadHooks, explicitMetadata) {
    const collector = createStatsCollector();
    const hooks = { ...downloadHooks, ...createStatsHooks(collector) };
    const wrappedCallback = wrapProgressCallback(collector, progressCallback);
    const path = await downloadModelFromRegistry(registryPath, registrySource, wrappedCallback, expectedChecksum, hooks, explicitMetadata);
    const stats = computeStats(collector);
    return stats ? { path, stats } : { path };
}
export async function downloadModelFromHyperdriveWithStats(hyperdriveKey, modelFileName, seed, progressCallback, downloadHooks) {
    const collector = createStatsCollector();
    const hooks = { ...downloadHooks, ...createStatsHooks(collector) };
    const wrappedCallback = wrapProgressCallback(collector, progressCallback);
    const path = await downloadModelFromHyperdrive(hyperdriveKey, modelFileName, seed, wrappedCallback, hooks);
    const stats = computeStats(collector);
    return stats ? { path, stats } : { path };
}
export function mergeDownloadStats(results) {
    const stats = results
        .map((r) => r.downloadStats)
        .filter((s) => s !== undefined);
    if (stats.length === 0)
        return undefined;
    const downloadTimeMs = Math.max(...stats.map((s) => s.downloadTimeMs ?? 0));
    const totalBytesDownloaded = stats.reduce((sum, s) => sum + (s.totalBytesDownloaded ?? 0), 0);
    const checksumValidationTimeMs = stats.reduce((sum, s) => sum + (s.checksumValidationTimeMs ?? 0), 0);
    const cacheHitValues = stats.map((s) => s.cacheHit).filter((v) => v !== undefined);
    const merged = {};
    if (downloadTimeMs > 0)
        merged.downloadTimeMs = downloadTimeMs;
    if (totalBytesDownloaded > 0)
        merged.totalBytesDownloaded = totalBytesDownloaded;
    if (downloadTimeMs > 0 && totalBytesDownloaded > 0) {
        merged.downloadSpeedBps = (totalBytesDownloaded * 1000) / downloadTimeMs;
    }
    if (checksumValidationTimeMs > 0)
        merged.checksumValidationTimeMs = checksumValidationTimeMs;
    if (cacheHitValues.length > 0)
        merged.cacheHit = cacheHitValues.every(Boolean);
    if (stats.some((s) => s.sharedTransfer))
        merged.sharedTransfer = true;
    return Object.keys(merged).length > 0 ? merged : undefined;
}
