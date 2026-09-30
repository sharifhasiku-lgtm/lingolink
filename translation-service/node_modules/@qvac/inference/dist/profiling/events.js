import { nowMs } from './clock.js';
import { record } from './controller.js';
export function recordPhase(base, phase, ms, extra) {
    if (ms === undefined)
        return;
    record({ ...base, phase, ms, ...extra });
}
export function recordFailure(base, startTime, error) {
    const now = nowMs();
    record({
        ...base,
        ts: now,
        phase: 'failed',
        ms: now - startTime,
        tags: {
            error: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message.slice(0, 100) : String(error).slice(0, 100)
        }
    });
}
export function recordServerBreakdownPhases(base, server, prefix = 'server') {
    recordPhase(base, `${prefix}.request.jsonParse`, server.requestJsonParseMs);
    recordPhase(base, `${prefix}.request.zodValidation`, server.requestZodValidationMs);
    recordPhase(base, `${prefix}.handlerExecution`, server.handlerExecutionMs);
    recordPhase(base, `${prefix}.response.zodValidation`, server.responseZodValidationMs);
    recordPhase(base, `${prefix}.response.stringify`, server.responseStringifyMs);
    recordPhase(base, `${prefix}.totalServerTime`, server.totalServerMs);
}
