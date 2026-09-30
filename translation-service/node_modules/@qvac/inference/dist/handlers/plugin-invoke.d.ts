import type { PluginInvokeRequest, PluginInvokeResponse, PluginInvokeStreamRequest, PluginInvokeStreamResponse } from '../schemas/plugin.js';
export declare function handlePluginInvoke(request: PluginInvokeRequest): Promise<PluginInvokeResponse>;
export declare function handlePluginInvokeStream(request: PluginInvokeStreamRequest): AsyncGenerator<PluginInvokeStreamResponse>;
