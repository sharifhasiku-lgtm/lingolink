import { AbortController } from 'bare-abort-controller';
import { DownloadCancelledError, InferenceCancelledError } from '../../errors/index.js';
import { getEngineLogger } from '../../logging/index.js';
import { getRequestRegistry } from '../../runtime/index.js';
const logger = getEngineLogger();
const activeTransfers = new Map();
let nextSubscriberId = 0;
function createSubscriber(onProgress, requestId) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        id: String(nextSubscriberId++),
        onProgress,
        settled: false,
        resolve,
        reject,
        promise,
        requestId
    };
}
function settleSubscriber(subscriber, result) {
    if (subscriber.settled)
        return;
    subscriber.settled = true;
    if (result instanceof Error) {
        subscriber.reject(result);
    }
    else {
        subscriber.resolve(result);
    }
}
function deliverProgress(transfer, subscriber, progress) {
    if (subscriber.settled || !subscriber.onProgress)
        return;
    try {
        subscriber.onProgress(progress);
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.warn('Progress callback threw; detaching subscriber', {
            downloadKey: transfer.downloadKey,
            subscriberId: subscriber.id,
            error
        });
        settleSubscriber(subscriber, error);
        removeSubscriber(transfer, subscriber.id);
    }
}
function broadcastTransferProgress(transfer, progress) {
    transfer.lastProgress = progress;
    for (const sub of Array.from(transfer.subscribers.values())) {
        deliverProgress(transfer, sub, progress);
    }
}
/**
 * Idempotent: remove the subscriber from the transfer's roster and tear
 * the transfer down iff no subscribers remain. Wired from two places per
 * subscriber:
 *
 *   - the `request.signal.addEventListener("abort", ...)` listener that
 *     fires when `registry.cancel({ requestId })` aborts the request's
 *     context — this is the "user clicked Stop" cancel path;
 *   - `request.scope.defer(...)` which runs at request scope unwind —
 *     the safety net catching every other unwind path (handler returns,
 *     handler throws for a non-cancel reason, awaited promise settled
 *     and the `await using` falls out of scope on the success path).
 *
 * Both ends call this helper so an already-cleaned-up subscriber is a
 * no-op the second time around.
 */
function removeSubscriber(transfer, subscriberId) {
    if (!transfer.subscribers.has(subscriberId))
        return;
    transfer.subscribers.delete(subscriberId);
    maybeCancelTransfer(transfer);
}
/**
 * Last-subscriber rule: when every caller has detached (cancel or
 * progress-callback throw), abort the shared transfer so the underlying
 * HTTP / hyperdrive download tears down. Until then the transfer keeps
 * running for the remaining subscribers — the content-addressed dedup
 * semantics callers rely on.
 */
function maybeCancelTransfer(transfer) {
    if (transfer.subscribers.size > 0)
        return;
    if (transfer.abortController.signal.aborted)
        return;
    logger.debug(`[download-manager] last subscriber left, aborting transfer ${transfer.downloadKey}`);
    transfer.abortController.abort(undefined);
}
function attachRequestBinding(transfer, subscriber, request) {
    const onAbort = () => {
        if (!subscriber.settled) {
            settleSubscriber(subscriber, new InferenceCancelledError(request.requestId));
        }
        removeSubscriber(transfer, subscriber.id);
    };
    if (request.signal.aborted) {
        onAbort();
        return;
    }
    request.signal.addEventListener('abort', onAbort, { once: true });
    // Safety net: scope unwind on any handler exit path triggers the same
    // cleanup. If the abort listener already ran it's a no-op. Cleaning
    // up the abort listener here keeps the parent signal from carrying a
    // dangling reference into the next request.
    request.scope.defer(() => {
        request.signal.removeEventListener('abort', onAbort);
        if (!subscriber.settled) {
            settleSubscriber(subscriber, new InferenceCancelledError(request.requestId));
        }
        removeSubscriber(transfer, subscriber.id);
    });
}
export function startOrJoinDownload(downloadKey, startDownload, onProgress, request) {
    const existing = activeTransfers.get(downloadKey);
    if (existing && !existing.abortController.signal.aborted) {
        logger.info(`📥 Reusing existing download for: ${downloadKey}`);
        const subscriber = createSubscriber(onProgress, request?.requestId);
        existing.subscribers.set(subscriber.id, subscriber);
        if (request) {
            attachRequestBinding(existing, subscriber, request);
        }
        if (existing.lastProgress) {
            deliverProgress(existing, subscriber, existing.lastProgress);
        }
        return {
            promise: subscriber.promise,
            joined: true,
            getCacheHit: () => existing.cacheHit
        };
    }
    const abortController = new AbortController();
    const transfer = {
        downloadKey,
        abortController,
        subscribers: new Map(),
        clearCache: false
    };
    const initialSubscriber = createSubscriber(onProgress, request?.requestId);
    transfer.subscribers.set(initialSubscriber.id, initialSubscriber);
    activeTransfers.set(downloadKey, transfer);
    if (request) {
        attachRequestBinding(transfer, initialSubscriber, request);
    }
    const downloadPromise = startDownload({
        broadcastProgress: (progress) => {
            broadcastTransferProgress(transfer, progress);
        },
        signal: abortController.signal,
        shouldClearCache: () => transfer.clearCache,
        setCacheHit: (cacheHit) => {
            transfer.cacheHit = cacheHit;
        }
    });
    transfer.downloadPromise = downloadPromise;
    downloadPromise
        .then((path) => {
        for (const sub of transfer.subscribers.values()) {
            settleSubscriber(sub, path);
        }
    }, (error) => {
        const rejection = error instanceof Error ? error : new Error(String(error));
        for (const sub of transfer.subscribers.values()) {
            settleSubscriber(sub, rejection);
        }
    })
        .finally(() => {
        if (activeTransfers.get(downloadKey) === transfer) {
            activeTransfers.delete(downloadKey);
        }
    });
    return {
        promise: initialSubscriber.promise,
        joined: false,
        getCacheHit: () => transfer.cacheHit
    };
}
/**
 * Legacy cancel entry point. Callers (`cancelHandler`'s deprecated
 * `case "downloadAsset"` arm, the shutdown sweep, intra-resolve
 * cleanup) call this with a `downloadKey`. The single source of cancel
 * routing is the request registry, so this function resolves each
 * subscriber's request via `registry.cancel({ requestId })`.
 *
 * Subscribers without a `requestId` (legacy callers that didn't pass a
 * registry binding) are settled directly with `DownloadCancelledError`
 * so we don't leak the transfer if a legacy code path holds the only
 * reference.
 */
/**
 * Set `clearCache=true` on the transfer that owns the subscriber bound
 * to `requestId`, so when the registry's targeted cancel removes that
 * subscriber and we reach last-subscriber teardown, the partial
 * download file is deleted instead of preserved for automatic resume.
 *
 * Lookup is O(transfers * subscribers); transfers are short-lived and
 * subscriber counts per transfer are tiny in practice, so this is
 * fine. Returns `true` if a matching subscriber was found, `false`
 * otherwise — the cancel handler treats both cases identically (the
 * registry cancel still fires) and the return value is informational.
 *
 * Supports `cancel({ requestId, clearCache: true })` for download
 * requests. The subscriber is the unit of `clearCache` even though the
 * flag lives on the shared transfer: if any subscriber on the transfer
 * asks for clearCache, the partial file is deleted when the last
 * subscriber leaves.
 */
export function markClearCacheForRequest(requestId) {
    for (const transfer of activeTransfers.values()) {
        for (const sub of transfer.subscribers.values()) {
            if (sub.requestId === requestId) {
                transfer.clearCache = true;
                return true;
            }
        }
    }
    return false;
}
export function cancelTransfer(downloadKey, clearCache = false) {
    const transfer = activeTransfers.get(downloadKey);
    if (!transfer)
        return;
    transfer.clearCache = clearCache;
    const registry = getRequestRegistry();
    const orphanSubs = [];
    for (const sub of Array.from(transfer.subscribers.values())) {
        if (sub.requestId !== undefined) {
            registry.cancel({
                requestId: sub.requestId,
                reason: 'download-transfer-cancel'
            });
        }
        else {
            orphanSubs.push(sub);
        }
    }
    if (orphanSubs.length === 0) {
        return;
    }
    // Legacy subscribers (no registry binding): settle each with
    // `DownloadCancelledError` and route removal through the
    // `removeSubscriber` helper so the last-subscriber teardown rule is
    // enforced in one place. Registry-bound subscribers are handled by
    // their `attachRequestBinding` listener triggered above.
    for (const sub of orphanSubs) {
        settleSubscriber(sub, new DownloadCancelledError());
        removeSubscriber(transfer, sub.id);
    }
}
export function createHyperdriveDownloadKey(hyperdriveKey, modelFileName) {
    return `${hyperdriveKey}:${modelFileName}`;
}
export function createHttpDownloadKey(url) {
    return `http:${url}`;
}
export function createRegistryDownloadKey(registrySource, registryPath) {
    return `registry:${registrySource}:${registryPath}`;
}
export function applyJoinedDownloadStats(result, hooks) {
    if (!result.joined)
        return result.promise;
    return result.promise.then((path) => {
        const cacheHit = result.getCacheHit();
        if (cacheHit === true) {
            hooks?.markCacheHit?.();
        }
        else if (cacheHit === false) {
            hooks?.markCacheMiss?.();
            hooks?.markSharedTransfer?.();
        }
        else {
            hooks?.markSharedTransfer?.();
        }
        return path;
    });
}
export function cancelAllDownloads() {
    logger.info(`🧹 Cancelling ${activeTransfers.size} active downloads`);
    for (const key of Array.from(activeTransfers.keys())) {
        cancelTransfer(key);
    }
}
let isCleaningUp = false;
export async function cleanupDownloads() {
    if (isCleaningUp)
        return;
    isCleaningUp = true;
    try {
        const downloadPromises = Array.from(activeTransfers.values())
            .filter((t) => t.downloadPromise !== undefined)
            .map((t) => t.downloadPromise.catch(() => { }));
        cancelAllDownloads();
        if (downloadPromises.length > 0) {
            await Promise.allSettled(downloadPromises);
        }
    }
    catch (error) {
        logger.error('❌ Error during download cleanup:', error);
    }
}
