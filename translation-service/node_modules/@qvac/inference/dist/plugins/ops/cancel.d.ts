import { type CancelInferenceBaseParams } from '../../schemas/index.js';
import type { RequestKind } from '../../runtime/index.js';
/**
 * Broad cancel: abort every in-flight request matching `modelId` (and
 * optionally a `kind`). Maps onto `RequestRegistry.cancel({ modelId })`
 * — the registry walks active contexts and aborts each one's signal,
 * which each handler has wired to its own addon-level / async unwind
 * via the registry's `await using ctx = await registry.begin(...)` block.
 *
 * Kept as a stable surface alongside the new `cancel({ requestId })`
 * path: the caller may not have a `requestId` to hand (model unload,
 * app shutdown, admin sweeps), and the escape hatch is cheap because
 * the registry already does the matching.
 *
 * Returns the number of contexts whose abort was triggered by *this*
 * call (already-cancelled contexts are skipped so callers can rely on
 * the count to log "n requests cancelled" once). Used by the cancel
 * handler to populate `CancelResponse.cancelled` and by internal
 * callers that want to know whether anything landed.
 *
 * The function does exactly one thing — a registry walk.
 */
export declare function cancel(params: CancelInferenceBaseParams, opts?: {
    kind?: RequestKind;
}): number;
