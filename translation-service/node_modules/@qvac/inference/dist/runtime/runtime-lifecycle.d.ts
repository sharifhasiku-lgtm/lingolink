import type { LifecycleState, Request } from '../schemas/index.js';
export interface SuspendableSwarm {
    readonly suspended: boolean;
    suspend(): Promise<void>;
    resume(): Promise<void>;
}
export interface SuspendableStore {
    suspend(): Promise<void>;
    resume(): Promise<void>;
}
interface ResourceMeta {
    label: string;
    createdAt: number;
}
type ResumeListener = () => void;
/**
 * Register a callback fired after the runtime returns to "active". Lets in-flight
 * work (e.g. an HTTP download whose socket died while backgrounded) recover the
 * instant `resume()` runs instead of waiting for a timeout. Returns an
 * unregister function — callers MUST call it when their work finishes so the
 * listener doesn't leak into the next operation.
 */
export declare function onResume(listener: ResumeListener): () => void;
export declare function registerSwarm(swarm: SuspendableSwarm, meta: ResourceMeta): void;
export declare function unregisterSwarm(swarm: SuspendableSwarm): void;
export declare function registerCorestore(store: SuspendableStore, meta: ResourceMeta): void;
export declare function unregisterCorestore(store: SuspendableStore): void;
export declare function getLifecycleState(): LifecycleState;
export declare function assertLifecycleAllowed(request: Request): void;
export declare function getRegisteredResourceCounts(): {
    swarms: number;
    stores: number;
};
export declare function resetLifecycleState(): void;
export declare function suspendRuntime(): Promise<void>;
export declare function resumeRuntime(): Promise<void>;
export {};
