/**
 * Central state management for profiling enablement, configuration, and recording.
 *
 * Precedence (highest to lowest):
 * 1. Per-call override
 * 2. Runtime API (enable/disable)
 * 3. Disabled default
 */
import { getGlobalSingleton } from '../utils/global-singleton.js';
import { createAggregator, recordEvent as aggregatorRecord, getAggregates as aggregatorGetAggregates, getRecentEvents as aggregatorGetRecentEvents, clearAggregator, setMaxRecentEvents } from './aggregator.js';
import { nowMs, generateProfileId } from './clock.js';
const DEFAULT_CONFIG = {
    enabled: false,
    mode: 'summary',
    includeServerBreakdown: false,
    includeResourceGauges: false,
    operationFilters: [],
    maxRecentEvents: 1000
};
const CONTROLLER_STATE_KEY = Symbol.for('@qvac/inference:profiler-controller-state');
function getControllerState() {
    const state = getGlobalSingleton(CONTROLLER_STATE_KEY, () => {
        return {
            runtimeOverride: undefined,
            runtimeOptions: {},
            onRecordCallbacks: [],
            initialized: false
        };
    });
    if (!state.initialized) {
        createAggregator(DEFAULT_CONFIG.maxRecentEvents);
        state.initialized = true;
    }
    return state;
}
export function enable(options) {
    const state = getControllerState();
    state.runtimeOverride = true;
    state.runtimeOptions = options ? { ...options } : {};
    clearAggregator();
    setMaxRecentEvents(DEFAULT_CONFIG.maxRecentEvents);
}
export function disable() {
    const state = getControllerState();
    state.runtimeOverride = false;
    state.runtimeOptions = {};
    setMaxRecentEvents(DEFAULT_CONFIG.maxRecentEvents);
}
export function isEnabled() {
    const state = getControllerState();
    return state.runtimeOverride ?? false;
}
export function getEffectiveConfig() {
    const state = getControllerState();
    return {
        enabled: isEnabled(),
        mode: state.runtimeOptions.mode ?? DEFAULT_CONFIG.mode,
        includeServerBreakdown: state.runtimeOptions.includeServerBreakdown ?? DEFAULT_CONFIG.includeServerBreakdown,
        includeResourceGauges: state.runtimeOptions.includeResourceGauges ?? DEFAULT_CONFIG.includeResourceGauges,
        operationFilters: [
            ...(state.runtimeOptions.operationFilters ?? DEFAULT_CONFIG.operationFilters)
        ],
        maxRecentEvents: DEFAULT_CONFIG.maxRecentEvents
    };
}
export function shouldProfile(operation, perCallOptions) {
    if (perCallOptions?.enabled !== undefined) {
        return perCallOptions.enabled;
    }
    if (!isEnabled()) {
        return false;
    }
    const config = getEffectiveConfig();
    if (config.operationFilters.length > 0) {
        return config.operationFilters.includes(operation);
    }
    return true;
}
export function shouldIncludeServerBreakdown(perCallOptions) {
    if (perCallOptions?.includeServerBreakdown !== undefined) {
        return perCallOptions.includeServerBreakdown;
    }
    return getEffectiveConfig().includeServerBreakdown;
}
export function shouldIncludeResourceGauges(perCallOptions) {
    if (perCallOptions?.includeResourceGauges !== undefined) {
        return perCallOptions.includeResourceGauges;
    }
    return getEffectiveConfig().includeResourceGauges;
}
export function generateId() {
    return generateProfileId();
}
export function record(event) {
    const state = getControllerState();
    let eventWithTs = event;
    if (event.ts === undefined) {
        eventWithTs = { ...event, ts: nowMs() };
    }
    const storeInBuffer = getEffectiveConfig().mode === 'verbose';
    aggregatorRecord(eventWithTs, storeInBuffer);
    for (const cb of state.onRecordCallbacks) {
        try {
            cb(eventWithTs);
        }
        catch {
            // Callback errors should not break profiling
        }
    }
}
/** Returns unsubscribe function. */
export function onRecord(callback) {
    const state = getControllerState();
    state.onRecordCallbacks.push(callback);
    return () => {
        const idx = state.onRecordCallbacks.indexOf(callback);
        if (idx >= 0) {
            state.onRecordCallbacks.splice(idx, 1);
        }
    };
}
export function getAggregates() {
    return aggregatorGetAggregates();
}
export function getRecentEvents() {
    return aggregatorGetRecentEvents();
}
export function clear() {
    clearAggregator();
}
