var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
import { getModel } from '../../runtime/model-registry.js';
import { embedParamsSchema } from '../../schemas/index.js';
import { buildUnaryResult } from '../../profiling/model-execution.js';
import { EmbedNoEmbeddingsError, EmbedFailedError, InferenceCancelledError } from '../../errors/index.js';
import { nowMs } from '../../profiling/index.js';
import { getRequestRegistry, withRequestContext } from '../../runtime/index.js';
import { generateRandomRequestId } from '../../runtime/request-id.js';
import { getEngineLogger } from '../../logging/index.js';
export async function embed(params, requestId) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
        const { modelId, text } = embedParamsSchema.parse(params);
        // Open a request-scoped lifecycle. The registry routes
        // `cancel({ requestId })` and broad `cancel({ modelId, kind: "embeddings" })`
        // straight to this context's signal. Falls back to a generated
        // id if the caller didn't send one.
        const ctx = __addDisposableResource(env_1, await getRequestRegistry().begin({
            requestId: requestId ?? generateRandomRequestId(),
            kind: 'embeddings',
            modelId
        })
        // `requestLogger` is intentionally referenced once so the
        // request-scoped logger is built at handler entry per the canonical
        // shape, even when this op has no per-step emits beyond the
        // registry's own lifecycle lines. Future addon-level warns inside
        // this body should route through `requestLogger`.
        , true);
        // `requestLogger` is intentionally referenced once so the
        // request-scoped logger is built at handler entry per the canonical
        // shape, even when this op has no per-step emits beyond the
        // registry's own lifecycle lines. Future addon-level warns inside
        // this body should route through `requestLogger`.
        const requestLogger = withRequestContext(getEngineLogger(), ctx);
        const model = getModel(modelId);
        // Hard-cancel wiring: llamacpp-embedding declares
        // `cancel: { scope: "model", hard: true }`. The signal listener
        // forwards an abort to the addon so C++ work stops as soon as the
        // user cancels — mirrors the canonical handler shape documented in
        // `request-lifecycle-primitives.mdc`. The post-await
        // `signal.aborted` checks below are the soft-cancel safety net for
        // the case where the abort fires between `model.run(...)` returning
        // and `response.await()` resolving (both can take seconds on large
        // batches).
        const onAbort = () => {
            const addon = model.addon;
            if (addon?.cancel) {
                addon.cancel.call(addon).catch((err) => {
                    requestLogger.warn(`[cancel] addon.cancel() rejected during abort for modelId=${modelId}: ${err instanceof Error ? err.message : String(err)}`);
                });
            }
        };
        ctx.signal.addEventListener('abort', onAbort, { once: true });
        // `{ once: true }` does not fire if the signal is already aborted at
        // register time. The registry may abort synchronously when a
        // cancel-before-begin race resolves or the parent signal was pre-
        // aborted — re-use `onAbort` so the listener body is the single
        // source of truth for "what cancel does."
        if (ctx.signal.aborted)
            onAbort();
        ctx.scope.defer(() => {
            ctx.signal.removeEventListener('abort', onAbort);
        });
        const modelStart = nowMs();
        const response = (await model.run(text));
        if (ctx.signal.aborted) {
            throw new InferenceCancelledError(ctx.requestId);
        }
        const rawEmbeddings = await response.await();
        if (ctx.signal.aborted) {
            throw new InferenceCancelledError(ctx.requestId);
        }
        const modelExecutionMs = nowMs() - modelStart;
        const stats = {
            ...(response.stats?.total_time_ms !== undefined && { totalTime: response.stats.total_time_ms }),
            ...(response.stats?.tokens_per_second !== undefined && {
                tokensPerSecond: response.stats.tokens_per_second
            }),
            ...(response.stats?.total_tokens !== undefined && { totalTokens: response.stats.total_tokens }),
            ...(response.stats?.backendDevice !== undefined && {
                backendDevice: response.stats.backendDevice
            }),
            ...(response.stats?.context_size !== undefined && { contextSize: response.stats.context_size })
        };
        const embeddingsArray = rawEmbeddings[0];
        if (Array.isArray(text)) {
            if (!embeddingsArray || embeddingsArray.length === 0) {
                throw new EmbedNoEmbeddingsError();
            }
            const embedding = embeddingsArray.map((embeddingVector) => {
                if (!embeddingVector || embeddingVector.length === 0) {
                    throw new EmbedNoEmbeddingsError();
                }
                return normalizeVector(embeddingVector);
            });
            return buildUnaryResult({ embedding }, modelExecutionMs, stats);
        }
        else {
            const embeddingVector = embeddingsArray?.[0];
            if (!embeddingVector || embeddingVector.length === 0) {
                throw new EmbedNoEmbeddingsError();
            }
            return buildUnaryResult({ embedding: normalizeVector(embeddingVector) }, modelExecutionMs, stats);
        }
    }
    catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
    }
    finally {
        const result_1 = __disposeResources(env_1);
        if (result_1)
            await result_1;
    }
}
export function normalizeVector(vector) {
    let sumOfSquares = 0;
    for (let i = 0; i < vector.length; i++) {
        const value = vector[i];
        if (!Number.isFinite(value)) {
            throw new EmbedFailedError(`NormalizeVector: non-finite value at index ${i}: ${value}`);
        }
        sumOfSquares += value * value;
    }
    const magnitude = Math.sqrt(sumOfSquares);
    const EPS_ZERO = 1e-12;
    const UNIT_TOL = 1e-4;
    // Handle bad norms
    if (!Number.isFinite(magnitude) || magnitude < EPS_ZERO) {
        return new Array(vector.length).fill(0);
    }
    // Early exit: already ~unit length
    if (Math.abs(magnitude - 1) <= UNIT_TOL) {
        return Array.from(vector);
    }
    const inverseMagnitude = 1 / magnitude;
    const normalizedVector = new Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
        normalizedVector[i] = vector[i] * inverseMagnitude;
    }
    return normalizedVector;
}
