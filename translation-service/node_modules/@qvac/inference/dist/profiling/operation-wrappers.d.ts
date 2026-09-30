/**
 * Generic wrappers for profiling handler execution.
 * Used to wrap dispatch/invoke functions with timing capture.
 */
import { type PerCallProfiling } from '../schemas/index.js';
export interface ProfiledReplyOptions<TRequest> {
    op: string;
    request: TRequest;
    perCall?: PerCallProfiling;
}
export interface ProfiledStreamOptions<TRequest> {
    op: string;
    request: TRequest;
    perCall?: PerCallProfiling;
}
export declare function profileReplyHandler<TRequest, TResponse>(options: ProfiledReplyOptions<TRequest>, handler: () => Promise<TResponse>): Promise<TResponse>;
export declare function profileStreamHandler<TRequest, TResponse, TReturn = unknown>(options: ProfiledStreamOptions<TRequest>, handler: () => AsyncGenerator<TResponse, TReturn>): AsyncGenerator<TResponse, TReturn>;
