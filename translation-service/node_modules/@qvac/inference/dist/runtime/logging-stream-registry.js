/**
 * Logging stream registry.
 *
 * - Registers subscriptions to log streams, keyed by source id
 * - Routes log lines to their subscribers
 * - Buffers logs during model loading, before a subscriber attaches
 * - Manages stream lifecycle (subscribe/unsubscribe)
 */
import { ALL_LOG_ID } from '../logging/namespaces.js';
const loggingStreams = new Map();
// Buffering for logs emitted during model loading (before a subscriber attaches)
const MAX_BUFFERED_LOGS_PER_MODEL = 100;
const BUFFER_EXPIRY_MS = 30_000;
const BUFFERING_TIMEOUT_MS = 5_000;
const logBuffer = new Map();
const modelsWithBuffering = new Set();
const bufferingTimeouts = new Map();
function clearBufferingTimeout(id) {
    const timeout = bufferingTimeouts.get(id);
    if (timeout) {
        clearTimeout(timeout);
        bufferingTimeouts.delete(id);
    }
}
export function startLogBuffering(id) {
    modelsWithBuffering.add(id);
}
export function stopLogBufferingWithTimeout(id) {
    clearBufferingTimeout(id);
    const timeout = setTimeout(() => {
        if (modelsWithBuffering.has(id)) {
            modelsWithBuffering.delete(id);
            logBuffer.delete(id);
        }
        bufferingTimeouts.delete(id);
    }, BUFFERING_TIMEOUT_MS);
    bufferingTimeouts.set(id, timeout);
}
export function registerLoggingStream(id, streamHandler) {
    if (!loggingStreams.has(id)) {
        loggingStreams.set(id, new Set());
    }
    loggingStreams.get(id).add(streamHandler);
    const buffered = logBuffer.get(id);
    if (buffered && buffered.length > 0) {
        for (const log of buffered) {
            try {
                streamHandler(log.level, log.namespace, log.message, log.sourceId);
            }
            catch (error) {
                console.error(`Error flushing buffered log for ID ${id}:`, error); // fallback (avoid recursion)
            }
        }
        logBuffer.delete(id);
    }
    modelsWithBuffering.delete(id);
    clearBufferingTimeout(id);
}
export function unregisterLoggingStream(id, streamHandler) {
    const streams = loggingStreams.get(id);
    if (streams) {
        streams.delete(streamHandler);
        if (streams.size === 0) {
            loggingStreams.delete(id);
        }
    }
}
export function unregisterAllLoggingStreams(id) {
    // Simply remove all logging handlers
    // Active streams will naturally terminate when no more logs flow
    loggingStreams.delete(id);
    logBuffer.delete(id);
    modelsWithBuffering.delete(id);
    clearBufferingTimeout(id);
}
export function sendLogToStreams(id, level, namespace, message) {
    // The originating id is preserved as `sourceId` so the global stream keeps the
    // real origin of each log instead of reporting the subscription id.
    deliverToStream(id, level, namespace, message, id);
    if (id !== ALL_LOG_ID) {
        deliverToStream(ALL_LOG_ID, level, namespace, message, id);
    }
}
function deliverToStream(id, level, namespace, message, sourceId) {
    const streams = loggingStreams.get(id);
    const isBuffering = modelsWithBuffering.has(id);
    if (streams && streams.size > 0) {
        for (const streamHandler of streams) {
            try {
                streamHandler(level, namespace, message, sourceId);
            }
            catch (error) {
                console.error(`Error sending log to stream for ID ${id}:`, error); // fallback (avoid recursion)
            }
        }
    }
    else if (isBuffering) {
        if (!logBuffer.has(id)) {
            logBuffer.set(id, []);
        }
        const buffer = logBuffer.get(id);
        const now = Date.now();
        const validLogs = buffer.filter((log) => now - log.timestamp < BUFFER_EXPIRY_MS);
        if (validLogs.length >= MAX_BUFFERED_LOGS_PER_MODEL) {
            validLogs.shift();
        }
        validLogs.push({ level, namespace, message, sourceId, timestamp: now });
        logBuffer.set(id, validLogs);
    }
}
export function hasLoggingStreams(id) {
    const streams = loggingStreams.get(id);
    return streams && streams.size > 0;
}
export function getLoggingStreamStats() {
    return {
        totalIds: loggingStreams.size,
        ids: Array.from(loggingStreams.keys()),
        totalStreams: Array.from(loggingStreams.values()).reduce((sum, streams) => sum + streams.size, 0),
        bufferedIds: logBuffer.size,
        idsWithBuffering: modelsWithBuffering.size,
        activeTimeouts: bufferingTimeouts.size
    };
}
export function clearAllLoggingStreams() {
    for (const timeout of bufferingTimeouts.values()) {
        clearTimeout(timeout);
    }
    loggingStreams.clear();
    logBuffer.clear();
    modelsWithBuffering.clear();
    bufferingTimeouts.clear();
}
