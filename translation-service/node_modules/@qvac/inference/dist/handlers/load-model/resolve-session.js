import { resolveModelPath, resolveModelPathWithStats } from './resolve.js';
import { cancelTransfer } from './download-manager.js';
import { mergeDownloadStats } from './download-stats.js';
import { getRuntimeContext } from '../../runtime/state.js';
export function createResolveSession(options) {
    const { progressCallback, seed, profilingEnabled, signal, requestBinding, security } = options;
    let primaryResult;
    const resolveResults = [];
    const activeDownloadKeys = new Set();
    const downloadHooks = {
        onDownloadKey(key) {
            activeDownloadKeys.add(key);
        },
        ...(requestBinding !== undefined && { requestBinding })
    };
    async function resolvePrimaryModelPath(modelSrc, fallbackSrc) {
        if (profilingEnabled) {
            const result = await resolveModelPathWithStats(modelSrc, progressCallback, seed, signal, downloadHooks, fallbackSrc, security);
            primaryResult = result;
            resolveResults.push(result);
            return result.path;
        }
        return resolveModelPath(modelSrc, progressCallback, seed, signal, downloadHooks, fallbackSrc, security);
    }
    async function resolveForPlugin(src) {
        if (profilingEnabled) {
            const result = await resolveModelPathWithStats(src, progressCallback, seed, signal, downloadHooks, undefined, security);
            resolveResults.push(result);
            return result.path;
        }
        return resolveModelPath(src, progressCallback, seed, signal, downloadHooks, undefined, security);
    }
    function createResolveContext(modelSrc, modelType, modelName) {
        const platform = getRuntimeContext().platform;
        return {
            resolveModelPath: resolveForPlugin,
            modelSrc,
            modelType,
            ...(modelName !== undefined && { modelName }),
            ...(platform !== undefined && { platform })
        };
    }
    function getAggregateResult() {
        if (!profilingEnabled || resolveResults.length === 0)
            return undefined;
        const downloadStats = mergeDownloadStats(resolveResults);
        return {
            path: primaryResult?.path ?? resolveResults[0].path,
            sourceType: primaryResult?.sourceType ?? resolveResults[0].sourceType,
            ...(downloadStats !== undefined && { downloadStats })
        };
    }
    function cancelAll() {
        for (const key of activeDownloadKeys) {
            cancelTransfer(key);
        }
        activeDownloadKeys.clear();
    }
    return {
        resolvePrimaryModelPath,
        createResolveContext,
        getAggregateResult,
        cancelAll
    };
}
