import { type BatchCompletionClientParams, type BatchCompletionRun, type BatchCompletionStreamRequest, type McpClientInput, type RPCOptions, type Tool } from '@qvac/inference/surface';
import { type ToolInput } from '../../utils/tool-helpers.js';
type BatchPromptParams = Omit<BatchCompletionClientParams['prompts'][number], 'tools'> & {
    tools?: Tool[] | ToolInput[];
    mcp?: McpClientInput[];
};
type BatchCompletionParams = Omit<BatchCompletionClientParams, 'prompts' | 'requestId'> & {
    prompts: BatchPromptParams[];
    rpcOptions?: RPCOptions;
};
type BatchCompletionStreamFactory = (request: BatchCompletionStreamRequest, options?: RPCOptions) => AsyncGenerator<unknown>;
/**
 * Runs multiple prompts concurrently through one loaded model.
 *
 * The returned run exposes the request ID immediately, a merged event stream,
 * ordered results, aggregate batch statistics, and per-prompt streams via
 * `byId()`. Stream-level failures reject the aggregate promises; individual
 * terminal failures are also exposed through the corresponding `byId().final`.
 *
 * @param params - The loaded model, prompts, concurrency controls, and optional
 *   RPC settings for the batch.
 * @returns A live batch run that can be consumed as merged or per-prompt
 *   streams.
 */
export declare function batchCompletion(params: BatchCompletionParams): BatchCompletionRun;
export declare function createBatchCompletionRun(params: BatchCompletionParams, streamFactory: BatchCompletionStreamFactory): BatchCompletionRun;
export {};
//# sourceMappingURL=batch-completion.d.ts.map