import { type CancelClientInput } from '../schemas/index.js';
/**
 * Cancels an ongoing operation.
 *
 * Two cancel paths are supported:
 *  - **By `requestId`** (primary) — pass the `requestId` exposed on
 *    the result of a long-running call (`completion(...)`,
 *    `loadModel(...)`, `downloadAsset(...)`, `embed(...)`,
 *    `transcribe(...)`, `ragIngest(...)`, etc.) to cancel exactly
 *    that request. A cancel that races the originating call is
 *    recorded and applied retroactively when the begin arrives.
 *  - **Broad by `modelId`** (escape hatch) — `{ modelId, kind? }`
 *    cancels every in-flight request on that model. Useful for
 *    model unload, app shutdown, or admin sweeps where the caller
 *    doesn't have a `requestId` to hand.
 *
 * The legacy `{ operation: "inference" | "embeddings", modelId }`
 * sugars remain callable for source compatibility. For migration off
 * the removed `{ operation: "downloadAsset" | "rag" }` shapes, see
 * the 0.11.0 changelog / release notes.
 *
 * @param params - The cancellation parameters.
 * @throws {QvacErrorBase} When the response type is invalid or the cancellation fails.
 *
 * @example
 * // Cancel by requestId (primary path)
 * const run = completion({ ... });
 * await cancel({ requestId: run.requestId });
 *
 * @example
 * // Broad-cancel every inference running on a model
 * await cancel({ modelId: "model-123", kind: "completion" });
 */
export declare function cancel(params: CancelClientInput): Promise<void>;
