import { type BaseTimings } from '@qvac/inference/surface';
import type { ProfilingResponseMeta } from '@qvac/inference/surface';
interface BaseClientTimings extends BaseTimings {
    requestZodValidationMs?: number;
    requestStringifyMs?: number;
    sendStart?: number;
    requestEnd?: number;
}
export interface ClientTimings extends BaseClientTimings {
    firstResponseAt?: number;
    responseJsonParseMs?: number;
    responseZodValidationMs?: number;
}
export interface ClientStreamTimings extends BaseClientTimings {
    firstChunkAt?: number;
    lastChunkAt?: number;
    chunkCount: number;
}
export declare function createClientTimings(profileId: string, requestType: string): ClientTimings;
export declare function createClientStreamTimings(profileId: string, requestType: string): ClientStreamTimings;
export declare function cacheConnectionTime(durationMs: number): void;
export declare function flushConnectionTime(): void;
export declare function recordClientEvents(timings: ClientTimings, serverMeta?: ProfilingResponseMeta): void;
export declare function recordClientStreamEvents(timings: ClientStreamTimings, serverMeta?: ProfilingResponseMeta): void;
export declare function resetConnectionTracking(): void;
export {};
//# sourceMappingURL=profiler.d.ts.map