/**
 * Logger Instance Registry (Per-Process)
 *
 * Manages the lifecycle of all Logger instances in the CURRENT PROCESS.
 * Client and server run as separate processes, each with their own registry instance.
 *
 * Purpose:
 * - Tracks all Logger objects in this process (getLogger, createStreamLogger, etc.)
 * - Enables process-wide log level control via setGlobalLogLevel()
 * - Enables process-wide console output control via setGlobalConsoleOutput()
 * - Ensures proper cleanup when loggers are no longer needed
 *
 * Config Integration:
 * - loggerLevel and loggerConsoleOutput from config file apply to both processes
 * - Client applies settings after loading config, server applies during __init_config
 *
 * NOTE: This is separate from logging/logging-stream-registry.ts
 * which manages RPC subscriptions for streaming logs to connected clients.
 *
 * IMPORTANT: Some bundlers may evaluate the same logical module multiple times with
 * subpath imports like `#rpc`, which can duplicate internal module state.
 * We use globalThis + Symbol.for() to guarantees a single instance across all
 * module evaluations and runtimes.
 */
import type { LogLevel } from '@qvac/logging';
import type { Logger } from './types.js';
export declare function registerLogger(logger: Logger): void;
export declare function unregisterLogger(logger: Logger): void;
export declare function setGlobalLogLevel(level: LogLevel): void;
export declare function setGlobalConsoleOutput(enabled: boolean): void;
//# sourceMappingURL=registry.d.ts.map