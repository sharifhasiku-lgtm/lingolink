import { send } from '../rpc/rpc-client.js';
import {} from '@qvac/inference/surface';
import { InvalidResponseError } from '../../utils/errors-client.js';
import { decoratePromise } from '../../utils/decorate-promise.js';
import { generateClientRequestId } from './client-request-id.js';
export function embed(params, options) {
    // Client-generated `requestId` is surfaced synchronously on the
    // returned promise so the caller can `cancel({ requestId })` before
    // `await` resolves. The same id is threaded onto the wire envelope so
    // the server's registry entry uses it as the canonical key —
    // matching the `loadModel` / `downloadAsset` / `completion` shape.
    const requestId = generateClientRequestId();
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
