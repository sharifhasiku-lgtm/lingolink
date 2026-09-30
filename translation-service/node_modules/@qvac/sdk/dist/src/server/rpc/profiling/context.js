import { PROFILING_KEY, nowMs } from '@qvac/inference/surface';
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
