import QvacLogger, {} from '@qvac/logging';
import { LOG_LEVELS } from '@qvac/logging/constants';
import { isLevelEnabled, formatArg } from './utils.js';
import { registerLogger } from './registry.js';
export function createBaseLogger(namespace, options, extensions) {
    const qvacLogger = new QvacLogger(console);
    const initialLevel = options?.level ?? LOG_LEVELS.INFO;
    qvacLogger.setLevel(initialLevel);
    const transports = options?.transports || [];
    let consoleEnabled = options?.enableConsole !== false;
    const log = (level, ...args) => {
        if (!isLevelEnabled(level, qvacLogger.getLevel())) {
            return;
        }
        const message = args.map(formatArg).join(' ');
        // Log to console if enabled
        if (consoleEnabled) {
            switch (level) {
                case LOG_LEVELS.ERROR:
                    qvacLogger.error(`[${namespace}]`, ...args);
                    break;
                case LOG_LEVELS.WARN:
                    qvacLogger.warn(`[${namespace}]`, ...args);
                    break;
                case LOG_LEVELS.INFO:
                    qvacLogger.info(`[${namespace}]`, ...args);
                    break;
                case LOG_LEVELS.DEBUG:
                    qvacLogger.debug(`[${namespace}]`, ...args);
                    break;
            }
        }
        extensions?.onLog?.(level, namespace, message);
        for (const transport of transports) {
            try {
                const result = transport(level, namespace, message);
                if (result instanceof Promise) {
                    result.catch((error) => {
                        console.error(`Transport error in ${namespace}:`, error); // fallback (avoid recursion)
                    });
                }
            }
            catch (error) {
                console.error(`Transport error in ${namespace}:`, error); // fallback (avoid recursion)
            }
        }
    };
    const logger = {
        error: (...args) => log(LOG_LEVELS.ERROR, ...args),
        warn: (...args) => log(LOG_LEVELS.WARN, ...args),
        info: (...args) => log(LOG_LEVELS.INFO, ...args),
        debug: (...args) => log(LOG_LEVELS.DEBUG, ...args),
        trace: (...args) => log(LOG_LEVELS.DEBUG, ...args),
        setLevel: (level) => qvacLogger.setLevel(level),
        getLevel: () => qvacLogger.getLevel(),
        addTransport: (transport) => {
            transports.push(transport);
        },
        setConsoleOutput: (enabled) => {
            consoleEnabled = enabled;
        }
    };
    registerLogger(logger);
    return logger;
}
