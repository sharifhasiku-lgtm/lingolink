import type { Request } from './schemas/index.js';
export { send, stream, duplex, close, type DuplexSession, type DuplexWritable, type DuplexReadable } from './dispatch.js';
export { setConfig, setRuntimeContext } from './runtime/state.js';
export { initialize, cleanupForTerminate } from './runtime/lifecycle.js';
export declare function dispatchTransport(request: Request): "duplex" | "stream" | "reply" | "progress" | undefined;
