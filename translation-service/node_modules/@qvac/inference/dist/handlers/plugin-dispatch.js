import { getModelEntry } from '../runtime/model-registry.js';
import { getAllPlugins, getPlugin } from '../plugins/index.js';
import { profileReplyHandler, profileStreamHandler } from '../profiling/index.js';
import { ModelNotFoundError, ModelOperationNotSupportedError, PluginNotFoundError, PluginHandlerTypeMismatchError } from '../errors/index.js';
function resolvePluginHandlerDef(modelId, handlerName) {
    const entry = getModelEntry(modelId);
    if (!entry) {
        throw new ModelNotFoundError(modelId);
    }
    const plugin = getPlugin(entry.local.modelType);
    if (!plugin) {
        throw new PluginNotFoundError(entry.local.modelType);
    }
    const handlerDef = plugin.handlers[handlerName];
    if (!handlerDef) {
        const loadedModelType = entry.local.modelType;
        const supportedOperations = Object.keys(plugin.handlers);
        const suggestedModelTypes = getAllPlugins()
            .filter((p) => p.modelType !== loadedModelType && handlerName in p.handlers)
            .map((p) => p.modelType);
        throw new ModelOperationNotSupportedError(modelId, loadedModelType, handlerName, supportedOperations, suggestedModelTypes);
    }
    return handlerDef;
}
function resolvePluginHandler(modelId, handlerName, request) {
    const handlerDef = resolvePluginHandlerDef(modelId, handlerName);
    return {
        result: handlerDef.handler(request),
        streaming: handlerDef.streaming
    };
}
export async function dispatchPluginReply(modelId, handlerName, request) {
    return profileReplyHandler({ op: handlerName, request }, async () => {
        const { result, streaming } = resolvePluginHandler(modelId, handlerName, request);
        if (streaming) {
            throw new PluginHandlerTypeMismatchError(handlerName, 'reply', 'streaming');
        }
        return result;
    });
}
export async function* dispatchPluginStream(modelId, handlerName, request, inputStream) {
    yield* profileStreamHandler({ op: handlerName, request }, async function* () {
        const handlerDef = resolvePluginHandlerDef(modelId, handlerName);
        if (inputStream) {
            if (!handlerDef.duplex) {
                throw new PluginHandlerTypeMismatchError(handlerName, 'duplex', handlerDef.streaming ? 'streaming' : 'reply');
            }
            yield* handlerDef.handler(request, inputStream);
        }
        else {
            if (handlerDef.duplex) {
                throw new PluginHandlerTypeMismatchError(handlerName, 'streaming', 'duplex');
            }
            if (!handlerDef.streaming) {
                throw new PluginHandlerTypeMismatchError(handlerName, 'streaming', 'reply');
            }
            yield* handlerDef.handler(request);
        }
    });
}
