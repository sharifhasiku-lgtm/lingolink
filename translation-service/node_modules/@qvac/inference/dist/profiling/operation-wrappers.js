/**
 * Generic wrappers for profiling handler execution.
 * Used to wrap dispatch/invoke functions with timing capture.
 */
import { PROFILING_KEY, OPERATION_EVENT_KEY } from '../schemas/index.js';
import { nowMs, generateProfileId } from './clock.js';
import { record, shouldIncludeResourceGauges, shouldProfile } from './controller.js';
import { getResourceCollector } from '../resources/instance.js';
import { buildOperationEvent } from './operation-metrics.js';
function isTerminalChunk(value) {
    return typeof value === 'object' && value !== null && 'done' in value && value.done === true;
}
function getRequestProfilingMeta(request) {
    if (!request || typeof request !== 'object') {
        return undefined;
    }
    const meta = request[PROFILING_KEY];
    if (!meta || typeof meta !== 'object') {
        return undefined;
    }
    return meta;
}
function resolveOperationProfiling(options) {
    if (options.perCall) {
        return { perCall: options.perCall };
    }
    const meta = getRequestProfilingMeta(options.request);
    if (!meta) {
        return { perCall: undefined };
    }
    if (meta.enabled === false) {
        return { perCall: { enabled: false } };
    }
    return {
        perCall: {
            enabled: true,
            includeServerBreakdown: meta.includeServer,
            includeResourceGauges: meta.includeResources,
            mode: meta.mode
        }
    };
}
function toProfilerResourceGauge(sample, sampledAt) {
    const gpus = sample.gpus.status === 'supported'
        ? {
            ...sample.gpus,
            value: sample.gpus.value.map((gpu) => ({
                id: gpu.id,
                compute: gpu.compute,
                memoryUsedBytes: gpu.memoryUsedBytes
            }))
        }
        : sample.gpus;
    return {
        sampledAt,
        cpu: sample.cpu,
        memory: sample.memory,
        gpus
    };
}
function buildAndRecordOperationEvent(params) {
    const event = buildOperationEvent(params.options.op, params.profileId, params.startTs, params.executionMs, params.options.request, params.finalResponse, params.ttfb);
    if (!event)
        return undefined;
    if (params.errored) {
        event.tags = { ...event.tags, error: 'true' };
    }
    if (params.count !== undefined && params.count > 0) {
        event.count = params.count;
    }
    if (shouldIncludeResourceGauges(params.profiling.perCall)) {
        const resources = getResourceCollector()?.sample();
        if (resources) {
            event.resources = toProfilerResourceGauge(resources, nowMs());
        }
    }
    record(event);
    return event;
}
export async function profileReplyHandler(options, handler) {
    const profiling = resolveOperationProfiling(options);
    if (!shouldProfile(options.op, profiling.perCall)) {
        return handler();
    }
    const profileId = generateProfileId();
    const startTs = nowMs();
    try {
        const result = await handler();
        const executionMs = nowMs() - startTs;
        const event = buildAndRecordOperationEvent({
            options,
            profiling,
            profileId,
            startTs,
            executionMs,
            finalResponse: result
        });
        if (event) {
            ;
            result[OPERATION_EVENT_KEY] = event;
        }
        return result;
    }
    catch (error) {
        const executionMs = nowMs() - startTs;
        buildAndRecordOperationEvent({
            options,
            profiling,
            profileId,
            startTs,
            executionMs,
            errored: true
        });
        throw error;
    }
}
export async function* profileStreamHandler(options, handler) {
    const profiling = resolveOperationProfiling(options);
    if (!shouldProfile(options.op, profiling.perCall)) {
        return yield* handler();
    }
    const profileId = generateProfileId();
    const startTs = nowMs();
    let ttfb;
    let lastChunk;
    let chunkCount = 0;
    let eventAttached = false;
    const iterator = handler();
    try {
        while (true) {
            const result = await iterator.next();
            if (result.done) {
                if (!eventAttached) {
                    const executionMs = nowMs() - startTs;
                    buildAndRecordOperationEvent({
                        options,
                        profiling,
                        profileId,
                        startTs,
                        executionMs,
                        finalResponse: lastChunk,
                        ttfb,
                        count: chunkCount
                    });
                }
                return result.value;
            }
            const chunk = result.value;
            if (ttfb === undefined) {
                ttfb = nowMs() - startTs;
            }
            chunkCount++;
            lastChunk = chunk;
            if (!eventAttached && isTerminalChunk(chunk)) {
                const executionMs = nowMs() - startTs;
                const event = buildAndRecordOperationEvent({
                    options,
                    profiling,
                    profileId,
                    startTs,
                    executionMs,
                    finalResponse: chunk,
                    ttfb,
                    count: chunkCount
                });
                if (event) {
                    ;
                    chunk[OPERATION_EVENT_KEY] = event;
                }
                eventAttached = true;
            }
            yield chunk;
        }
    }
    catch (error) {
        const executionMs = nowMs() - startTs;
        buildAndRecordOperationEvent({
            options,
            profiling,
            profileId,
            startTs,
            executionMs,
            finalResponse: lastChunk,
            ttfb,
            count: chunkCount,
            errored: true
        });
        throw error;
    }
    finally {
        await iterator.return?.(undefined);
    }
}
