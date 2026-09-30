import { type GetLoadedModelInfoParams, type LoadedModelInfo } from '../schemas/index.js';
import { type RPCOptions } from '../schemas/common.js';
/**
 * Returns introspection info for a loaded `modelId`.
 *
 * `info.modelType` and `info.handlers` are authoritative. Use them to preflight
 * a call before making the actual request, e.g. confirm that a model supports
 * `transcribeStream` before calling `transcribe()`.
 *
 * Throws `ModelNotFoundError` if no entry exists for `modelId`.
 *
 * @example
 * ```typescript
 * const info = await getLoadedModelInfo({ modelId });
 * if (info.handlers.includes("completionStream")) {
 *   // safe to call completion()
 * }
 * ```
 */
export declare function getLoadedModelInfo(params: GetLoadedModelInfoParams, rpcOptions?: RPCOptions): Promise<LoadedModelInfo>;
