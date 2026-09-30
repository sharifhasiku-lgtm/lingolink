import { getModelEntry } from '../runtime/model-registry.js';
import { getPlugin, getPluginHandler } from '../plugins/index.js';
import { profileReplyHandler, profileStreamHandler } from '../profiling/index.js';
import { PluginNotFoundError, PluginHandlerNotFoundError, PluginHandlerTypeMismatchError, PluginRequestValidationFailedError, PluginResponseValidationFailedError, ModelNotFoundError } from '../errors/index.js';
import { getEngineLogger } from '../logging/index.js';
import { formatZodError } from '../utils/zod-error.js';
const logger = getEngineLogger();
function resolvePluginHandler(modelId, handlerName) {
    const modelEntry = getModelEntry(modelId);
    if (!modelEntry) {
        throw new ModelNotFoundError(modelId);
    }
    const modelType = modelEntry.local.modelType;
    const plugin = getPlugin(modelType);
    if (!plugin) {
        throw new PluginNotFoundError(modelType);
    }
    const handlerDef = getPluginHandler(modelType, handlerName);
    if (!handlerDef) {
        const availableHandlers = Object.keys(plugin.handlers);
        throw new PluginHandlerNotFoundError(modelType, handlerName, availableHandlers);
    }
    return { modelType, plugin, handlerDef };
}
export async function handlePluginInvoke(request) {
    return profileReplyHandler({ op: 'pluginInvoke', request }, async () => {
        const { modelId, handler: handlerName, params } = request;
        logger.debug(`[pluginInvoke] modelId=${modelId} handler=${handlerName}`);
        const { handlerDef } = resolvePluginHandler(modelId, handlerName);
        if (handlerDef.streaming) {
            throw new PluginHandlerTypeMismatchError(handlerName, 'reply', 'streaming');
        }
        const parseResult = handlerDef.requestSchema.safeParse(params);
        if (!parseResult.success) {
            throw new PluginRequestValidationFailedError(handlerName, formatZodError(parseResult.error));
        }
        const result = await handlerDef.handler(parseResult.data);
        const responseParseResult = handlerDef.responseSchema.safeParse(result);
        if (!responseParseResult.success) {
            throw new PluginResponseValidationFailedError(handlerName, formatZodError(responseParseResult.error));
        }
        return {
            type: 'pluginInvoke',
            result: responseParseResult.data
        };
    });
}
export async function* handlePluginInvokeStream(request) {
    yield* profileStreamHandler({ op: 'pluginInvokeStream', request }, async function* () {
        const { modelId, handler: handlerName, params } = request;
        logger.debug(`[pluginInvokeStream] modelId=${modelId} handler=${handlerName}`);
        const { handlerDef } = resolvePluginHandler(modelId, handlerName);
        if (!handlerDef.streaming) {
            throw new PluginHandlerTypeMismatchError(handlerName, 'streaming', 'reply');
        }
        const parseResult = handlerDef.requestSchema.safeParse(params);
        if (!parseResult.success) {
            throw new PluginRequestValidationFailedError(handlerName, formatZodError(parseResult.error));
        }
        const generator = handlerDef.handler(parseResult.data);
        for await (const chunk of generator) {
            const responseParseResult = handlerDef.responseSchema.safeParse(chunk);
            if (!responseParseResult.success) {
                throw new PluginResponseValidationFailedError(handlerName, formatZodError(responseParseResult.error));
            }
            yield {
                type: 'pluginInvokeStream',
                result: responseParseResult.data,
                done: false
            };
        }
        yield {
            type: 'pluginInvokeStream',
            result: null,
            done: true
        };
    });
}
