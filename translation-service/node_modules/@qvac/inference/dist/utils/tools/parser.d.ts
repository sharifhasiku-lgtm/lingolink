import type { Tool, ToolCall, ToolCallError, ToolDialect } from '../../schemas/index.js';
export declare function parseToolCalls(text: string, tools: Tool[], dialect?: ToolDialect): {
    toolCalls: ToolCall[];
    errors: ToolCallError[];
};
