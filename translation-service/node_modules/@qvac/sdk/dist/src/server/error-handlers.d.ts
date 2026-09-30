import type RPC from 'bare-rpc';
import { type ServerProfiler } from './rpc/profiling/index.js';
export declare function sendErrorResponse(req: RPC.IncomingRequest, error: unknown, profiler?: ServerProfiler): void;
export declare function sendStreamErrorResponse(stream: ReturnType<RPC.IncomingRequest['createResponseStream']>, error: unknown, profiler?: ServerProfiler): void;
//# sourceMappingURL=error-handlers.d.ts.map