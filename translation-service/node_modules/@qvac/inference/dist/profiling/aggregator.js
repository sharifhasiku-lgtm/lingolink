/**
 * Accumulates profiling statistics and maintains a bounded buffer of recent events.
 * Uses a ring buffer for O(1) event insertion.
 */
import { getGlobalSingleton } from '../utils/global-singleton.js';
import { createRingBuffer, ringBufferPush, ringBufferToArray, ringBufferClear, ringBufferResize, ringBufferDroppedCount } from './ring-buffer.js';
const DEFAULT_MAX_RECENT_EVENTS = 1000;
const AGGREGATOR_STATE_KEY = Symbol.for('@qvac/inference:profiler-aggregator-state');
function getAggregatorState() {
    return getGlobalSingleton(AGGREGATOR_STATE_KEY, () => {
        return {
            stats: new Map(),
            eventBuffer: createRingBuffer(DEFAULT_MAX_RECENT_EVENTS)
        };
    });
}
export function createAggregator(maxRecentEvents = DEFAULT_MAX_RECENT_EVENTS) {
    const state = getAggregatorState();
    state.stats = new Map();
    state.eventBuffer = createRingBuffer(maxRecentEvents);
}
function recordStats(key, value) {
    const aggregator = getAggregatorState();
    let statsState = aggregator.stats.get(key);
    if (!statsState) {
        statsState = {
            count: 0,
            min: Infinity,
            max: -Infinity,
            sum: 0,
            last: 0
        };
        aggregator.stats.set(key, statsState);
    }
    statsState.count++;
    statsState.sum += value;
    statsState.last = value;
    if (value < statsState.min)
        statsState.min = value;
    if (value > statsState.max)
        statsState.max = value;
}
function getStats(state) {
    return {
        count: state.count,
        min: state.count > 0 ? state.min : 0,
        max: state.count > 0 ? state.max : 0,
        avg: state.count > 0 ? state.sum / state.count : 0,
        sum: state.sum,
        last: state.last
    };
}
export function recordEvent(event, storeInBuffer = true) {
    const state = getAggregatorState();
    if (storeInBuffer) {
        ringBufferPush(state.eventBuffer, event);
    }
    if (event.ms !== undefined) {
        const key = event.phase ? `${event.op}.${event.phase}` : event.op;
        recordStats(key, event.ms);
    }
    if (event.gauges) {
        const baseKey = event.phase ? `${event.op}.${event.phase}` : event.op;
        for (const [gaugeName, value] of Object.entries(event.gauges)) {
            recordStats(`${baseKey}.${gaugeName}`, value);
        }
    }
}
export function getAggregates() {
    const state = getAggregatorState();
    const result = {};
    for (const [key, statsState] of state.stats) {
        result[key] = getStats(statsState);
    }
    return result;
}
/** Returns events in chronological order (oldest first). */
export function getRecentEvents() {
    return ringBufferToArray(getAggregatorState().eventBuffer);
}
export function getEventCount() {
    const state = getAggregatorState();
    let total = 0;
    for (const statsState of state.stats.values()) {
        total += statsState.count;
    }
    return total;
}
export function getDroppedCount() {
    return ringBufferDroppedCount(getAggregatorState().eventBuffer);
}
export function clearAggregator() {
    const state = getAggregatorState();
    state.stats.clear();
    ringBufferClear(state.eventBuffer);
}
export function setMaxRecentEvents(max) {
    const state = getAggregatorState();
    state.eventBuffer = ringBufferResize(state.eventBuffer, max);
}
