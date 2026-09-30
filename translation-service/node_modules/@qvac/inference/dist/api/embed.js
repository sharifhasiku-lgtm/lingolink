import { send } from '../dispatch.js';
import { InvalidResponseError } from '../errors/index.js';
import { decoratePromise } from '../utils/decorate-promise.js';
import { generateRequestId } from '../runtime/request-id.js';
export function embed(params, options) {
    // The caller-generated `requestId` is surfaced synchronously on the
    // returned promise so the caller can `cancel({ requestId })` before
    // `await` resolves. The same id is carried on the request so the
    // registry entry uses it as the canonical key — matching the
    // `loadModel` / `downloadAsset` / `completion` shape.
    const requestId = generateRequestId();
    const inner = runEmbed(params, requestId, options);
    return decoratePromise(inner, { requestId });
}
async function runEmbed(params, requestId, options) {
    const request = {
        type: 'embed',
        ...params,
        requestId
    };
    const response = await send(request, options);
    if (response.type !== 'embed') {
        throw new InvalidResponseError('embed');
    }
    return {
        embedding: response.embedding,
        ...(response.stats !== undefined && { stats: response.stats })
    };
}
