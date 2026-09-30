import { unloadModel } from '../plugins/ops/unload-model.js';
import { getRegistryStats } from '../runtime/model-registry.js';
import { getEngineLogger } from '../logging/index.js';
const logger = getEngineLogger();
export async function handleUnloadModel(request) {
    const { modelId, clearStorage } = request;
    try {
        logger.debug('Unloading model', modelId);
        await unloadModel({ modelId, clearStorage });
        const stats = getRegistryStats();
        const modelsActive = stats.totalModels > 0;
        return {
            type: 'unloadModel',
            success: true,
            hasActiveModels: modelsActive
        };
    }
    catch (error) {
        logger.error('Error during model unload:', error);
        return {
            type: 'unloadModel',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
