/**
 * Distinguishes a legitimate per-call timeout from a transport failure (e.g.
 * a worker crash) for callers racing this against other rejection sources.
 */
export declare class OperationTimeoutError extends Error {
    constructor(timeoutMs: number);
}
/**
 * Wraps a promise with an optional timeout
 * If no timeout is provided, returns the original promise unchanged
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T>;
/**
 * Wraps an async generator with optional timeout per iteration
 * If no timeout is provided, returns the original generator unchanged
 */
export declare function withTimeoutStream<T>(generator: AsyncGenerator<T>, timeoutMs?: number): AsyncGenerator<T>;
//# sourceMappingURL=withTimeout.d.ts.map