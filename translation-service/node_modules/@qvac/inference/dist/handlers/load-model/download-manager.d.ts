import type { ModelProgressUpdate } from '../../schemas/index.js';
import { AbortController, type AbortSignal } from 'bare-abort-controller';
import type { DisposableScope } from '../../runtime/disposable-scope.js';
import type { DownloadHooks } from './types.js';
/**
 * Per-subscriber binding to a registry-tracked request.
 * `startOrJoinDownload` is request-aware: each caller (the
 * `await using ctx = await registry.begin(...)` inside `handleLoadModel` /
 * `handleDownloadAsset`) registers a subscriber bound to its
 * `requestId`. A `cancel({ requestId })` against the registry aborts
 * the subscriber's `ctx.signal`, which:
 *   - rejects this subscriber's promise so the awaiting handler unwinds;
 *   - removes this subscriber from `transfer.subscribers`;
 *   - tears down the transfer iff this was the last subscriber.
 *
 * The shared-transfer dedup logic in `startOrJoinDownload` is preserved
 * — two callers requesting the same `downloadKey` still share one
 * underlying download — but cancel is per-`requestId`-honest:
 * cancelling one subscriber does not affect siblings on the same
 * `downloadKey`.
 */
export interface SubscriberRequestBinding {
    signal: AbortSignal;
    scope: DisposableScope;
    requestId: string;
}
export interface Subscriber {
    id: string;
    onProgress?: ((progress: ModelProgressUpdate) => void) | undefined;
    settled: boolean;
    resolve: (path: string) => void;
    reject: (error: unknown) => void;
    promise: Promise<string>;
    /** Identity of the registry request this subscriber belongs to, if any. */
    requestId?: string | undefined;
}
export interface Transfer {
    downloadKey: string;
    abortController: AbortController;
    subscribers: Map<string, Subscriber>;
    lastProgress?: ModelProgressUpdate | undefined;
    downloadPromise?: Promise<string> | undefined;
    clearCache: boolean;
    cacheHit?: boolean;
}
export interface DownloadContext {
    broadcastProgress: (progress: ModelProgressUpdate) => void;
    signal: AbortSignal;
    shouldClearCache: () => boolean;
    setCacheHit: (cacheHit: boolean) => void;
}
export interface StartOrJoinResult {
    promise: Promise<string>;
    joined: boolean;
    getCacheHit: () => boolean | undefined;
}
export declare function startOrJoinDownload(downloadKey: string, startDownload: (ctx: DownloadContext) => Promise<string>, onProgress?: (progress: ModelProgressUpdate) => void, request?: SubscriberRequestBinding): StartOrJoinResult;
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
export declare function markClearCacheForRequest(requestId: string): boolean;
export declare function cancelTransfer(downloadKey: string, clearCache?: boolean): void;
export declare function createHyperdriveDownloadKey(hyperdriveKey: string, modelFileName: string): string;
export declare function createHttpDownloadKey(url: string): string;
export declare function createRegistryDownloadKey(registrySource: string, registryPath: string): string;
export declare function applyJoinedDownloadStats(result: StartOrJoinResult, hooks?: DownloadHooks): Promise<string>;
export declare function cancelAllDownloads(): void;
export declare function cleanupDownloads(): Promise<void>;
