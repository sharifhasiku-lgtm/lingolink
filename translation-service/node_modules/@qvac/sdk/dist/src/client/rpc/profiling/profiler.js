import { nowMs, record, recordPhase, recordServerBreakdownPhases } from '@qvac/inference/surface';
import { getGlobalSingleton } from '../../../utils/global-singleton.js';
const CONNECTION_TRACKING_STATE_KEY = Symbol.for('@qvac/sdk:rpc-connection-tracking-state');
function getConnectionTrackingState() {
    return getGlobalSingleton(CONNECTION_TRACKING_STATE_KEY, () => {
        return {
            connectionTimeRecorded: false,
            pendingConnectionTimeMs: undefined
        };
    });
}
function recordRequestPhases(base, timings) {
    recordPhase(base, 'request.zodValidation', timings.requestZodValidationMs);
    recordPhase(base, 'request.stringify', timings.requestStringifyMs);
    if (timings.requestZodValidationMs !== undefined && timings.requestStringifyMs !== undefined) {
        recordPhase(base, 'request.totalSerialization', timings.requestZodValidationMs + timings.requestStringifyMs);
    }
}
function createBaseTimings(profileId, requestType) {
    return { profileId, requestType, requestStart: nowMs() };
}
export function createClientTimings(profileId, requestType) {
    return createBaseTimings(profileId, requestType);
}
export function createClientStreamTimings(profileId, requestType) {
    return { ...createBaseTimings(profileId, requestType), chunkCount: 0 };
}
export function cacheConnectionTime(durationMs) {
    const state = getConnectionTrackingState();
    if (state.connectionTimeRecorded)
        return;
    if (state.pendingConnectionTimeMs !== undefined)
        return;
    state.pendingConnectionTimeMs = durationMs;
}
export function flushConnectionTime() {
    const state = getConnectionTrackingState();
    if (state.connectionTimeRecorded)
        return;
    if (state.pendingConnectionTimeMs === undefined)
        return;
    const durationMs = state.pendingConnectionTimeMs;
    state.pendingConnectionTimeMs = undefined;
    state.connectionTimeRecorded = true;
    record({
        ts: nowMs(),
        op: 'rpc',
        kind: 'rpc',
        phase: 'connection',
        ms: durationMs
    });
}
export function recordClientEvents(timings, serverMeta) {
    const now = nowMs();
    const totalClientTime = now - timings.requestStart;
    const base = {
        ts: now,
        op: timings.requestType,
        kind: 'rpc',
        profileId: timings.profileId
    };
    recordRequestPhases(base, timings);
    // For unary requests, this measures send → full response received
    if (timings.sendStart !== undefined && timings.firstResponseAt !== undefined) {
        recordPhase(base, 'serverWait', timings.firstResponseAt - timings.sendStart);
    }
    recordPhase(base, 'response.jsonParse', timings.responseJsonParseMs);
    recordPhase(base, 'response.zodValidation', timings.responseZodValidationMs);
    if (timings.responseJsonParseMs !== undefined && timings.responseZodValidationMs !== undefined) {
        recordPhase(base, 'response.totalParsing', timings.responseJsonParseMs + timings.responseZodValidationMs);
    }
    recordPhase(base, 'totalClientTime', totalClientTime);
    if (serverMeta?.server) {
        recordServerBreakdownPhases(base, serverMeta.server, 'server');
        if (serverMeta.server.totalServerMs !== undefined) {
            recordPhase(base, 'clientOverhead', Math.max(0, totalClientTime - serverMeta.server.totalServerMs));
        }
    }
    if (serverMeta?.operation) {
        recordOperationEvent(serverMeta.operation);
    }
}
function recordOperationEvent(op) {
    const event = {
        ts: nowMs(),
        op: op.op,
        kind: op.kind,
        ms: op.ms
    };
    if (op.profileId !== undefined)
        event.profileId = op.profileId;
    if (op.gauges !== undefined)
        event.gauges = op.gauges;
    if (op.resources !== undefined)
        event.resources = op.resources;
    if (op.backend !== undefined)
        event.backend = op.backend;
    if (op.tags !== undefined)
        event.tags = op.tags;
    if (op.count !== undefined)
        event.count = op.count;
    record(event);
}
export function recordClientStreamEvents(timings, serverMeta) {
    const now = nowMs();
    const totalClientTime = now - timings.requestStart;
    const base = {
        ts: now,
        op: timings.requestType,
        kind: 'rpc',
        profileId: timings.profileId
    };
    recordRequestPhases(base, timings);
    if (timings.sendStart !== undefined && timings.firstChunkAt !== undefined) {
        recordPhase(base, 'ttfb', timings.firstChunkAt - timings.sendStart);
    }
    if (timings.firstChunkAt !== undefined && timings.lastChunkAt !== undefined) {
        recordPhase(base, 'streamDuration', timings.lastChunkAt - timings.firstChunkAt);
    }
    recordPhase(base, 'totalClientTime', totalClientTime, {
        count: timings.chunkCount
    });
    if (serverMeta?.server) {
        recordServerBreakdownPhases(base, serverMeta.server, 'server');
    }
    if (serverMeta?.operation) {
        recordOperationEvent(serverMeta.operation);
    }
}
export function resetConnectionTracking() {
    const state = getConnectionTrackingState();
    state.connectionTimeRecorded = false;
    state.pendingConnectionTimeMs = undefined;
}
