var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
import { PROFILING_KEY, OPERATION_EVENT_KEY } from '../schemas/index.js';
import { resolveModelPath, resolveModelPathWithStats } from './load-model/resolve.js';
import { buildDownloadProfilingFields } from './load-model/types.js';
import { nowMs, generateProfileId } from '../profiling/clock.js';
import { getEngineLogger } from '../logging/index.js';
import { getRequestRegistry, withRequestContext } from '../runtime/index.js';
import { generateRandomRequestId } from '../runtime/request-id.js';
import { InferenceCancelledError } from '../errors/index.js';
const logger = getEngineLogger();
export async function handleDownloadAsset(request, progressCallback) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
        const { assetSrc, seed, requireHttpChecksum, requireSecureTransport } = request;
        const security = { requireHttpChecksum, requireSecureTransport };
        const profilingMeta = request[PROFILING_KEY];
        const profilingEnabled = profilingMeta?.enabled !== false && !!profilingMeta;
        const requestId = request.requestId ?? generateRandomRequestId();
        // `downloadAsset` is artifact-shaped, not model-shaped — there is no
        // `modelId` to register on the registry entry. Cancel by `requestId`
        // is the primary path; `cancel({ modelId })` is intentionally a
        // non-match for this kind.
        const ctx = __addDisposableResource(env_1, await getRequestRegistry().begin({
            requestId,
            kind: 'downloadAsset'
        }), true);
        const log = withRequestContext(getEngineLogger(), ctx);
        log.debug(`downloadAsset start assetSrc=${assetSrc}`);
        const hooks = {
            requestBinding: {
                signal: ctx.signal,
                scope: ctx.scope,
                requestId
            }
        };
        try {
            const totalDownloadStart = profilingEnabled ? nowMs() : 0;
            let sourceType;
            let downloadStats;
            if (profilingEnabled) {
                const result = await resolveModelPathWithStats(assetSrc, progressCallback, seed, ctx.signal, hooks, undefined, security);
                sourceType = result.sourceType;
                downloadStats = result.downloadStats;
            }
            else {
                await resolveModelPath(assetSrc, progressCallback, seed, ctx.signal, hooks, undefined, security);
            }
            const response = {
                type: 'downloadAsset',
                success: true,
                assetId: assetSrc
            };
            if (profilingEnabled) {
                const totalDownloadTimeMs = nowMs() - totalDownloadStart;
                const profileId = profilingMeta?.id ?? generateProfileId();
                const { gauges, tags } = buildDownloadProfilingFields(downloadStats, sourceType);
                gauges['totalDownloadTime'] = totalDownloadTimeMs;
                const operationEvent = {
                    op: 'downloadAsset',
                    kind: 'handler',
                    ms: totalDownloadTimeMs,
                    profileId,
                    gauges: Object.keys(gauges).length > 0 ? gauges : undefined,
                    tags: Object.keys(tags).length > 0 ? tags : undefined
                };
                response[OPERATION_EVENT_KEY] = operationEvent;
            }
            return response;
        }
        catch (error) {
            // Mirror the load-model handler's cancel contract: a typed cancel
            // bubbles up as the rejection so client-side callers can branch on
            // `instanceof InferenceCancelledError`. Every other error keeps
            // the legacy `success: false` envelope.
            if (error instanceof InferenceCancelledError) {
                log.info(`downloadAsset cancelled requestId=${requestId}`);
                throw error;
            }
            logger.error('Error downloading asset:', error);
            return {
                type: 'downloadAsset',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
    }
    finally {
        const result_1 = __disposeResources(env_1);
        if (result_1)
            await result_1;
    }
}
