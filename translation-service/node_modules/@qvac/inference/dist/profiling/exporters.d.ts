/**
 * JSON, table, and summary export utilities for profiling data.
 */
import type { ProfilerExport } from './types.js';
export declare function exportJSON(options?: {
    includeRecentEvents?: boolean;
}): ProfilerExport;
export declare function exportTable(): string;
export declare function exportSummary(): string;
