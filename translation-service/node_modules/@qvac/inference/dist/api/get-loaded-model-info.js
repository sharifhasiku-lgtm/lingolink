import { send } from '../dispatch.js';
import { InvalidResponseError } from '../errors/index.js';
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
export async function getLoadedModelInfo(params, rpcOptions) {
    const request = {
        type: 'getLoadedModelInfo',
        modelId: params.modelId
    };
    const response = await send(request, rpcOptions);
    if (response.type !== 'getLoadedModelInfo') {
        throw new InvalidResponseError('getLoadedModelInfo');
    }
    return response.info;
}
