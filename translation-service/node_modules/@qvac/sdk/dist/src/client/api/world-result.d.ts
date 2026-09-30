import { type WalkKey, type WalkKeysInput, type WorldSceneClientParams, type WorldSceneStats, type WorldSceneStreamRequest, type WorldStepClientParams, type WorldStepStats, type WorldStepStreamRequest } from '@qvac/inference/surface';
export type WorldStepStreamFactory = (request: WorldStepStreamRequest) => AsyncGenerator<unknown>;
export type WorldSceneStreamFactory = (request: WorldSceneStreamRequest) => AsyncGenerator<unknown>;
/** Mirrors `VideoProgressTick` / `DiffusionProgressTick`. */
export interface WorldStepProgressTick {
    /** Blocks completed on this session, as the engine counts them. */
    step: number;
    /**
     * Frames DELIVERED by the block that just finished — a final count, since the
     * engine emits this after the frames rather than during. Named `totalSteps`
     * only to keep the wire shape identical to `video` and `diffusion`.
     */
    totalSteps: number;
    elapsedMs: number;
}
export interface WorldStepResult {
    requestId: string;
    /** Frames of this block, yielded as the transport delivers them. */
    frameStream: AsyncGenerator<Uint8Array>;
    /**
     * The engine's own tick for each completed block, forwarded verbatim — the
     * same field shape `video` and `diffusion` expose.
     *
     * NOT mid-block liveness, and it cannot be. `WorldSessionModel.cpp` runs the
     * block to completion, delivers every frame, and only then fires its progress
     * callback: exactly one tick per block, after the frames. So this yields once
     * per `worldStep`, at the end. Use it to report what a block did; a "still
     * working" signal during the 1.8-7.5s a block takes needs an addon change.
     */
    progressStream: AsyncGenerator<WorldStepProgressTick>;
    /** Every frame of the block, once it completes. */
    frames: Promise<Uint8Array[]>;
    stats: Promise<WorldStepStats | undefined>;
}
/**
 * Completion of a scene creation. The world is live on the session either way —
 * `stats` is what tells you it finished.
 */
export interface WorldSceneResult {
    requestId: string;
    stats: Promise<WorldSceneStats | undefined>;
}
/**
 * What `worldCreateScene({ returnPack: true })` returns. `scene` exists only on
 * this shape, so the bytes cannot be awaited on a request that never asked for
 * them — the alternative, a `Promise<Uint8Array | undefined>` on one shared
 * type, pushes that check to every caller and hides it from the compiler.
 *
 * Save the bytes to walk the world again: pass the file back as
 * `modelConfig.sceneSrc` on a later `loadModel`. `sceneSrc` stays a path/URL —
 * it is resolved on the load path with every other model source.
 */
export interface WorldSceneResultWithPack extends WorldSceneResult {
    scene: Promise<Uint8Array>;
}
/**
 * Normalizes the three accepted key forms to the array the wire schema takes.
 *
 * A raw mask is accepted because the native session is ultimately driven by
 * one, and a key-state object is accepted because that is what a keyboard
 * handler naturally holds — neither should force the caller to convert.
 */
export declare function toWalkKeys(keys: WalkKeysInput | undefined): WalkKey[];
export declare function createWorldStepResult(params: WorldStepClientParams, streamFactory: WorldStepStreamFactory): WorldStepResult;
export declare function createWorldSceneResult(params: WorldSceneClientParams & {
    returnPack: true;
}, streamFactory: WorldSceneStreamFactory): WorldSceneResultWithPack;
export declare function createWorldSceneResult(params: WorldSceneClientParams & {
    returnPack?: false | undefined;
}, streamFactory: WorldSceneStreamFactory): WorldSceneResult;
export declare function createWorldSceneResult(params: WorldSceneClientParams, streamFactory: WorldSceneStreamFactory): WorldSceneResult | WorldSceneResultWithPack;
//# sourceMappingURL=world-result.d.ts.map