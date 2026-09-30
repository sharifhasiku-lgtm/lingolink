import { type ProfilingRequestMeta, type OperationEvent } from '@qvac/inference/surface';
export interface ServerProfilingContext {
    meta: ProfilingRequestMeta;
    requestStart: number;
    jsonParseMs?: number;
    zodValidationMs?: number;
    handlerExecutionMs?: number;
    responseZodValidationMs?: number;
    responseStringifyMs?: number;
}
export declare function createProfilingContext(meta: ProfilingRequestMeta): ServerProfilingContext;
export interface ProfilingInjectionOptions {
    ctx?: ServerProfilingContext;
    operation?: OperationEvent;
}
export declare function injectProfilingIntoString(jsonString: string, options: ProfilingInjectionOptions): string;
//# sourceMappingURL=context.d.ts.map