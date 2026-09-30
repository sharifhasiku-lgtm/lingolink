import { type BatchCompletionClientParams, type BatchCompletionRun, type BatchCompletionStreamRequest, type McpClientInput, type RPCOptions, type Tool } from '../schemas/index.js';
import { type ToolInput } from '../utils/tool-helpers.js';
type BatchPromptParams = Omit<BatchCompletionClientParams['prompts'][number], 'tools'> & {
    tools?: Tool[] | ToolInput[];
    mcp?: McpClientInput[];
};
type BatchCompletionParams = Omit<BatchCompletionClientParams, 'prompts' | 'requestId'> & {
    prompts: BatchPromptParams[];
    rpcOptions?: RPCOptions;
};
type BatchCompletionStreamFactory = (request: BatchCompletionStreamRequest, options?: RPCOptions) => AsyncGenerator<unknown>;
export declare function batchCompletion(params: BatchCompletionParams): BatchCompletionRun;
export declare function createBatchCompletionRun(params: BatchCompletionParams, streamFactory: BatchCompletionStreamFactory): BatchCompletionRun;
export {};
