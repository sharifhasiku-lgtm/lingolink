import { send } from '../dispatch.js';
import { InvalidResponseError } from '../errors/index.js';
/**
 * Checks whether the local engine is responsive by sending a heartbeat
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
