import type { Tool } from '../schemas/tools.js';
import type { McpClientInput } from '../schemas/mcp-adapter.js';
import type { ToolHandler } from './tool-helpers.js';
export type { McpClient, McpClientInput } from '../schemas/mcp-adapter.js';
export type ToolHandlerMap = Map<string, ToolHandler>;
export type McpToolsResult = {
    tools: Tool[];
    handlers: ToolHandlerMap;
};
export declare function getMcpToolsWithHandlers(clients: McpClientInput[]): Promise<McpToolsResult>;
export declare function getMcpTools(clients: McpClientInput[]): Promise<Tool[]>;
