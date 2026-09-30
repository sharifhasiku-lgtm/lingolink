/**
 * Helpers for propagating model execution timing via internal symbols.
 */
import { MODEL_EXECUTION_KEY } from '../schemas/index.js';
export function hasDefinedValues(obj) {
    return Object.values(obj).some((v) => v !== undefined);
}
export function attachModelExecutionMs(target, ms) {
    if (ms !== undefined) {
        ;
        target[MODEL_EXECUTION_KEY] = ms;
    }
    return target;
}
export function readModelExecutionMs(target) {
    return target?.[MODEL_EXECUTION_KEY];
}
export function forwardModelExecution(target, source) {
    return attachModelExecutionMs(target, readModelExecutionMs(source));
}
export function buildStreamResult(modelExecutionMs, stats) {
    const result = { modelExecutionMs };
    if (stats && hasDefinedValues(stats)) {
        result.stats = stats;
    }
    return result;
}
export function buildUnaryResult(response, modelExecutionMs, stats) {
    const result = { ...response };
    if (stats && hasDefinedValues(stats)) {
        result.stats = stats;
    }
    return attachModelExecutionMs(result, modelExecutionMs);
}
