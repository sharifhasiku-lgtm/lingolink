import { send } from '../dispatch.js';
import { InvalidResponseError } from '../errors/index.js';
export async function getSystemResources(input) {
    const request = {
        type: 'getSystemResources',
        ...(input?.sample !== undefined && { sample: input.sample })
    };
    const response = await send(request);
    if (response.type !== 'getSystemResources') {
        throw new InvalidResponseError('getSystemResources');
    }
    return {
        capabilities: response.capabilities,
        ...(response.sample && { sample: response.sample })
    };
}
