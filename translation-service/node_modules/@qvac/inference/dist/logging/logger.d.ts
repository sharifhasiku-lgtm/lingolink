import { type LogLevel } from '@qvac/logging';
import type { Logger, LoggerOptions } from './types.js';
export declare function registerLogger(logger: Logger): void;
export declare function unregisterLogger(logger: Logger): void;
export declare function setGlobalLogLevel(level: LogLevel): void;
export declare function setGlobalConsoleOutput(enabled: boolean): void;
interface LoggerExtensions {
    onLog?: (level: LogLevel, namespace: string, message: string) => void;
}
export declare function createBaseLogger(namespace: string, options?: LoggerOptions, extensions?: LoggerExtensions): Logger;
/**
 * Creates or retrieves a namespaced logger instance.
 *
 * Loggers are cached per namespace when `options` is omitted, so repeated
 * calls with the same namespace return the same instance. When `options` is
 * supplied, a fresh logger is returned and the cache is bypassed.
 *
 * @param namespace - Namespace used to prefix log messages from this logger (e.g. `"my-app"`, `"@qvac/inference:embed"`).
 * @param options - Optional logger configuration (custom transports, log level, etc.). When provided, a new logger is always constructed.
 * @returns A `Logger` instance scoped to `namespace`.
 */
export declare function getLogger(namespace: string, options?: LoggerOptions): Logger;
/**
 * Builds a logger whose every line is published to the log stream registered
 * under `id`, letting subscribers observe it live. Console output is off by
 * default; callers opt back in through `options`.
 */
export declare function createStreamLogger(id: string, namespace: string, options?: LoggerOptions): Logger;
/**
 * The library's own operational logger. Its lines flow to the {@link LOG_ID}
 * stream (and the {@link ALL_LOG_ID} fan-in), so a subscriber can watch what the
 * engine and its addons are doing. Cached when called without options.
 */
export declare function getEngineLogger(options?: LoggerOptions): Logger;
/**
 * The application-facing logger for the public API surface. Its lines stay off
 * the log stream and, by default, off the console — the caller opts in through
 * `options`. Cached when called without options.
 */
export declare function getAppLogger(options?: LoggerOptions): Logger;
export {};
