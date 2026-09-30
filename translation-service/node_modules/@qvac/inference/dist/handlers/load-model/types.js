export function buildDownloadProfilingFields(downloadStats, sourceType) {
    const gauges = {};
    const tags = {};
    if (downloadStats) {
        if (downloadStats.downloadTimeMs !== undefined) {
            gauges['downloadTime'] = downloadStats.downloadTimeMs;
        }
        if (downloadStats.totalBytesDownloaded !== undefined) {
            gauges['totalBytesDownloaded'] = downloadStats.totalBytesDownloaded;
        }
        if (downloadStats.downloadSpeedBps !== undefined) {
            gauges['downloadSpeedBps'] = downloadStats.downloadSpeedBps;
        }
        if (downloadStats.checksumValidationTimeMs !== undefined) {
            gauges['checksumValidationTime'] = downloadStats.checksumValidationTimeMs;
        }
        if (downloadStats.cacheHit !== undefined) {
            tags['cacheHit'] = downloadStats.cacheHit ? 'true' : 'false';
        }
        if (downloadStats.sharedTransfer) {
            tags['sharedTransfer'] = 'true';
        }
    }
    if (sourceType) {
        tags['sourceType'] = sourceType;
    }
    return { gauges, tags };
}
