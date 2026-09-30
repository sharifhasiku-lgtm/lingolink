import type { AbortSignal } from 'bare-abort-controller';
import type { BatchCompletionStreamPrompt, CompletionStats } from '../../../../schemas/index.js';
import type { DisposableScope } from '../../../../runtime/disposable-scope.js';
import type { Logger } from '../../../../logging/types.js';
type BatchModelEvent = {
    type: 'ids';
    ids: string[];
} | {
    type: 'token';
    id: string;
    token: string;
};
type BatchModelResult = {
    id: string;
    output: string;
};
type BatchModelStreamResult = {
    ids: string[];
    results: BatchModelResult[];
    modelExecutionMs: number;
    stats?: CompletionStats;
};
export declare function batchCompletion(params: {
    modelId: string;
    prompts: BatchCompletionStreamPrompt[];
}, opts: {
    signal: AbortSignal;
    scope: DisposableScope;
    logger?: Logger;
}): AsyncGenerator<BatchModelEvent, BatchModelStreamResult, unknown>;
export {};
