import type { LoggingStreamResponse } from '../schemas/logging-stream.js';
export type ServerLogHandler = (log: LoggingStreamResponse) => void;
/**
 * Subscribes to every log through a single stream: the engine's own logs, per-model
 * addon logs (llamacpp, whispercpp, …) for all loaded models, and RAG logs —
 * without having to open a {@link loggingStream} per id.
 *
 * Each delivered log keeps its origin in `log.id`: `LOG_ID` for the engine's own
 * logs, the model id for model logs, or the RAG workspace key. Use it to tell the
 * sources apart.
 *
 * Internally this opens a {@link loggingStream} on the reserved `ALL_LOG_ID`
 * stream that the engine fans every log into.
 *
 * @param handler - called once per log line.
 * @returns a function that stops the subscription.
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeServerLogs((log) => {
 *   console.log(`[${log.level}] ${log.id} ${log.namespace}: ${log.message}`);
 * });
 * // later
 * unsubscribe();
 * ```
 */
export declare function subscribeServerLogs(handler: ServerLogHandler): () => void;
