import type { Tool } from '@qvac/inference/surface';
import type { McpClientInput } from '@qvac/inference/surface';
import type { ToolHandler } from './tool-helpers.js';
export type { McpClient, McpClientInput } from '@qvac/inference/surface';
export type ToolHandlerMap = Map<string, ToolHandler>;
export type McpToolsResult = {
    tools: Tool[];
    handlers: ToolHandlerMap;
};
export declare function getMcpToolsWithHandlers(clients: McpClientInput[]): Promise<McpToolsResult>;
export declare function getMcpTools(clients: McpClientInput[]): Promise<Tool[]>;
//# sourceMappingURL=mcp-adapter.d.ts.map