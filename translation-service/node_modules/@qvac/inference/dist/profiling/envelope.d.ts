/**
 * Helpers to inject/extract __profiling metadata in RPC payloads.
 */
import { type ProfilingRequestMeta, type ProfilingResponseMeta } from '../schemas/index.js';
export declare function createProfilingMeta(profileId: string, includeServerBreakdown: boolean, includeResourceGauges: boolean): ProfilingRequestMeta;
export declare function createProfilingDisabledMeta(): ProfilingRequestMeta;
export declare function injectProfilingMetaIntoObject(obj: Record<string, unknown>, meta: ProfilingRequestMeta): Record<string, unknown>;
export declare function extractProfilingMeta(payload: unknown): ProfilingResponseMeta | undefined;
export declare function stripProfilingMeta<T extends object>(payload: T): T;
