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
import { chunk, ingest, reindex, saveEmbeddings, search, deleteEmbeddings, listWorkspaces, closeWorkspace, deleteWorkspace, DEFAULT_WORKSPACE, getActiveRagRequest, setActiveRagRequest, clearActiveRagRequest } from './index.js';
import { getRequestRegistry, withRequestContext } from '../runtime/index.js';
import { generateRandomRequestId } from '../runtime/request-id.js';
import { getEngineLogger } from '../logging/index.js';
import { profileReplyHandler, registerOperationMetrics } from '../profiling/index.js';
registerOperationMetrics({
    op: 'rag',
    kind: 'handler',
    getTags: (req) => {
        const tags = {};
        if (req.operation)
            tags['operation'] = req.operation;
        if (req.workspace)
            tags['workspace'] = req.workspace;
        return tags;
    },
    fromResult: (res) => {
        const gauges = {};
        if (res.processed !== undefined)
            gauges['processed'] = res.processed.length;
        if (res.results !== undefined)
            gauges['resultsCount'] = res.results.length;
        return Object.keys(gauges).length > 0 ? gauges : undefined;
    }
});
function createHandlerOptions(operation, workspace, signal, onProgress) {
    const options = { signal };
    if (onProgress) {
        options.onProgress = (stage, current, total) => onProgress({
            type: 'rag:progress',
            operation,
            workspace,
            stage,
            current,
            total,
            timestamp: Date.now()
        });
    }
    return options;
}
function omitOnProgress(obj) {
    const { onProgress, withProgress, ...rest } = obj;
    void onProgress;
    void withProgress;
    return rest;
}
/**
 * Begin a registry-tracked RAG context with workspace-level pre-emption.
 *
 * Workspace-level admission lives in the dispatcher rather than as a
 * registry policy primitive (it's a dispatch concern, not a registry
 * `kind` admission rule). The sequence is **cancel-prior → begin-new**:
 * if another RAG operation is already running on the same workspace,
 * cancel it first, then begin the new context. Reversing the order
 * would cancel the just-installed context.
 *
 * The workspace → requestId map is updated after `begin(...)` succeeds
 * and cleared on scope unwind via `scope.defer(...)`, with a
 * "still mine?" guard so an older op's deferred cleanup cannot stomp
 * a newer op's mapping.
 */
async function beginRagContext(workspace, requestId) {
    const registry = getRequestRegistry();
    const prev = getActiveRagRequest(workspace);
    if (prev !== undefined && prev !== requestId) {
        registry.cancel({ requestId: prev, reason: 'rag-workspace-preempt' });
    }
    const ctx = await registry.begin({
        requestId,
        kind: 'rag'
    });
    setActiveRagRequest(workspace, requestId);
    ctx.scope.defer(() => {
        clearActiveRagRequest(workspace, requestId);
    });
    return ctx;
}
export async function handleRag(request, onProgress) {
    return profileReplyHandler({ op: 'rag', request }, async () => handleRagInternal(request, onProgress));
}
async function handleRagInternal(request, onProgress) {
    switch (request.operation) {
        case 'chunk': {
            const chunks = await chunk(request);
            return {
                type: 'rag',
                operation: request.operation,
                success: true,
                chunks
            };
        }
        case 'ingest': {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const workspace = request.workspace ?? DEFAULT_WORKSPACE;
                const requestId = request.requestId ?? generateRandomRequestId();
                const ctx = __addDisposableResource(env_1, await beginRagContext(workspace, requestId), true);
                const log = withRequestContext(getEngineLogger(), ctx);
                log.debug('ingest start');
                const handlerOptions = createHandlerOptions('ingest', workspace, ctx.signal, onProgress);
                const params = omitOnProgress(request);
                const result = await ingest(params, handlerOptions);
                return {
                    type: 'rag',
                    operation: request.operation,
                    success: true,
                    processed: result.processed,
                    droppedIndices: result.droppedIndices
                };
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
        case 'saveEmbeddings': {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const workspace = request.workspace ?? DEFAULT_WORKSPACE;
                const requestId = request.requestId ?? generateRandomRequestId();
                const ctx = __addDisposableResource(env_2, await beginRagContext(workspace, requestId), true);
                const log = withRequestContext(getEngineLogger(), ctx);
                log.debug('saveEmbeddings start');
                const handlerOptions = createHandlerOptions('saveEmbeddings', workspace, ctx.signal, onProgress);
                const params = omitOnProgress(request);
                const processed = await saveEmbeddings(params, handlerOptions);
                return {
                    type: 'rag',
                    operation: request.operation,
                    success: true,
                    processed
                };
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                const result_2 = __disposeResources(env_2);
                if (result_2)
                    await result_2;
            }
        }
        case 'search': {
            const results = await search(request);
            return {
                type: 'rag',
                operation: request.operation,
                success: true,
                results
            };
        }
        case 'deleteEmbeddings': {
            await deleteEmbeddings(request);
            return {
                type: 'rag',
                operation: request.operation,
                success: true
            };
        }
        case 'reindex': {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const workspace = request.workspace ?? DEFAULT_WORKSPACE;
                const requestId = request.requestId ?? generateRandomRequestId();
                const ctx = __addDisposableResource(env_3, await beginRagContext(workspace, requestId), true);
                const log = withRequestContext(getEngineLogger(), ctx);
                log.debug('reindex start');
                const handlerOptions = createHandlerOptions('reindex', workspace, ctx.signal, onProgress);
                const params = omitOnProgress(request);
                const result = await reindex(params, handlerOptions);
                return {
                    type: 'rag',
                    operation: request.operation,
                    success: true,
                    result
                };
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                const result_3 = __disposeResources(env_3);
                if (result_3)
                    await result_3;
            }
        }
        case 'listWorkspaces': {
            const workspaces = listWorkspaces();
            return {
                type: 'rag',
                operation: request.operation,
                success: true,
                workspaces
            };
        }
        case 'closeWorkspace': {
            await closeWorkspace(request);
            return {
                type: 'rag',
                operation: request.operation,
                success: true
            };
        }
        case 'deleteWorkspace': {
            await deleteWorkspace(request);
            return {
                type: 'rag',
                operation: request.operation,
                success: true
            };
        }
    }
}
