import { responseSchema, OPERATION_EVENT_KEY, PROFILING_TRAILER_KEY, nowMs } from '@qvac/inference/surface';
import { createProfilingContext, injectProfilingIntoString } from './context.js';
const noopProfiler = {
    markRequestParsed: () => { },
    markRequestValidated: () => { },
    startHandler: () => { },
    endHandler: () => { },
    serialize: (response) => {
        if (!response)
            return '';
        const extended = response;
        const operation = extended[OPERATION_EVENT_KEY];
        const json = JSON.stringify(responseSchema.parse(response));
        if (operation) {
            return injectProfilingIntoString(json, { operation });
        }
        return json;
    },
    serializeError: (json) => json,
    getContext: () => undefined
};
function createActiveProfiler(meta) {
    const ctx = createProfilingContext(meta);
    let handlerStart = 0;
    let handlerEnded = false;
    let cachedOperation;
    return {
        markRequestParsed: (ms) => {
            ctx.jsonParseMs = ms;
        },
        markRequestValidated: (ms) => {
            ctx.zodValidationMs = ms;
        },
        startHandler: () => {
            handlerStart = nowMs();
            handlerEnded = false;
        },
        endHandler: () => {
            if (handlerEnded)
                return;
            handlerEnded = true;
            ctx.handlerExecutionMs = nowMs() - handlerStart;
        },
        serialize: (response, final = true) => {
            if (!response) {
                const opts = { ctx };
                if (cachedOperation)
                    opts.operation = cachedOperation;
                return injectProfilingIntoString(`{"${PROFILING_TRAILER_KEY}":true}`, opts);
            }
            const extended = response;
            const operation = extended[OPERATION_EVENT_KEY];
            if (operation)
                cachedOperation = operation;
            const zodStart = nowMs();
            const validated = responseSchema.parse(response);
            ctx.responseZodValidationMs = (ctx.responseZodValidationMs ?? 0) + (nowMs() - zodStart);
            const stringifyStart = nowMs();
            const json = JSON.stringify(validated);
            ctx.responseStringifyMs = (ctx.responseStringifyMs ?? 0) + (nowMs() - stringifyStart);
            if (final) {
                const opts = { ctx };
                if (operation)
                    opts.operation = operation;
                return injectProfilingIntoString(json, opts);
            }
            return json;
        },
        serializeError: (json) => injectProfilingIntoString(json, { ctx }),
        getContext: () => ctx
    };
}
export function createServerProfiler(meta) {
    if (meta?.includeServer && typeof meta.id === 'string' && meta.id.length > 0) {
        return createActiveProfiler(meta);
    }
    return noopProfiler;
}
