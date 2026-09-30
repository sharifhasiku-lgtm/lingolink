export declare function initializeWorker(): {
    hasRPCConfig: boolean;
};
export declare function ensureRPCSetup(): void;
export declare function isWorkerInitialized(): boolean;
export type WorkerShutdownReason = 'signal' | 'rpc-close' | 'uncaught-exception' | 'unhandled-rejection' | 'ipc-disconnect';
/**
 * Pre-terminate cleanup, callable while the worker is still alive.
 *
 * On platforms where the worker lives in the same OS process as the JS host
 * (i.e. mobile via react-native-bare-kit Worklet), `Bare.exit()` would kill the
 * entire app. This path runs the engine's cleanup (models, swarm, RAG,
 * downloads, registry client, plugin/addon registries) without releasing the
 * worker lock or exiting, leaving the caller (typically the SDK client about to
 * call `worklet.terminate()`) responsible for tearing the worker down.
 *
 * Critical for clean termination: addons hold static state with js_ref_t
 * handles into the current V8 isolate; without this cleanup, those refs survive
 * into the next worklet's isolate and crash on first access.
 */
export declare function cleanupForTerminate(): Promise<void>;
export declare function shutdownWorker(reason: WorkerShutdownReason): Promise<void>;
//# sourceMappingURL=lifecycle.d.ts.map