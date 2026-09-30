import { getLogger } from './logger.js';
const CLIENT_NAMESPACE = 'sdk:client';
const CLIENT_LOGGER_KEY = Symbol.for('@qvac/sdk:client-logger');
function getCachedClientLogger() {
    const global = globalThis;
    return global[CLIENT_LOGGER_KEY] ?? null;
}
function setCachedClientLogger(logger) {
    const global = globalThis;
    global[CLIENT_LOGGER_KEY] = logger;
}
export function getClientLogger(options) {
    if (!options) {
        const cached = getCachedClientLogger();
        if (cached) {
            return cached;
        }
    }
    // The SDK's own logs stay off the console unless the caller opts in.
    const logger = getLogger(CLIENT_NAMESPACE, { enableConsole: false, ...options });
    if (!options) {
        setCachedClientLogger(logger);
    }
    return logger;
}
