import { unregisterLogger } from './registry.js';
// Map C++ addon priority (0-4) to SDK LogLevel
const PRIORITY_TO_LEVEL = {
    0: 'error',
    1: 'warn',
    2: 'info',
    3: 'debug',
    4: 'debug'
};
const ADDON_LOGGERS_KEY = Symbol.for('@qvac/sdk:addon-loggers');
const MODEL_LOGGERS_KEY = Symbol.for('@qvac/sdk:model-loggers');
function getAddonLoggers() {
    const global = globalThis;
    if (!global[ADDON_LOGGERS_KEY]) {
        global[ADDON_LOGGERS_KEY] = new Map();
    }
    return global[ADDON_LOGGERS_KEY];
}
function getModelLoggers() {
    const global = globalThis;
    if (!global[MODEL_LOGGERS_KEY]) {
        global[MODEL_LOGGERS_KEY] = new Map();
    }
    return global[MODEL_LOGGERS_KEY];
}
export function registerAddonLogger(modelId, namespace, logger) {
    const addonLoggers = getAddonLoggers();
    const modelLoggers = getModelLoggers();
    if (!addonLoggers.has(namespace)) {
        addonLoggers.set(namespace, new Set());
    }
    addonLoggers.get(namespace).add(logger);
    modelLoggers.set(modelId, { namespace, logger });
}
export function unregisterAddonLogger(modelId) {
    const addonLoggers = getAddonLoggers();
    const modelLoggers = getModelLoggers();
    const entry = modelLoggers.get(modelId);
    if (entry) {
        addonLoggers.get(entry.namespace)?.delete(entry.logger);
        unregisterLogger(entry.logger);
        modelLoggers.delete(modelId);
    }
}
function routeLog(logger, level, message) {
    switch (level) {
        case 'error':
            logger.error(message);
            break;
        case 'warn':
            logger.warn(message);
            break;
        case 'info':
            logger.info(message);
            break;
        case 'debug':
            logger.debug(message);
            break;
    }
}
export function createAddonLoggerCallback(namespace) {
    return (priority, message) => {
        const loggers = getAddonLoggers().get(namespace);
        if (!loggers || loggers.size === 0)
            return;
        const level = PRIORITY_TO_LEVEL[priority] ?? 'debug';
        for (const logger of loggers) {
            routeLog(logger, level, message);
        }
    };
}
export function clearAllAddonLoggers() {
    getAddonLoggers().clear();
    getModelLoggers().clear();
}
