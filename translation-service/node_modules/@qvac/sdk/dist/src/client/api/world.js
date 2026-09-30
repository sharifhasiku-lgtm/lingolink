import { stream as streamRpc } from '../rpc/rpc-client.js';
import { createWorldSceneResult, createWorldStepResult } from './world-result.js';
export function worldCreateScene(params) {
    return createWorldSceneResult(params, streamRpc);
}
/**
 * Generates the next block of an ABot-World walk under the keys held for it.
 *
 * One call produces one block: at the default `world.numFramePerBlock`, 9 frames
 * for the first block after the session loads (decoder warmup) and 12
 * thereafter. Both counts move with `numFramePerBlock`, so read `stats.frames`
 * rather than assuming them. Frames arrive on `frameStream` as they are decoded,
 * so a viewer can display them without waiting for the block.
 *
 * Only one block runs at a time per model — a second call while one is in
 * flight is rejected rather than queued, so drive the next call off the
 * previous one. Cancelling has block granularity: the current block finishes
 * internally, delivery stops, and the call rejects rather than returning a
 * truncated block.
 *
 * `keys` accepts an array, a key-state object, or a raw 8-bit mask. WASD move,
 * IJKL steer the camera; omit for an idle block.
 *
 * `progressStream` forwards the engine's step / totalSteps / elapsedMs tick,
 * the same shape `video` and `diffusion` emit. The engine fires it once per
 * block, AFTER the frames, so it is an end-of-block summary rather than
 * mid-block liveness — one tick per `worldStep` call.
 *
 * @param params - Loaded world model ID and the keys held for this block.
 * @returns `requestId`, `frameStream`, `progressStream`, `frames` (the whole block), and `stats`.
 * @throws {RequestValidationFailedError} Client-side, before any RPC, on an
 *   unknown walk key.
 * @throws {ModelOperationNotSupportedError} If the model was not loaded with
 *   `mode: "world"`.
 * @throws {RequestRejectedByPolicyError} If a block is already in flight on
 *   this model.
 * @throws {InferenceCancelledError} If cancel by request id is accepted. The
 *   step rejects rather than resolving with a truncated block, and the session
 *   is rebuilt on the next call.
 * @throws {StreamEndedError} If the RPC stream closes without a terminal
 *   `done` chunk.
 *
 * @example Walk forward, displaying frames as they arrive
 * ```typescript
 * const { frameStream } = worldStep({ modelId, keys: ["W"] });
 * for await (const frame of frameStream) {
 *   display(frame); // PNG, or JPEG when world.frameJpegQuality is set
 * }
 * ```
 *
 * @example Report what each block did
 * ```typescript
 * const { progressStream, frames } = worldStep({ modelId, keys: ["W"] });
 * for await (const { totalSteps, elapsedMs } of progressStream) {
 *   // Once per block, after its frames: a summary, not a spinner tick.
 *   report(`block delivered ${totalSteps} frames in ${elapsedMs}ms`);
 * }
 * for (const frame of await frames) display(frame);
 * ```
 *
 * @example Drive a key loop off the one-block-at-a-time contract
 * ```typescript
 * while (walking) {
 *   const { frames } = worldStep({ modelId, keys: heldKeys }); // e.g. { W: true, L: true }
 *   for (const frame of await frames) display(frame);
 * }
 * ```
 */
export function worldStep(params) {
    return createWorldStepResult(params, streamRpc);
}
