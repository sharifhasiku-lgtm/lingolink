/**
 * Logging Stream Registry
 *
 * Manages RPC subscriptions for streaming logs from server to connected clients.
 *
 * Purpose:
 * - Registers client subscriptions to model/SDK log streams
 * - Routes log messages to subscribed clients via RPC
 * - Buffers logs during model loading (before client subscribes)
 * - Manages stream lifecycle (subscribe/unsubscribe)
 *
 */
import type { LogLevel } from '@qvac/logging';
type StreamHandler = (level: LogLevel, namespace: string, message: string, sourceId: string) => void;
export declare function startLogBuffering(id: string): void;
export declare function stopLogBufferingWithTimeout(id: string): void;
export declare function registerLoggingStream(id: string, streamHandler: StreamHandler): void;
export declare function unregisterLoggingStream(id: string, streamHandler: StreamHandler): void;
export declare function unregisterAllLoggingStreams(id: string): void;
export declare function sendLogToStreams(id: string, level: LogLevel, namespace: string, message: string): void;
export declare function hasLoggingStreams(id: string): boolean | undefined;
export declare function getLoggingStreamStats(): {
    totalIds: number;
    ids: string[];
    totalStreams: number;
    bufferedIds: number;
    idsWithBuffering: number;
    activeTimeouts: number;
};
export declare function clearAllLoggingStreams(): void;
export {};
//# sourceMappingURL=logging-stream-registry.d.ts.map