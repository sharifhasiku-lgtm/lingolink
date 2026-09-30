import { sendLogToStreams } from './logging-stream-registry.js';
import { createBaseLogger } from './base-logger.js';
export function createStreamLogger(id, namespace, options) {
    return createBaseLogger(namespace, {
        enableConsole: false, // Default to disable console output for stream loggers
        ...options
    }, {
        onLog: (level, namespace, message) => {
            sendLogToStreams(id, level, namespace, message);
        }
    });
}
