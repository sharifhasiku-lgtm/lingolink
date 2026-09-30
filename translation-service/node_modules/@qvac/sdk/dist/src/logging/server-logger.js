import { createStreamLogger } from './stream-logger.js';
import { SDK_LOG_ID, SDK_SERVER_NAMESPACE } from './namespaces.js';
let cachedLogger = null;
export function getServerLogger(options) {
    if (!options && cachedLogger) {
        return cachedLogger;
    }
    const logger = createStreamLogger(SDK_LOG_ID, SDK_SERVER_NAMESPACE, options);
    if (!options) {
        cachedLogger = logger;
    }
    return logger;
}
