import { send, stream } from '../dispatch.js';
import { startLoggingStreamForModel } from './logging-stream-registry.js';
import { loadBuiltinToRequestSchema, loadCustomPluginToRequestSchema, reloadConfigOptionsToRequestSchema, isBuiltInModelType, isModelTypeAlias, normalizeModelType, inferModelTypeFromModelSrc, ModelType } from '../schemas/index.js';
import { ModelLoadFailedError, ModelTypeRequiredError, StreamEndedError, InvalidResponseError } from '../errors/index.js';
import { assertModelSrcMatchesModelType } from '../utils/load-model-validation.js';
import { parseClientInput } from './parse-input.js';
import { getAppLogger } from '../logging/index.js';
import { decoratePromise } from '../utils/decorate-promise.js';
import { generateRequestId } from '../runtime/request-id.js';
const logger = getAppLogger();
function isReactNativeRuntime() {
    const runtime = globalThis;
    return runtime.navigator?.product === 'ReactNative';
}
let warnedLocalVideoModelLoad = false;
export function loadModel(options, rpcOptions) {
    // Generate a stable `requestId` once, synchronously, before kicking
    // off any async work. The same id is:
    //   - threaded onto the request (`request.requestId`) so the engine's
    //     `registry.begin(...)` records it on the registry entry; and
    //   - attached to the returned promise via `decoratePromise` so the
    //     caller can target this exact call with `cancel({ requestId })`
    //     before `await` resolves. Generating it in the caller and surfacing
    //     it synchronously is what closes the "stop-button race" gap for
    //     `loadModel` / `downloadAsset` callers — same shape as the
    //     `CompletionRun.requestId` contract.
    const requestId = generateRequestId();
    const inner = runLoadModel(options, requestId, rpcOptions);
    return decoratePromise(inner, { requestId });
}
async function runLoadModel(options, requestId, rpcOptions) {
    const isReloadConfig = 'modelId' in options && !('modelSrc' in options);
    // Infer `modelType` from `modelSrc` when omitted; the schema still validates
    // the resolved options below.
    let resolvedOptions = options;
    if (!isReloadConfig) {
        let modelType = resolvedOptions['modelType'];
        if (typeof modelType === 'string') {
            assertModelSrcMatchesModelType(resolvedOptions['modelSrc'], modelType);
        }
        else if (modelType === undefined) {
            const inferred = inferModelTypeFromModelSrc(resolvedOptions['modelSrc']);
            if (!inferred) {
                throw new ModelTypeRequiredError();
            }
            resolvedOptions = { ...resolvedOptions, modelType: inferred };
            modelType = inferred;
        }
        if (typeof modelType === 'string' && isModelTypeAlias(modelType)) {
            const canonical = normalizeModelType(modelType);
            logger.warn(`Model type "${modelType}" is an alias and will be deprecated. Use "${canonical}" instead.`);
        }
        const canonicalModelType = typeof modelType === 'string' ? normalizeModelType(modelType) : modelType;
        const modelConfig = resolvedOptions['modelConfig'];
        if (isReactNativeRuntime() &&
            canonicalModelType === ModelType.sdcppGeneration &&
            modelConfig?.mode === 'video' &&
            !warnedLocalVideoModelLoad) {
            warnedLocalVideoModelLoad = true;
            const message = 'QVAC video generation works on React Native, but loading the video ' +
                'model on-device will usually fail or take several minutes — the video ' +
                'diffusion models currently shipped by QVAC are too large to load ' +
                'on typical mobile devices.';
            logger.warn(message);
        }
    }
    // Splice the caller-generated `requestId` onto the resolved options so
    // the request carries it. The engine uses the same value as the
    // registry-entry key — that match is what makes
    // `cancel({ requestId: op.requestId })` a no-op when no match exists
    // and a precise abort when it does.
    resolvedOptions = { ...resolvedOptions, requestId };
    const request = isReloadConfig
        ? parseClientInput(reloadConfigOptionsToRequestSchema, resolvedOptions)
        : isBuiltInModelType(resolvedOptions['modelType'])
            ? parseClientInput(loadBuiltinToRequestSchema, resolvedOptions)
            : parseClientInput(loadCustomPluginToRequestSchema, resolvedOptions);
    const modelLogger = isReloadConfig
        ? undefined
        : resolvedOptions['logger'];
    const onProgress = isReloadConfig
        ? undefined
        : resolvedOptions['onProgress'];
    if (onProgress) {
        // Use streaming for progress updates
        for await (const response of stream(request, rpcOptions)) {
            if (response.type === 'modelProgress') {
                onProgress(response);
            }
            else if (response.type === 'loadModel') {
                if (!response.success) {
                    throw new ModelLoadFailedError(response.error);
                }
                const modelId = response.modelId;
                // Start logging stream in the background if logger is provided, catch to avoid failing the entire loadModel operation
                if (modelLogger) {
                    try {
                        startLoggingStreamForModel(modelId, modelLogger);
                    }
                    catch (error) {
                        logger.warn(`Failed to start logging stream for model ${modelId}:`, error);
                    }
                }
                return modelId;
            }
        }
        throw new StreamEndedError();
    }
    // Use regular send for simple loading
    const response = await send(request, rpcOptions);
    if (response.type !== 'loadModel') {
        throw new InvalidResponseError('loadModel');
    }
    if (!response.success) {
        throw new ModelLoadFailedError(response.error);
    }
    const modelId = response.modelId;
    if (modelLogger) {
        try {
            startLoggingStreamForModel(modelId, modelLogger);
        }
        catch (error) {
            logger.warn(`Failed to start logging stream for model ${modelId}:`, error);
        }
    }
    return modelId;
}
