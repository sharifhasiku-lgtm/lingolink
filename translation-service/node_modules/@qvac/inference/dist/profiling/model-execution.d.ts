/**
 * Helpers for propagating model execution timing via internal symbols.
 */
export declare function hasDefinedValues<T extends Record<string, unknown>>(obj: T): boolean;
export declare function attachModelExecutionMs<T>(target: T, ms: number | undefined): T;
export declare function readModelExecutionMs(target: unknown): number | undefined;
export declare function forwardModelExecution<T>(target: T, source: unknown): T;
export interface StreamResult<S = unknown> {
    modelExecutionMs: number;
    stats?: S;
}
export declare function buildStreamResult<S extends Record<string, unknown>>(modelExecutionMs: number, stats?: S): StreamResult<S>;
export declare function buildUnaryResult<T extends Record<string, unknown>, S extends Record<string, unknown>>(response: T, modelExecutionMs: number, stats?: S): T & {
    stats?: S;
};
