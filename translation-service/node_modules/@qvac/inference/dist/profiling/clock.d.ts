/**
 * Millisecond clock for profiling durations. Bare has no monotonic clock
 * global, so this uses `Date.now` — ample resolution for inference timing.
 */
export declare function nowMs(): number;
export declare function measureAsync<T>(fn: () => Promise<T>): Promise<[T, number]>;
export declare function measureSync<T>(fn: () => T): [T, number];
export declare function generateProfileId(): string;
