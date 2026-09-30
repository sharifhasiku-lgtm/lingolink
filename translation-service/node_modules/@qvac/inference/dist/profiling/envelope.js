/**
 * Helpers to inject/extract __profiling metadata in RPC payloads.
 */
import { PROFILING_KEY } from '../schemas/index.js';
export function createProfilingMeta(profileId, includeServerBreakdown, includeResourceGauges) {
    return {
        enabled: true,
        id: profileId,
        includeServer: includeServerBreakdown,
        includeResources: includeResourceGauges
    };
}
export function createProfilingDisabledMeta() {
    return { enabled: false };
}
export function injectProfilingMetaIntoObject(obj, meta) {
    return { ...obj, [PROFILING_KEY]: meta };
}
export function extractProfilingMeta(payload) {
    if (typeof payload === 'object' && payload !== null && PROFILING_KEY in payload) {
        const meta = payload[PROFILING_KEY];
        if (typeof meta === 'object' && meta !== null) {
            return meta;
        }
    }
    return undefined;
}
export function stripProfilingMeta(payload) {
    if (PROFILING_KEY in payload) {
        const { [PROFILING_KEY]: _unused, ...rest } = payload;
        void _unused;
        return rest;
    }
    return payload;
}
