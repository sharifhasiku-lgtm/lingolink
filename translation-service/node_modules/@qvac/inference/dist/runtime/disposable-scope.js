import { AsyncDisposeUnavailableError } from '../errors/index.js';
/**
 * Module-load guard. The whole request-lifecycle primitive stack (scopes,
 * the registry's `ManagedRequestContext`, `await using ctx = ...`) is
 * built on `Symbol.asyncDispose`, which is an ES2024 feature. If the host
 * runtime doesn't expose it (older Bare/Expo build, missing polyfill),
 * the `[Symbol.asyncDispose]:` property key in this file's `dispose`
 * function would coerce to the string `"undefined"` and silently produce
 * objects that look async-disposable but are not — handlers would leak
 * registry entries forever. Better to fail loudly at import time with a
 * clear error than to debug a slow registry leak in production.
 */
if (typeof Symbol.asyncDispose !== 'symbol') {
    throw new AsyncDisposeUnavailableError();
}
export function createDisposableScope() {
    const cleanups = [];
    let disposed = false;
    let disposing = false;
    function defer(cleanup) {
        if (disposed || disposing) {
            void runEagerly(cleanup);
            return;
        }
        cleanups.push(cleanup);
    }
    async function runEagerly(cleanup) {
        try {
            await cleanup();
        }
        catch {
            // Late-deferred cleanups have no caller waiting on them; the
            // unwinding path that disposed the scope already returned its own
            // errors. Swallowing here matches the user's intent of registering
            // a fire-and-forget cleanup.
        }
    }
    async function dispose() {
        if (disposed || disposing)
            return;
        disposing = true;
        const errors = [];
        while (cleanups.length > 0) {
            const cleanup = cleanups.pop();
            if (!cleanup)
                continue;
            try {
                await cleanup();
            }
            catch (err) {
                errors.push(err);
            }
        }
        disposed = true;
        disposing = false;
        if (errors.length === 1)
            throw errors[0];
        if (errors.length > 1) {
            throw new AggregateError(errors, `DisposableScope: ${errors.length} cleanups failed`);
        }
    }
    return {
        defer,
        [Symbol.asyncDispose]: dispose,
        get disposed() {
            return disposed;
        }
    };
}
