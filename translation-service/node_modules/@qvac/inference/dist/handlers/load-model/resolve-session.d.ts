import type { AbortSignal } from 'bare-abort-controller';
import type { ModelProgressUpdate, ResolveContext } from '../../schemas/index.js';
import type { DownloadRequestBinding, ResolveResult, DownloadSecurityOptions } from './types.js';
export interface ResolveSessionOptions {
    progressCallback?: ((update: ModelProgressUpdate) => void) | undefined;
    seed?: boolean | undefined;
    profilingEnabled: boolean;
    /**
     * Optional cancel signal — typically `ctx.signal` from the surrounding
     * `await using ctx = await registry.begin(...)` block. When provided,
     * `resolveModelPath` short-circuits with `InferenceCancelledError` if the
     * signal is already aborted on entry; the same signal also propagates
     * to in-progress transfers via the request binding below so cancel
     * tears them down end-to-end.
     */
    signal?: AbortSignal | undefined;
    /**
     * Optional per-request binding threaded into every `startOrJoinDownload`
     * call. The download manager wires a per-subscriber abort listener
     * against `binding.signal`, registers a scope-defer cleanup, and stamps
     * the subscriber with `binding.requestId` so the legacy
     * `cancelTransfer(downloadKey)` path can route through
     * `registry.cancel({ requestId })`.
     */
    requestBinding?: DownloadRequestBinding | undefined;
    /**
     * Per-call HTTP download security overrides, applied to every resolve in this
     * session — the primary model and every companion asset resolved by a plugin
     * — so an explicit `requireSecureTransport` / `requireHttpChecksum` covers the
     * whole load, not just the main file.
     */
    security?: DownloadSecurityOptions | undefined;
}
export interface ResolveSession {
    resolvePrimaryModelPath(modelSrc: unknown, fallbackSrc?: string): Promise<string>;
    createResolveContext(modelSrc: string, modelType: string, modelName?: string): ResolveContext;
    getAggregateResult(): ResolveResult | undefined;
    cancelAll(): void;
}
export declare function createResolveSession(options: ResolveSessionOptions): ResolveSession;
