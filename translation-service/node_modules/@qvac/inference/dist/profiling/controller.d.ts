/**
 * Central state management for profiling enablement, configuration, and recording.
 *
 * Precedence (highest to lowest):
 * 1. Per-call override
 * 2. Runtime API (enable/disable)
 * 3. Disabled default
 */
import type { ProfilerMode, PerCallProfiling } from '../schemas/index.js';
import type { ProfilerRuntimeOptions, ProfilingEvent, AggregatedStats } from './types.js';
export interface ResolvedProfilerConfig {
    enabled: boolean;
    mode: ProfilerMode;
    includeServerBreakdown: boolean;
    includeResourceGauges: boolean;
    operationFilters: string[];
    maxRecentEvents: number;
}
type RecordCallback = (event: ProfilingEvent) => void;
export declare function enable(options?: ProfilerRuntimeOptions): void;
export declare function disable(): void;
export declare function isEnabled(): boolean;
export declare function getEffectiveConfig(): ResolvedProfilerConfig;
export declare function shouldProfile(operation: string, perCallOptions?: PerCallProfiling): boolean;
export declare function shouldIncludeServerBreakdown(perCallOptions?: PerCallProfiling): boolean;
export declare function shouldIncludeResourceGauges(perCallOptions?: PerCallProfiling): boolean;
export declare function generateId(): string;
export declare function record(event: ProfilingEvent): void;
/** Returns unsubscribe function. */
export declare function onRecord(callback: RecordCallback): () => void;
export declare function getAggregates(): Record<string, AggregatedStats>;
export declare function getRecentEvents(): ProfilingEvent[];
export declare function clear(): void;
export {};
