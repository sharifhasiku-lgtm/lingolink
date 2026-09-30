import { send, stream as streamRpc } from '../dispatch.js';
import { finetuneRunParamsSchema, finetuneRunRequestSchema, finetuneStopRequestSchema, finetuneGetStateParamsSchema, finetuneGetStateRequestSchema, finetuneProgressResponseSchema, finetuneResponseSchema } from '../schemas/index.js';
import { InvalidResponseError, StreamEndedError } from '../errors/index.js';
import { parseClientInput } from './parse-input.js';
function isFinetuneReplyParams(params) {
    return (params.operation === 'pause' || params.operation === 'cancel' || params.operation === 'getState');
}
function createFinetuneReplyRequest(params) {
    if (params.operation === 'getState') {
        const getStateParams = parseClientInput(finetuneGetStateParamsSchema, params);
        return parseClientInput(finetuneGetStateRequestSchema, {
            type: 'finetune',
            ...getStateParams
        });
    }
    return parseClientInput(finetuneStopRequestSchema, {
        type: 'finetune',
        modelId: params.modelId,
        operation: params.operation
    });
}
export function finetune(params, rpcOptions) {
    if (isFinetuneReplyParams(params)) {
        const request = createFinetuneReplyRequest(params);
        const resultPromise = (async () => {
            const response = await send(request, rpcOptions);
            if (!response ||
                typeof response !== 'object' ||
                !('type' in response) ||
                response.type !== 'finetune') {
                throw new InvalidResponseError('finetune');
            }
            return finetuneResponseSchema.parse(response);
        })();
        resultPromise.catch(() => { });
        return resultPromise;
    }
    const runParams = parseClientInput(finetuneRunParamsSchema, params);
    let resultResolver = () => { };
    let resultRejecter = () => { };
    const resultPromise = new Promise((resolve, reject) => {
        resultResolver = resolve;
        resultRejecter = reject;
    });
    resultPromise.catch(() => { });
    const progressQueue = [];
    let progressDone = false;
    let progressResolve = null;
    let streamError = null;
    const processResponses = async () => {
        try {
            let sawTerminalResponse = false;
            const request = parseClientInput(finetuneRunRequestSchema, {
                type: 'finetune',
                ...runParams,
                withProgress: true
            });
            const responses = streamRpc(request, rpcOptions);
            for await (const response of responses) {
                if (response &&
                    typeof response === 'object' &&
                    'type' in response &&
                    response.type === 'finetune:progress') {
                    const progressResponse = finetuneProgressResponseSchema.parse(response);
                    progressQueue.push({
                        is_train: progressResponse.is_train,
                        loss: progressResponse.loss,
                        loss_uncertainty: progressResponse.loss_uncertainty,
                        accuracy: progressResponse.accuracy,
                        accuracy_uncertainty: progressResponse.accuracy_uncertainty,
                        global_steps: progressResponse.global_steps,
                        current_epoch: progressResponse.current_epoch,
                        current_batch: progressResponse.current_batch,
                        total_batches: progressResponse.total_batches,
                        elapsed_ms: progressResponse.elapsed_ms,
                        eta_ms: progressResponse.eta_ms
                    });
                    if (progressResolve) {
                        progressResolve();
                        progressResolve = null;
                    }
                    continue;
                }
                if (response &&
                    typeof response === 'object' &&
                    'type' in response &&
                    response.type === 'finetune') {
                    sawTerminalResponse = true;
                    const finetuneResponse = finetuneResponseSchema.parse(response);
                    resultResolver(finetuneResponse);
                    progressDone = true;
                    if (progressResolve) {
                        progressResolve();
                        progressResolve = null;
                    }
                }
                else {
                    throw new InvalidResponseError('finetune');
                }
            }
            if (!sawTerminalResponse) {
                throw new StreamEndedError();
            }
        }
        catch (error) {
            streamError = error instanceof Error ? error : new Error(String(error));
            resultRejecter(error);
            progressDone = true;
            if (progressResolve) {
                progressResolve();
                progressResolve = null;
            }
        }
    };
    void processResponses();
    const progressStream = (async function* () {
        while (true) {
            if (progressQueue.length > 0) {
                yield progressQueue.shift();
            }
            else if (progressDone) {
                if (streamError !== null) {
                    throw streamError;
                }
                break;
            }
            else {
                await new Promise((resolve) => {
                    progressResolve = resolve;
                });
            }
        }
    })();
    return {
        progressStream,
        result: resultPromise
    };
}
