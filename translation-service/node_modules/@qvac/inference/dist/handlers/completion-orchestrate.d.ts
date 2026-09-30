import type { CompletionOrchestrateRequest, CompletionOrchestrateResponse, CompletionStreamRequest, CompletionStreamResponse } from '../schemas/index.js';
import { type ToolCallbackResult } from '../schemas/completion-stream.js';
/**
 * Reads newline-delimited JSON tool results off the duplex request stream
 * and resolves per-callId waiters. Chunk boundaries don't align with lines,
 * so a partial tail is buffered until its newline arrives.
 *
 * The pump is torn down by `close()` (called from a `finally` when
 * orchestration ends, however it ends) so the upstream iterator is returned
 * and the reader stops holding the request stream open.
 */
export declare class ToolResultReader {
    private buffer;
    private readonly results;
    private readonly waiters;
    private failed;
    private closed;
    private readonly iterator;
    constructor(inputStream: AsyncIterable<Buffer>);
    private pump;
    private failWaiters;
    private accept;
    waitFor(callId: string, timeoutMs?: number): Promise<ToolCallbackResult>;
    /**
     * Stop the pump and release the upstream iterator. Idempotent. Pending
     * waiters are failed so a caller blocked in `waitFor` can't hang after the
     * stream is torn down.
     */
    close(): void;
}
type RunTurn = (request: CompletionStreamRequest) => AsyncGenerator<CompletionStreamResponse, void, unknown>;
/**
 * The orchestration core, pure over its collaborators so it unit-tests
 * without the plugin registry: runs completion turns, forwards their events
 * downstream, and when a turn requests tool calls, emits `toolCallback`
 * frames and blocks on the client's results before starting the next turn
 * with the extended history.
 */
export declare function orchestrateCompletion(request: CompletionOrchestrateRequest, runTurn: RunTurn, reader: Pick<ToolResultReader, 'waitFor'>): AsyncGenerator<CompletionOrchestrateResponse>;
export declare function handleCompletionOrchestrate(request: CompletionOrchestrateRequest, inputStream: AsyncIterable<Buffer>): AsyncGenerator<CompletionOrchestrateResponse>;
export {};
