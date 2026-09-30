import { type Response, type ProfilingRequestMeta } from '@qvac/inference/surface';
import { type ServerProfilingContext } from './context.js';
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
//# sourceMappingURL=profiler.d.ts.map