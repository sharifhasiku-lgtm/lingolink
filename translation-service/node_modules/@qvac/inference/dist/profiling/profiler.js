import { responseSchema, PROFILING_KEY, OPERATION_EVENT_KEY, PROFILING_TRAILER_KEY } from '../schemas/index.js';
import { nowMs } from './clock.js';
export function createProfilingContext(meta) {
    return { meta, requestStart: nowMs() };
}
function buildServerBreakdown(ctx) {
    return {
        requestJsonParseMs: ctx.jsonParseMs,
        requestZodValidationMs: ctx.zodValidationMs,
        handlerExecutionMs: ctx.handlerExecutionMs,
        responseZodValidationMs: ctx.responseZodValidationMs,
        responseStringifyMs: ctx.responseStringifyMs,
        totalServerMs: nowMs() - ctx.requestStart
    };
}
export function injectProfilingIntoString(jsonString, options) {
    const { ctx, operation } = options;
    const includeServer = ctx?.meta.includeServer ?? false;
    const hasContent = includeServer || !!operation;
    if (!hasContent || !jsonString.endsWith('}')) {
        return jsonString;
    }
    const id = ctx?.meta.id ?? operation?.profileId ?? '';
    const profilingMeta = { id };
    if (includeServer && ctx) {
        profilingMeta['server'] = buildServerBreakdown(ctx);
    }
    if (operation) {
        profilingMeta['operation'] = operation;
    }
    return jsonString.slice(0, -1) + `,"${PROFILING_KEY}":${JSON.stringify(profilingMeta)}}`;
}
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
