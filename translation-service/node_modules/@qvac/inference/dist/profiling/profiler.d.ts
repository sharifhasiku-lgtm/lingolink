import { type Response, type ProfilingRequestMeta, type OperationEvent } from '../schemas/index.js';
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
export type ServerProfiler = {
    markRequestParsed: (ms: number) => void;
    markRequestValidated: (ms: number) => void;
    startHandler: () => void;
    endHandler: () => void;
    serialize: (response?: Response, final?: boolean) => string;
    serializeError: (json: string) => string;
    getContext: () => ServerProfilingContext | undefined;
};
export declare function createServerProfiler(meta?: ProfilingRequestMeta): ServerProfiler;
