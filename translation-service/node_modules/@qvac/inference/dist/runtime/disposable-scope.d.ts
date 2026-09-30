/**
 * Bounded-lifetime cleanup scope for an in-flight request.
 *
 * Callers register cleanup callbacks via `defer(...)` while a handler runs.
 * On `[Symbol.asyncDispose]()` (used implicitly by `await using` or
 * explicitly) every registered callback is awaited in **LIFO** order — the
 * mirror of how `try/finally` blocks would unwind in a sequential write-up
 * of the same handler.
 *
 * Guarantees:
 *
 *  - **Idempotent.** A scope can be disposed once. Subsequent disposes are
 *    no-ops; subsequent `defer` calls run the cleanup eagerly so callers
 *    never silently leak a deferred resource if they hand a deferred
 *    callback to an already-disposed scope.
 *  - **Error aggregation.** Every deferred cleanup runs even when an
 *    earlier one throws. If a single cleanup throws, that error is
 *    rethrown verbatim. If two or more throw, an `AggregateError` is
 *    rethrown carrying every failure in the order it occurred. The
 *    handler unwinding the scope can therefore see _all_ cleanup
 *    failures, not just the first one.
 */
export interface DisposableScope {
    /**
     * Register a cleanup callback. Cleanups run on dispose in LIFO order.
     * Calling `defer` after the scope has been disposed runs the cleanup
     * eagerly so resources never leak silently.
     */
    defer(cleanup: () => Promise<void> | void): void;
    /** Run all registered cleanups. Idempotent. */
    [Symbol.asyncDispose](): Promise<void>;
    /** True after the first dispose has been initiated. */
    readonly disposed: boolean;
}
export declare function createDisposableScope(): DisposableScope;
