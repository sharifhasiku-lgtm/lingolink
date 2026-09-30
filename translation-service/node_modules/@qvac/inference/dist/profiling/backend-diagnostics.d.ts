import { type InferenceBackendDiagnostics } from '../schemas/index.js';
/**
 * Attaches diagnostics to a unary addon result, a plugin model-factory result,
 * or the terminal chunk of a streaming addon result. Earlier stream chunks are not inspected.
 */
export declare function attachBackendDiagnostics<T extends object>(target: T, diagnostics: InferenceBackendDiagnostics): T;
export declare function forwardBackendDiagnostics<T extends object>(target: T, source: unknown): T;
export declare function readBackendDiagnostics(target: unknown): InferenceBackendDiagnostics | undefined;
