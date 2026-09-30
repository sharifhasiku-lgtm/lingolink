/**
 * Initialize the engine: start log buffering, read env, and acquire the cache
 * lock (guards the cache dir against a second instance in the same home).
 * Idempotent.
 */
export declare function initialize(): void;
export declare function isInitialized(): boolean;
/**
 * Pre-terminate cleanup, callable while the isolate is still alive. Runs the
 * shared cleanup body without releasing the cache lock, leaving the host to
 * tear the runtime down. Addons hold static `js_ref_t` handles into the current
 * isolate; without this cleanup they survive into the next isolate and crash on
 * first access.
 */
export declare function cleanupForTerminate(): Promise<void>;
/**
 * Tear the engine down: run cleanup and release the cache lock. Safe to call
 * more than once. Does not exit the process — the host owns that.
 */
export declare function close(): Promise<void>;
