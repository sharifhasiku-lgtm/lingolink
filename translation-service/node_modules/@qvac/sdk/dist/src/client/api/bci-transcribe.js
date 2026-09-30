import { bciTranscribeResponseSchema, bciTranscribeClientParamsSchema, bciTranscribeStreamResponseSchema } from '@qvac/inference/surface';
import { stream, duplex } from '../rpc/rpc-client.js';
import { getClientLogger } from '../../logging/index.js';
import { TranscriptionFailedError } from '../../utils/errors-client.js';
import { decoratePromise } from '../../utils/decorate-promise.js';
import { parseClientInput } from '../parse-input.js';
import { generateClientRequestId } from './client-request-id.js';
const logger = getClientLogger();
function buildBciTranscribeRequest(params, requestId) {
    return {
        type: 'bciTranscribe',
        modelId: params.modelId,
        neuralData: typeof params.neuralData === 'string'
            ? { type: 'filePath', value: params.neuralData }
            : {
                type: 'base64',
                value: Buffer.from(params.neuralData).toString('base64')
            },
        ...(params.metadata === true && { metadata: true }),
        requestId
    };
}
export function bciTranscribe(params, options) {
    const parsed = parseClientInput(bciTranscribeClientParamsSchema, params);
    const requestId = generateClientRequestId();
    const inner = runBciTranscribe(parsed, requestId, options);
    return decoratePromise(inner, { requestId });
}
async function runBciTranscribe(params, requestId, options) {
    const request = buildBciTranscribeRequest(params, requestId);
    if (params.metadata === true) {
        const segments = [];
        for await (const response of stream(request, options)) {
            if (response.type === 'bciTranscribe') {
                const parsed = bciTranscribeResponseSchema.parse(response);
                if (parsed.segment) {
                    segments.push(parsed.segment);
                }
                if (parsed.done) {
                    break;
                }
            }
        }
        return segments;
    }
    let fullText = '';
    for await (const response of stream(request, options)) {
        if (response.type === 'bciTranscribe') {
            const parsed = bciTranscribeResponseSchema.parse(response);
            if (parsed.text) {
                fullText += parsed.text;
            }
            if (parsed.done) {
                break;
            }
        }
    }
    return fullText;
}
function buildBciTranscribeStreamRequest(params, requestId) {
    const streamOpts = {
        ...(params.windowTimesteps !== undefined && {
            windowTimesteps: params.windowTimesteps
        }),
        ...(params.hopTimesteps !== undefined && {
            hopTimesteps: params.hopTimesteps
        }),
        ...(params.emit !== undefined && { emit: params.emit })
    };
    return {
        type: 'bciTranscribeStream',
        modelId: params.modelId,
        ...(params.metadata === true && { metadata: true }),
        ...(Object.keys(streamOpts).length > 0 && { streamOpts }),
        requestId
    };
}
export function bciTranscribeStream(params, options) {
    if (params.metadata === true) {
        return createBciStreamSession(params, options, processLineMetadata, 'BciTranscribeStreamMetadataSession');
    }
    return createBciStreamSession(params, options, processLine, 'BciTranscribeStreamSession');
}
async function createBciStreamSession(params, options, process, sessionName) {
    const requestId = generateClientRequestId();
    const request = buildBciTranscribeStreamRequest(params, requestId);
    const { requestStream, responseStream } = await duplex(request, options);
    const responses = parseLines(responseStream, process);
    let consumed = false;
    return {
        requestId,
        write(neuralChunk) {
            requestStream.write(neuralChunk);
        },
        end() {
            requestStream.end();
        },
        destroy() {
            requestStream.destroy();
            responseStream.destroy();
        },
        [Symbol.asyncIterator]() {
            if (consumed) {
                throw new TranscriptionFailedError(`${sessionName} can only be iterated once`);
            }
            consumed = true;
            return responses;
        }
    };
}
/**
 * Line-delimited parser: reads newline-separated frames from a duplex
 * response stream, passes each non-empty line through `process`, and yields
 * whatever values it returns. `null` from `process` terminates the stream.
 */
async function* parseLines(responseStream, process) {
    let buf = '';
    for await (const chunk of responseStream) {
        buf += chunk.toString();
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
            const result = process(line);
            if (result === null)
                return;
            if (result !== undefined)
                yield result;
        }
    }
    if (buf.trim()) {
        const result = process(buf);
        if (result !== null && result !== undefined)
            yield result;
    }
}
function parseResponseLine(line) {
    if (!line.trim())
        return null;
    let parsed;
    try {
        parsed = JSON.parse(line);
    }
    catch {
        logger.warn('bciTranscribeStream: malformed JSON from server:', line);
        return null;
    }
    const obj = parsed;
    if (obj['type'] === 'error') {
        throw new TranscriptionFailedError(obj['message'] ?? 'Unknown server error');
    }
    return bciTranscribeStreamResponseSchema.parse(parsed);
}
/**
 * Shared wire-frame decoder. Returns `null` for the terminal `done` frame,
 * `undefined` for frames the caller should skip, or the value extracted from
 * the frame.
 */
function processWith(line, extract) {
    const response = parseResponseLine(line);
    if (response === null)
        return undefined;
    if (response.error)
        throw new TranscriptionFailedError(response.error);
    if (response.done)
        return null;
    return extract(response);
}
function processLine(line) {
    return processWith(line, (response) => (response.text?.trim() ? response.text : undefined));
}
function processLineMetadata(line) {
    return processWith(line, (response) => response.segment);
}
