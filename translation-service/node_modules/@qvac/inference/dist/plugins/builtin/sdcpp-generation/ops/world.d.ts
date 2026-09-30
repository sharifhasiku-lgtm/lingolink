import WorldStableDiffusion from '@qvac/diffusion-cpp/world';
import type { WorldConfig } from '@qvac/diffusion-cpp/world';
import type QvacLogger from '@qvac/logging';
import type { WorldSceneRequest, WorldSceneStreamResponse, WorldStepRequest, WorldStepStreamResponse } from '../../../../schemas/sdcpp-config.js';
interface WorldSessionArgs {
    modelId: string;
    files: {
        model: string;
        taehv: string;
        scene: string;
    };
    config: WorldConfig;
    /** umT5-XXL and Wan2.2 VAE, resolved at load; scene creation needs both. */
    encoders: {
        t5?: string | undefined;
        vae?: string | undefined;
    };
    /** Resolved `modelConfig.sceneSrc`, copied over the managed pack at load. */
    seedScenePath?: string | undefined;
    logger: QvacLogger;
    /**
     * The native session to drive. Constructed here when omitted, which is what
     * every caller does; injecting one is how the teardown and cancellation paths
     * are exercised, since the addon calls the engine C API directly and offers
     * no substitution point of its own.
     */
    world?: NativeWorldSession;
    /**
     * Ceiling for a generated pack, defaulting to `MAX_SCENE_PACK_BYTES`.
     * Overridable for the same reason as `world` above: the real limit is far
     * larger than anything a test should write to disk.
     */
    maxScenePackBytes?: number;
}
/** The part of `WorldStableDiffusion` this module actually uses. */
export type NativeWorldSession = Pick<WorldStableDiffusion, 'load' | 'unload' | 'step' | 'createScene' | 'cancel'>;
/**
 * All `run()` needs of a job handle is "tell me when it is over". Kept
 * structural rather than importing `QvacResponse`: the addon can resolve a
 * different copy of `@qvac/infer-base` than the SDK does, and a nominal type
 * would make this file fail to compile on the dependency layout rather than on
 * anything real.
 */
interface SettleableResponse {
    await(): Promise<unknown>;
}
export interface WorldSession {
    load(force?: boolean): Promise<void>;
    unload(): Promise<void>;
    readonly scenePath: string;
    /** Where a replacement world is generated before it is allowed to take over. */
    readonly stagingScenePath: string;
    readonly encoders: {
        t5?: string | undefined;
        vae?: string | undefined;
    };
    /**
     * `world.numFramePerBlock` as configured, or undefined for the engine default.
     * Exposed because the block's memory cost is count x resolution, and only the
     * scene op knows the resolution.
     */
    readonly numFramePerBlock: number | undefined;
    ensureActivated(): Promise<void>;
    deactivate(): Promise<void>;
    /**
     * Promote a freshly generated pack, returning its bytes only when asked. The
     * previous world is replaced only here, and the read is part of the same
     * locked step so a concurrent unload cannot delete the pack between the two.
     */
    promoteStagedScene(readBytes: boolean): Promise<Buffer | undefined>;
    /** Drop a failed generation, leaving the previous world usable. */
    discardStagedScene(): Promise<void>;
    /** Wait for native work to finish. See the note on `settleInFlight`. */
    settle(): Promise<void>;
    run<T extends SettleableResponse>(start: () => Promise<T>): Promise<T>;
    step: WorldStableDiffusion['step'];
    createScene: WorldStableDiffusion['createScene'];
    cancel(): Promise<void>;
}
/**
 * Server-side path for one session's scene pack. Derived from a hash of the
 * caller-supplied `modelId` rather than the id itself, so the id can never
 * steer the write.
 *
 * Deliberately unique per call, not per `modelId`. A pack keyed only on the
 * model id is shared state across every process using the same cache dir: two
 * workers loading the same model would write each other's world, and a pack
 * orphaned by a crashed session would be adopted by the next `load()` as if the
 * caller had built it — walking a world they never created. Neither is
 * detectable from inside the session.
 *
 * Uniqueness costs nothing here because the managed pack is not a cache: it
 * lives for exactly one loaded session, and callers who want to revisit a world
 * pass the bytes back as `modelConfig.sceneSrc`. The one invariant that does
 * matter — `createScene` writes exactly where the native session was
 * constructed to read — comes from calling this ONCE per session and storing
 * the result in `files.scene`, not from the path being reproducible.
 *
 * No garbage collection, deliberately. `unload()` removes the pack, and so does
 * worker shutdown, so only a crash or SIGKILL leaks one — bounded at roughly
 * 10 MB per lost session, and never adopted by a later run because the name is
 * unique. The obvious mtime-based sweep is NOT safe here: a pack is written once
 * at promotion and never touched again, so a session walking for hours looks
 * exactly as old as an orphan, and ~/.qvac is shared across worker processes.
 * Doing this properly needs a liveness marker like the one
 * `planAutoCacheEvictions` gets from `activeCachePaths` in
 * `server/bare/ops/kv-cache-retention.ts`. Tracked as a follow-up rather than
 * guessed at here.
 */
export declare function worldScenePath(modelId: string): string;
/**
 * Wraps `WorldStableDiffusion` so it satisfies the plugin `load()` contract.
 *
 * Two things make the raw addon unusable as a plugin model. First, `load()`
 * reads the scene pack, which does not exist yet when the caller intends to
 * build a world with `worldCreateScene` — so activation is deferred until a
 * scene is present. Second, the addon's `unload()` is synchronous down to a
 * native thread join, so calling it while a job runs blocks the worker's event
 * loop for the rest of that job (a walk block, or a whole scene encode plus its
 * ~6.9 GB of encoder loads). We therefore track the in-flight job and wait for
 * it before tearing down.
 */
export declare function createWorldSession(args: WorldSessionArgs): WorldSession;
export declare function worldStep(request: WorldStepRequest): AsyncGenerator<WorldStepStreamResponse>;
export declare function worldCreateScene(request: WorldSceneRequest): AsyncGenerator<WorldSceneStreamResponse>;
export {};
