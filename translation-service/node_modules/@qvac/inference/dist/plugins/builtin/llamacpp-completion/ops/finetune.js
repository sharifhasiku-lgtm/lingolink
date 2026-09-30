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
import fs from 'bare-fs';
import { getModel } from '../../../../runtime/model-registry.js';
import { CompletionFailedError } from '../../../../errors/index.js';
import { getRequestRegistry, withRequestContext } from '../../../../runtime/index.js';
import { generateRandomRequestId } from '../../../../runtime/request-id.js';
import { getEngineLogger } from '../../../../logging/index.js';
const PAUSE_CHECKPOINT_PREFIX = 'pause_checkpoint_step_';
// Ref-count, not a Set: with an exclusive writer a second finetune queues behind
// the first, and both register before admission. A Set let the first's cleanup
// clear the key while the second was still training, so getFinetuneState()
// reported IDLE mid-run. Each call owns one ref and releases exactly one.
const finetuneRuntimeState = new Map();
function getRunningFinetuneState(modelId) {
    return (finetuneRuntimeState.get(modelId) ?? 0) > 0;
}
function registerRunningFinetune(modelId) {
    finetuneRuntimeState.set(modelId, (finetuneRuntimeState.get(modelId) ?? 0) + 1);
}
export function clearFinetuneRuntimeState(modelId) {
    const count = finetuneRuntimeState.get(modelId);
    if (count === undefined)
        return;
    if (count <= 1)
        finetuneRuntimeState.delete(modelId);
    else
        finetuneRuntimeState.set(modelId, count - 1);
}
// modelIds whose single in-flight finetune currently HOLDS the exclusive lane
// (admitted, past the queued-abort check). One finetune per model (see the
// reject-second guard in startFinetune), so this is a plain membership set. Only an
// admitted finetune may be paused through the addon-global model.pause(); a finetune
// still queued behind a reader is cancelled instead, so pause never touches an
// unrelated reader.
const admittedFinetunes = new Set();
// The single in-flight finetune's requestId per model. A QUEUED finetune is cancelled
// by this id, not by a broad cancel({ modelId, kind }): the registry's grant→register
// handoff leaves a brief window where the request is in neither the wait queue nor the
// active set — a broad cancel misses it, but cancel({ requestId }) covers it via the
// cancel-before-begin tripwire.
const finetuneRequestIds = new Map();
// Models whose admitted finetune is mid-pause: model.pause() has been called but has
// not settled. A new finetune is rejected during this window even if the runtime ref
// has already cleared, because handle.await() can settle before model.pause() resolves.
const pausingModels = new Set();
// Cancel the model's in-flight finetune by its tracked requestId (covers the
// registry grant→register handoff window via the cancel-before-begin tripwire),
// falling back to a broad cancel if the id is unknown.
function cancelTrackedFinetune(modelId) {
    const requestId = finetuneRequestIds.get(modelId);
    if (requestId !== undefined)
        getRequestRegistry().cancel({ requestId });
    else
        getRequestRegistry().cancel({ modelId, kind: 'finetune' });
}
export function getFinetuneStateFromCheckpoints(options) {
    const checkpointDirectory = options.checkpointSaveDir ?? './checkpoints';
    if (!fs.existsSync(checkpointDirectory)) {
        return 'IDLE';
    }
    try {
        const entries = fs.readdirSync(checkpointDirectory);
        for (const entry of entries) {
            if (typeof entry !== 'string') {
                continue;
            }
            if (entry.startsWith(PAUSE_CHECKPOINT_PREFIX)) {
                return 'PAUSED';
            }
        }
    }
    catch (error) {
        throw new CompletionFailedError(`Failed to inspect finetune checkpoints in "${checkpointDirectory}"`, error);
    }
    return 'IDLE';
}
function validateExplicitFinetuneOperation(request) {
    if (!request.operation) {
        return;
    }
    const state = getFinetuneStateFromCheckpoints(request.options);
    if (request.operation === 'start' && state === 'PAUSED') {
        throw new CompletionFailedError(`Model "${request.modelId}" has a paused finetune checkpoint; resume it or cancel it before starting from scratch`);
    }
    if (request.operation === 'resume' && state === 'IDLE') {
        throw new CompletionFailedError(`Model "${request.modelId}" has no paused finetune checkpoint to resume`);
    }
}
export async function startFinetune(request, onProgress) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
        const model = getModel(request.modelId);
        validateExplicitFinetuneOperation(request);
        // One finetune per model: reject a second start/resume while one is pending or
        // running. With no queued finetune peers, pause/cancel never has to disambiguate
        // multiple finetunes, and a finetune that arrives mid-pause is simply rejected
        // because the pausing one still occupies the model until it unwinds.
        if (getRunningFinetuneState(request.modelId) || pausingModels.has(request.modelId)) {
            throw new CompletionFailedError(`Model "${request.modelId}" already has an active finetune; pause or cancel it before starting another`);
        }
        // Stable id, used for registry scoping and for targeted cancellation of this
        // finetune while it is queued (see pauseFinetune / cancelFinetune).
        const requestId = request.requestId ?? generateRandomRequestId();
        // Take a ref before the async begin() so an immediate getFinetuneState() poll
        // observes RUNNING, not IDLE, and a concurrent start is rejected above. Released
        // on a failed begin() or on scope unwind below.
        registerRunningFinetune(request.modelId);
        finetuneRequestIds.set(request.modelId, requestId);
        // Scope the run into the registry so cancel({ requestId }) and
        // cancel({ modelId, kind: "finetune" }) reach it; onAbort forwards to
        // model.cancel().
        const ctx = __addDisposableResource(env_1, await getRequestRegistry()
            .begin({
            requestId,
            kind: 'finetune',
            modelId: request.modelId
        })
            .catch((err) => {
            clearFinetuneRuntimeState(request.modelId);
            if (finetuneRequestIds.get(request.modelId) === requestId) {
                finetuneRequestIds.delete(request.modelId);
            }
            throw err;
        }), true);
        const requestLogger = withRequestContext(getEngineLogger(), ctx);
        // Cleared on scope unwind; deferred before the listener detach so LIFO
        // removes the listener first.
        ctx.scope.defer(() => {
            clearFinetuneRuntimeState(request.modelId);
            if (finetuneRequestIds.get(request.modelId) === requestId) {
                finetuneRequestIds.delete(request.modelId);
            }
        });
        // A finetune cancelled while queued resolves aborted without the exclusive
        // slot, so completions may still hold the lane. Stop before the global cancel
        // or any native finetune so neither runs against them.
        if (ctx.signal.aborted) {
            return { type: 'finetune', status: 'CANCELLED' };
        }
        // Past the queued-abort check: this finetune now holds the exclusive lane. Mark
        // it admitted so pauseFinetune pauses THIS finetune via model.pause() rather than
        // global-pausing (and killing a reader) while it is merely queued.
        admittedFinetunes.add(request.modelId);
        ctx.scope.defer(() => {
            admittedFinetunes.delete(request.modelId);
        });
        // The pre-admission validation above ran before this request queued for the
        // exclusive lane, so a peer finetune could have changed the checkpoint state
        // while we waited. Re-validate now that we hold the lane exclusively and the
        // state is stable.
        validateExplicitFinetuneOperation(request);
        // Global cancel is finetune's only stop; it runs exclusively, so nothing else
        // is on the model when this fires.
        const onAbort = () => {
            model.cancel().catch((err) => {
                requestLogger.warn(`[cancel] model.cancel() rejected during abort for modelId=${request.modelId}: ${err instanceof Error ? err.message : String(err)}`);
            });
        };
        ctx.signal.addEventListener('abort', onAbort, { once: true });
        if (ctx.signal.aborted)
            onAbort();
        ctx.scope.defer(() => {
            ctx.signal.removeEventListener('abort', onAbort);
        });
        const handle = await model.finetune(request.options);
        if (onProgress) {
            handle.on('stats', onProgress);
            ctx.scope.defer(() => {
                handle.removeListener('stats', onProgress);
            });
        }
        const result = await handle.await();
        return {
            type: 'finetune',
            status: result.status,
            stats: result.stats
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
export async function pauseFinetune(modelId) {
    // Validate the model is loaded on every path (matches main; getModel throws
    // ModelNotFoundError for an unknown/unloaded model) before reporting any state.
    const model = getModel(modelId);
    if (admittedFinetunes.has(modelId)) {
        // The single finetune holds the model exclusively, so the addon-global pause is
        // safe (nothing else runs on the model). Bar a new finetune until the native
        // pause settles: the runtime ref can clear when handle.await() resolves, which
        // may precede model.pause()'s resolution.
        pausingModels.add(modelId);
        try {
            await model.pause();
        }
        finally {
            pausingModels.delete(modelId);
        }
        return { type: 'finetune', status: 'PAUSED' };
    }
    if (getRunningFinetuneState(modelId)) {
        // A finetune is pending but not yet admitted (queued behind a reader). A global
        // pause would cancel that unrelated reader, so cancel the queued finetune by its
        // own requestId. Nothing has trained, so report CANCELLED rather than a false
        // PAUSED.
        cancelTrackedFinetune(modelId);
        return { type: 'finetune', status: 'CANCELLED' };
    }
    // No finetune on this model: a no-op pause, but the model was validated above.
    return { type: 'finetune', status: 'PAUSED' };
}
// Routes cancellation through the registry; the model.cancel() forward is
// installed by startFinetune, so never call model.cancel() here.
export function cancelFinetune(modelId) {
    cancelTrackedFinetune(modelId);
    return Promise.resolve({
        type: 'finetune',
        status: 'CANCELLED'
    });
}
export function getFinetuneState(params) {
    const runtimeState = getRunningFinetuneState(params.modelId);
    return {
        type: 'finetune',
        status: runtimeState ? 'RUNNING' : getFinetuneStateFromCheckpoints(params.options)
    };
}
export async function finetune(request, onProgress) {
    if (request.operation === undefined ||
        request.operation === 'start' ||
        request.operation === 'resume') {
        return startFinetune(request, onProgress);
    }
    switch (request.operation) {
        case 'getState':
            return getFinetuneState(request);
        case 'pause':
            return pauseFinetune(request.modelId);
        case 'cancel':
            return cancelFinetune(request.modelId);
    }
}
