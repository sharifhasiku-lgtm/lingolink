import type { Logger, LoggerOptions } from './types.js';
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
export declare function getLogger(namespace: string, options?: LoggerOptions): Logger;
//# sourceMappingURL=logger.d.ts.map