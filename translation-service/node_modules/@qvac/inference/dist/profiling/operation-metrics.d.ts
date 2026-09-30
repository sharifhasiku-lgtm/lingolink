/**
 * Declarative extraction of operation-level metrics from request/response data.
 * Used by operation wrappers to capture handler-specific profiling events.
 */
import type { ProfilingEvent, ProfilingEventKind } from './types.js';
import type { DownloadStats } from '../handlers/load-model/types.js';
export type MetricExtractor<T> = (data: T) => Record<string, number> | undefined;
export type TagExtractor<T> = (data: T) => Record<string, string> | undefined;
export interface OperationMetricsConfig<TRequest = unknown, TResponse = unknown> {
    op: string;
    kind: ProfilingEventKind;
    fromRequest?: MetricExtractor<TRequest>;
    fromFinalChunk?: MetricExtractor<TResponse>;
    fromResult?: MetricExtractor<TResponse>;
    getTags?: (request: TRequest) => Record<string, string>;
    getTagsFromResult?: TagExtractor<TResponse>;
}
export interface DownloadAssetProfilingMeta {
    sourceType?: string;
    downloadStats?: DownloadStats;
    totalDownloadTimeMs?: number;
}
export declare function registerOperationMetrics<TRequest, TResponse>(config: OperationMetricsConfig<TRequest, TResponse>): void;
export declare function buildOperationEvent(op: string, profileId: string, ts: number, executionMs: number, request?: unknown, finalResponse?: unknown, ttfb?: number): ProfilingEvent | undefined;
