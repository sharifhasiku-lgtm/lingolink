import { safeTransport } from './transport.js';
import { createBaseLogger } from './base-logger.js';
const LOGGER_CACHE_KEY = Symbol.for('@qvac/sdk:logger-cache');
function getLoggerCache() {
    const global = globalThis;
    if (!global[LOGGER_CACHE_KEY]) {
        global[LOGGER_CACHE_KEY] = new Map();
    }
    return global[LOGGER_CACHE_KEY];
}
function createLogger(namespace, options) {
    const safeOptions = options
        ? {
            ...options,
            transports: options.transports?.map((t) => safeTransport(t, namespace)) || []
        }
        : undefined;
    return createBaseLogger(namespace, safeOptions);
}
/**
 * Creates or retrieves a namespaced logger instance.
 *
 * Loggers are cached per namespace when `options` is omitted, so repeated
 * calls with the same namespace return the same instance. When `options` is
 * supplied, a fresh logger is returned and the cache is bypassed.
 *
 * @param namespace - Namespace used to prefix log messages from this logger (e.g. `"my-app"`, `"@qvac/sdk:embed"`).
 * @param options - Optional logger configuration (custom transports, log level, etc.). When provided, a new logger is always constructed.
 * @returns A `Logger` instance scoped to `namespace`.
 */
export function getLogger(namespace, options) {
    const cache = getLoggerCache();
    if (!options) {
        const cached = cache.get(namespace);
        if (cached) {
            return cached;
        }
    }
    const logger = createLogger(namespace, options);
    if (!options) {
        cache.set(namespace, logger);
    }
    return logger;
}
