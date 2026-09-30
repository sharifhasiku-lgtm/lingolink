import type { RPCOptions } from '../schemas/index.js';
export interface InvokePluginOptions<TParams = unknown> {
    modelId: string;
    handler: string;
    params: TParams;
}
/**
 * Invoke a non-streaming plugin handler.
 *
 * @param options - Invocation payload.
 * @param options.modelId - The identifier of the model instance that owns the plugin.
 * @param options.handler - Name of the plugin handler to invoke.
 * @param options.params - Handler-specific parameters, passed through to the plugin.
 * @param rpcOptions - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns A promise resolving to the handler's result payload (typed via the `TResponse` generic).
 * @throws {QvacErrorBase} When the response type is invalid (`InvalidResponseError`) or the RPC layer fails.
 */
export declare function invokePlugin<TResponse = unknown, TParams = unknown>(options: InvokePluginOptions<TParams>, rpcOptions?: RPCOptions): Promise<TResponse>;
/**
 * Invoke a streaming plugin handler.
 *
 * @param options - Invocation payload.
 * @param options.modelId - The identifier of the model instance that owns the plugin.
 * @param options.handler - Name of the plugin stream handler to invoke.
 * @param options.params - Handler-specific parameters, passed through to the plugin.
 * @param rpcOptions - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns An async generator yielding chunk payloads (typed via the `TResponse` generic) until the stream completes.
 * @throws {QvacErrorBase} When an intermediate response has the wrong type (`InvalidResponseError`) or the RPC layer fails.
 */
export declare function invokePluginStream<TResponse = unknown, TParams = unknown>(options: InvokePluginOptions<TParams>, rpcOptions?: RPCOptions): AsyncGenerator<TResponse>;
