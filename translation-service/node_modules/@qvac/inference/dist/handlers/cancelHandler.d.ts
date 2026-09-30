import type { CancelRequest, CancelResponse } from '../schemas/cancel.js';
/**
 * Cancel handler entry point. Every long-running handler registers
 * itself on the process-singleton `RequestRegistry`, so the cancel
 * surface is two paths that route through the same registry primitive:
 *
 *  - `{ operation: "request", requestId, clearCache? }` — targeted
 *    cancel by caller-generated id. Looks up the registry entry,
 *    fires its abort signal, optionally marks the underlying download
 *    transfer for cache clear. The "stop-button race" case (a cancel
 *    beats its own begin) is handled inside the
 *    registry via the cancel-before-begin tripwire.
 *
 *  - `{ operation: "broad", modelId, kind? }` — abort every in-flight
 *    request on a model (optionally narrowed by `kind`). Used for
 *    model unload, app shutdown, and admin sweeps where the caller
 *    has no `requestId`. Delegates to the `cancel` bare op so the
 *    `ModelNotLoadedError` validation is shared with internal
 *    engine-side broad cancels.
 *
 * Always returns `success: true` plus a `cancelled` count (the number
 * of contexts this call flipped to `cancelling` — already-cancelled
 * contexts are not counted). A targeted cancel with no in-flight
 * match still returns `success: true, cancelled: 0`; the
 * cancel-before-begin tripwire ensures the cancel is applied
 * retroactively if a matching begin arrives within the registry's
 * race window.
 */
export declare function cancelHandler(request: CancelRequest): CancelResponse;
