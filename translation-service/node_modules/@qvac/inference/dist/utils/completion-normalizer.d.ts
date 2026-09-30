import type { CompletionEvent, CompletionError, CompletionStats, NormalizerConfig, StopReason, ToolCall } from '../schemas/index.js';
export declare const MAX_TOOL_FRAME_CHARS = 1048576;
export type CompletionNormalizer = ReturnType<typeof createCompletionNormalizer>;
export declare function createCompletionNormalizer(config: NormalizerConfig): {
    push: (token: string) => CompletionEvent[];
    finish: (opts?: {
        stats?: CompletionStats;
        toolCalls?: ToolCall[];
        error?: CompletionError;
        stopReason?: StopReason;
    }) => CompletionEvent[];
    getAccumulated: () => {
        rawText: string;
        contentText: string;
        thinkingText: string | undefined;
    };
};
