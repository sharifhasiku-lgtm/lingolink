import type Buffer from 'bare-buffer';
export declare function dispatchPluginReply<TRequest, TResponse>(modelId: string, handlerName: string, request: TRequest): Promise<TResponse>;
export declare function dispatchPluginStream<TRequest, TResponse>(modelId: string, handlerName: string, request: TRequest, inputStream?: AsyncIterable<Buffer>): AsyncGenerator<TResponse>;
