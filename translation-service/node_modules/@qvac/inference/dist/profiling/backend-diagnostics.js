import { getEngineLogger } from '../logging/index.js';
import { BACKEND_DIAGNOSTICS_KEY, inferenceBackendDiagnosticsSchema } from '../schemas/index.js';
const logger = getEngineLogger();
/**
 * Attaches diagnostics to a unary addon result, a plugin model-factory result,
 * or the terminal chunk of a streaming addon result. Earlier stream chunks are not inspected.
 */
export function attachBackendDiagnostics(target, diagnostics) {
    const parsed = inferenceBackendDiagnosticsSchema.parse(diagnostics);
    target[BACKEND_DIAGNOSTICS_KEY] =
        parsed;
    return target;
}
export function forwardBackendDiagnostics(target, source) {
    if (!source || typeof source !== 'object')
        return target;
    const diagnostics = source[BACKEND_DIAGNOSTICS_KEY];
    if (diagnostics !== undefined) {
        ;
        target[BACKEND_DIAGNOSTICS_KEY] = diagnostics;
    }
    return target;
}
export function readBackendDiagnostics(target) {
    if (!target || typeof target !== 'object')
        return undefined;
    const diagnostics = target[BACKEND_DIAGNOSTICS_KEY];
    if (diagnostics === undefined)
        return undefined;
    const result = inferenceBackendDiagnosticsSchema.safeParse(diagnostics);
    if (!result.success) {
        logger.debug('Ignoring invalid backend diagnostics', result.error);
        return undefined;
    }
    return result.data;
}
