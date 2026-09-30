import {} from '@qvac/inference/surface';
import { send } from '../rpc/rpc-client.js';
import { InvalidResponseError } from '../../utils/errors-client.js';
/**
 * Checks whether the local SDK worker is responsive by sending a heartbeat
 * round-trip.
 *
 * @returns A promise that resolves to a heartbeat response.
 * @throws {QvacErrorBase} When the response is invalid.
 *
 * @example
 * await heartbeat();
 */
export async function heartbeat() {
    const request = { type: 'heartbeat' };
    const response = await send(request);
    if (response.type !== 'heartbeat') {
        throw new InvalidResponseError('heartbeat');
    }
    return response;
}
