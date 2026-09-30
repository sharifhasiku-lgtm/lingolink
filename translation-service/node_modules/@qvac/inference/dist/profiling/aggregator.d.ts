/**
 * Accumulates profiling statistics and maintains a bounded buffer of recent events.
 * Uses a ring buffer for O(1) event insertion.
 */
import type { ProfilingEvent, AggregatedStats } from './types.js';
export declare function createAggregator(maxRecentEvents?: number): void;
export declare function recordEvent(event: ProfilingEvent, storeInBuffer?: boolean): void;
export declare function getAggregates(): Record<string, AggregatedStats>;
/** Returns events in chronological order (oldest first). */
export declare function getRecentEvents(): ProfilingEvent[];
export declare function getEventCount(): number;
export declare function getDroppedCount(): number;
export declare function clearAggregator(): void;
export declare function setMaxRecentEvents(max: number): void;
