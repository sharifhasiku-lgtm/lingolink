import { createErrorResponse, responseSchema } from '@qvac/inference/surface';
import { getServerLogger } from '../logging/index.js';
import {} from './rpc/profiling/index.js';
const logger = getServerLogger();
function buildErrorResponseData(error, profiler) {
    const errorResponse = createErrorResponse(error);
    const validated = responseSchema.parse(errorResponse);
    const json = JSON.stringify(validated);
    return profiler ? profiler.serializeError(json) : json;
}
export function sendErrorResponse(req, error, profiler) {
    try {
        req.reply(buildErrorResponseData(error, profiler), 'utf-8');
    }
    catch (responseError) {
        logger.error('Failed to create error response:', responseError);
        const fallbackError = createErrorResponse(new Error('Internal server error'));
        req.reply(JSON.stringify(fallbackError), 'utf-8');
    }
}
export function sendStreamErrorResponse(stream, error, profiler) {
    try {
        stream.write(buildErrorResponseData(error, profiler) + '\n', 'utf-8');
        stream.end();
    }
    catch (responseError) {
        logger.error('Failed to create stream error response:', responseError);
        const fallbackError = createErrorResponse(new Error('Internal server error'));
        stream.write(JSON.stringify(fallbackError) + '\n', 'utf-8');
        stream.end();
    }
}
