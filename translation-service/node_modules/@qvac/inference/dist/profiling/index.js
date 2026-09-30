/**
 * QVAC Profiler
 *
 * @example
 * ```ts
 * import { profiler } from "@qvac/inference";
 *
 * profiler.enable({ mode: "summary" });
 * // ... run inference operations ...
 * console.log(profiler.exportTable());
 * profiler.disable();
 * ```
 */
import * as controller from './controller.js';
import * as exporters from './exporters.js';
export const profiler = {
    /**
     * Enables profiling and resets all previously aggregated data.
     *
     * @param options - Optional runtime options (profiling mode, server breakdown, operation filters, ring-buffer capacity).
     */
    enable: (options) => controller.enable(options),
    /**
     * Disables profiling. New operations will no longer be recorded.
     */
    disable: () => controller.disable(),
    /**
     * Returns whether profiling is currently enabled.
     *
     * @returns `true` when profiling is currently enabled, `false` otherwise.
     */
    isEnabled: () => controller.isEnabled(),
    /**
     * Exports profiling data as a structured JSON object suitable for machine consumption.
     *
     * @param options - Export options.
     * @param options.includeRecentEvents - When `true`, includes the ring buffer of recent events in the export (only populated when profiler was enabled in `"verbose"` mode).
     * @returns A `ProfilerExport` snapshot of aggregated stats and (optionally) recent events.
     */
    exportJSON: (options) => exporters.exportJSON(options),
    /**
     * Exports aggregated stats as a formatted ASCII table suitable for terminal output.
     *
     * @returns A multi-line string rendering of the aggregated stats table.
     */
    exportTable: () => exporters.exportTable(),
    /**
     * Exports a short, human-readable summary string of the aggregated stats.
     *
     * @returns A one-paragraph summary of the profiling data.
     */
    exportSummary: () => exporters.exportSummary(),
    /**
     * Registers a listener for profiling events; returns an unsubscribe function.
     *
     * @param callback - Invoked once per recorded profiling event.
     * @returns An unsubscribe function; call it to remove the listener.
     */
    onRecord: (callback) => controller.onRecord(callback),
    /**
     * Returns the current effective profiler configuration.
     *
     * @returns The effective `ResolvedProfilerConfig` (defaults merged with user overrides).
     */
    getConfig: () => controller.getEffectiveConfig(),
    /**
     * Returns all aggregated stats keyed by operation name.
     *
     * @returns A record of `AggregatedStats` keyed by operation name.
     */
    getAggregates: () => controller.getAggregates(),
    /**
     * Clears all aggregated data and the recent-events ring buffer.
     */
    clear: () => controller.clear()
};
export { nowMs } from './clock.js';
export { attachBackendDiagnostics } from './backend-diagnostics.js';
export { enable, disable, record, shouldProfile, shouldIncludeServerBreakdown, shouldIncludeResourceGauges, generateId, isEnabled, getAggregates, getRecentEvents, getEffectiveConfig, onRecord } from './controller.js';
export { recordEvent, clearAggregator } from './aggregator.js';
export { exportJSON, exportTable, exportSummary } from './exporters.js';
export { createProfilingMeta, createProfilingDisabledMeta, injectProfilingMetaIntoObject, extractProfilingMeta, stripProfilingMeta } from './envelope.js';
export { recordPhase, recordFailure, recordServerBreakdownPhases } from './events.js';
export { createServerProfiler } from './profiler.js';
export { profileReplyHandler, profileStreamHandler } from './operation-wrappers.js';
export { registerOperationMetrics, buildOperationEvent } from './operation-metrics.js';
