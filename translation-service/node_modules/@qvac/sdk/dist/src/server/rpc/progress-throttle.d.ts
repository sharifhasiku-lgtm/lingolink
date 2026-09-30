export declare const PROGRESS_THROTTLE_MS = 150;
export declare const PROGRESS_MAX_PENDING = 100;
export type ProgressThrottle<T> = {
    push: (update: T) => void;
    flush: () => void;
};
export declare function createProgressThrottle<T>(writeBatch: (updates: T[]) => void, clock?: () => number, throttleMs?: number, maxPending?: number): ProgressThrottle<T>;
//# sourceMappingURL=progress-throttle.d.ts.map