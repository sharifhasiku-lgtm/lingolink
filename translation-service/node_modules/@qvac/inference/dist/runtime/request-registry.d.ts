import { type AbortSignal } from 'bare-abort-controller';
import type { RequestContext, RequestKind } from './request-context.js';
import type { Logger } from '../logging/types.js';
/**
 * Outcome the caller declares when terminating a request through
 * `registry.end(...)`. The registry maps it to a terminal `RequestState`
 * before disposing the scope so observers see a coherent final state.
 */
export type RequestOutcome = 'completed' | 'failed' | 'cancelled';
export interface BeginOpts {
    /** Stable identity. Caller-provided so a `cancel` can target it by id. */
    requestId: string;
    kind: RequestKind;
    modelId?: string;
    /**
     * Optional parent abort signal — typically the process-level "shutdown"
     * signal. When the parent aborts, the request's own signal aborts too.
     * Composes through a `addEventListener("abort", ...)` hook so cancelling
     * the parent does not require iterating the registry.
     */
    parentSignal?: AbortSignal;
    /**
     * Per-request override of the kind policy's `maxConcurrentPerModel`. The
     * policy value is one number for every model of a kind, but handlers may
     * use a loaded model's `parallel` as its top-level request-permit cap.
     * This counts requests, not native sequences: a multi-prompt batch still
     * consumes one permit and the addon schedules its sequences internally.
     * Must be uniform across all requests routed to the same `(lane, modelId)`
     * (a given model always yields the same `parallel`): the FIFO slot
     * hand-off assumes one cap per lane and does not re-check it. A finite
     * value below 1 is floored to 1.
     */
    maxConcurrentPerModel?: number;
}
export interface CancelByRequestId {
    requestId: string;
    reason?: string;
}
export interface CancelByModelId {
    modelId: string;
    kind?: RequestKind;
    reason?: string;
}
export type CancelTarget = CancelByRequestId | CancelByModelId;
/**
 * Per-kind admission rule. Kinds without a registered policy have no
 * admission control (every `begin(...)` is accepted as long as the
 * request id is unique).
 *
 * The policy turns admission into a per-`(kind, modelId)` FIFO queue with
 * a configurable concurrency limit. A second concurrent request to the
 * same `(kind, modelId)` *waits its turn* (default) rather than colliding
 * on the single native llama.cpp context. The limit is forward-compatible
 * with addon-side continuous batching: bump `maxConcurrentPerModel` to the
 * addon's slot count to flip serial execution to N-way concurrent without
 * any further change.
 *
 * Requests without a `modelId` are never gated (there is no per-model
 * identity to serialize against).
 */
export interface ConcurrencyPolicy {
    kind: RequestKind;
    /**
     * Max simultaneously in-flight requests per `(kind, modelId)`.
     * Default: `Infinity` (no admission limit). Set `1` to serialize, or
     * `N` for N-way concurrency (the future continuous-batching slot
     * count). Non-finite values disable gating entirely.
     */
    maxConcurrentPerModel?: number;
    /**
     * What a `begin(...)` does when the `(kind, modelId)` is at capacity:
     *  - `"queue"` (default): wait FIFO for a slot to free.
     *  - `"reject"`: throw `RequestRejectedByPolicyError` immediately
     *    (the legacy `oneAtATimePerModel` behavior).
     */
    onOverflow?: 'queue' | 'reject';
    /**
     * Max waiters allowed to queue per `(kind, modelId)` before further
     * begins reject with `RequestRejectedByPolicyError`. Bounds memory so a
     * runaway client can't grow the queue without limit. Default: `64`.
     * Only consulted when `onOverflow` is `"queue"`.
     */
    maxQueueDepthPerModel?: number;
    /**
     * Reject a waiter that has waited longer than this many milliseconds
     * with `RequestRejectedByPolicyError`. Default: `undefined` (wait
     * indefinitely for a slot).
     */
    queueTimeoutMs?: number;
    /**
     * @deprecated Back-compat alias. `true` normalizes to
     * `{ maxConcurrentPerModel: 1, onOverflow: "reject" }`; `false` (or
     * omitted) leaves admission unlimited. Ignored when
     * `maxConcurrentPerModel` is set explicitly.
     */
    oneAtATimePerModel?: boolean;
    /**
     * Opt several kinds into one shared admission lane per model. When set,
     * the slot is keyed on `(sharedSlotGroup, modelId)` instead of
     * `(kind, modelId)`, so requests of *different* kinds that target the
     * same model contend for the same slot pool.
     *
     * This exists to mirror an addon that serializes unrelated request
     * kinds on a single native context — e.g. `@qvac/llm-llamacpp` funnels
     * single-prompt `completion` and `batchCompletion` through one
     * per-instance run queue, so the two can't actually run at once on the
     * same model. Sharing a lane makes the admission queue the
     * authoritative serialization point rather than relying on the addon's
     * internal queue.
     */
    sharedSlotGroup?: string;
    /**
     * Admit at most one such request per lane AND only while no other request
     * holds the lane — a writer in a reader/writer lock. Used for finetune,
     * whose only cancel is the addon's global cancel: making it exclusive keeps
     * completions out of the addon while it runs, so that cancel can't hit them.
     */
    exclusive?: boolean;
}
/**
 * `ManagedRequestContext` is the value `begin(...)` resolves to. It extends
 * `RequestContext` with an async-dispose method so handlers can write:
 *
 *   await using ctx = await registry.begin({ ... });
 *
 * On dispose the scope unwinds (LIFO cleanup) and the registry slot is
 * freed. If the handler doesn't override `ctx.state` before unwinding,
 * the registry derives the terminal state from `signal.aborted` —
 * `"cancelled"` when an abort was recorded, `"completed"` otherwise.
 */
export interface ManagedRequestContext extends RequestContext {
    [Symbol.asyncDispose](): Promise<void>;
}
export interface RequestRegistry {
    /**
     * Open a new request. Returns a promise because admission may *queue*:
     * when a concurrency policy caps the `(kind, modelId)` and it's at
     * capacity with `onOverflow: "queue"`, the promise resolves once a slot
     * frees (FIFO). Callers write `await using ctx = await registry.begin(...)`.
     *
     * Rejects with:
     *  - `RequestIdConflictError` if `requestId` is already present
     *    (UUIDv4 collision is astronomically unlikely; the guard exists
     *    so a buggy client retry sending the same id can't silently
     *    overwrite an in-flight request).
     *  - `RequestRejectedByPolicyError` if a concurrency policy was
     *    registered for `opts.kind` and the new request can't be admitted:
     *    `onOverflow: "reject"` at capacity, the queue depth cap is
     *    exceeded, or the waiter's `queueTimeoutMs` elapsed.
     */
    begin(opts: BeginOpts): Promise<ManagedRequestContext>;
    /**
     * Register or replace the concurrency policy for a `RequestKind`.
     * Subsequent `begin(...)` calls for that kind run the policy before
     * allocating a controller / scope. One policy per kind — calling
     * twice replaces the previous declaration.
     *
     * @example
     *   r.policy({ kind: "completion", maxConcurrentPerModel: 1, onOverflow: "reject" });
     *   await using a = await r.begin({ requestId: "r-1", kind: "completion", modelId: "m1" });
     *   await r.begin({ requestId: "r-2", kind: "completion", modelId: "m1" });
     *   // → rejects with RequestRejectedByPolicyError (code 52420)
     */
    policy(opts: ConcurrencyPolicy): void;
    /** Look up an in-flight request by id. */
    get(requestId: string): RequestContext | null;
    /**
     * Snapshot of currently-tracked requests. Useful for diagnostics /
     * structured logs ("which requests are in flight right now?"). Returns
     * a fresh array; mutations on it are not observed by the registry.
     */
    list(): RequestContext[];
    /**
     * Cancel matching requests. Returns the number of contexts whose abort
     * was triggered by *this* call (already-cancelled contexts are skipped
     * so callers can rely on the count to log "n requests cancelled" once).
     *
     * For `{ modelId }` and an optional `kind`, cancels every active
     * request that matches the predicate. This is the broad-cancel path
     * the pre-registry `cancel({ modelId })` API maps to.
     */
    cancel(target: CancelTarget): number;
    /**
     * Cancel every active request — the process-shutdown / model-unload
     * sweep. The reason is forwarded to each request as the abort reason
     * so handler logs can distinguish a normal cancel from a sweep.
     * Resolves once all targeted contexts have flipped to `"cancelling"`;
     * scope unwinding still happens on each handler's own dispose path.
     */
    cancelAll(reason: 'shutdown' | 'modelUnload'): Promise<void>;
    /**
     * Cancel every request for a model and wait for each to fully dispose (native
     * context freed, slot released) before running `teardown` with an admission
     * barrier held — any begin for the model starts aborted — then lift it. Used
     * by model unload so the model object isn't freed while a request is still
     * mid-teardown, and no new request goes active against it during teardown.
     */
    withModelDraining(modelId: string, teardown: () => Promise<void>): Promise<void>;
    /**
     * Mark a request finished and dispose its scope. Equivalent to
     * `await ctx[Symbol.asyncDispose]()` with an explicit outcome.
     * Idempotent — calling `end` after a scope dispose is a no-op.
     */
    end(requestId: string, outcome: RequestOutcome): Promise<void>;
}
export declare function createRequestRegistry(options?: {
    /** Defaults to `getEngineLogger()`. Tests inject a stub. */
    logger?: Logger;
}): RequestRegistry;
/**
 * Test-only knobs exported for `request-registry.test.ts` so the bound
 * assertions can pin the documented limits without re-reading them via
 * fragile string comparison. **Not part of the public surface.**
 *
 * @internal
 */
export declare const __requestRegistryTestHooks: {
    cancelBeforeBeginMaxEntries: number;
    cancelBeforeBeginTtlMs: number;
    defaultMaxQueueDepthPerModel: number;
};
