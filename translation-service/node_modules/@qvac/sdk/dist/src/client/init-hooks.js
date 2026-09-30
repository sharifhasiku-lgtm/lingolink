import { getClientLogger, setGlobalLogLevel, setGlobalConsoleOutput } from '../logging/index.js';
import { SetConfigFailedError } from '../utils/errors-client.js';
const logger = getClientLogger();
function applyClientLoggerSettings(config) {
    if (config.loggerLevel !== undefined) {
        setGlobalLogLevel(config.loggerLevel);
    }
    if (config.loggerConsoleOutput !== undefined) {
        setGlobalConsoleOutput(config.loggerConsoleOutput);
    }
}
async function sendInitMessage(rpc, config, runtimeContext) {
    const initMessage = {
        type: '__init_config',
        config,
        runtimeContext
    };
    const req = rpc.request(1);
    req.send(JSON.stringify(initMessage), 'utf8');
    const response = await req.reply('utf8');
    const parsed = JSON.parse(response.toString());
    if (!parsed.success) {
        throw new SetConfigFailedError(parsed.error ?? 'Unknown error');
    }
}
/**
 * Initializes SDK configuration and runtime context.
 * Config is loaded once and becomes immutable on the worker side.
 *
 * @param rpc - The RPC client instance
 * @param resolveConfig - Runtime-specific config resolver function
 * @param runtimeContext - Optional runtime context (platform, device info)
 */
export async function initializeConfig(rpc, resolveConfig, runtimeContext) {
    const config = await resolveConfig();
    // Nothing to initialize
    if (!config && !runtimeContext) {
        return;
    }
    // Apply client-side logger settings
    if (config) {
        applyClientLoggerSettings(config);
        logger.info('📦 Initializing SDK config');
    }
    if (runtimeContext) {
        logger.info('📱 Runtime context:', runtimeContext);
    }
    try {
        await sendInitMessage(rpc, config, runtimeContext);
        logger.info('✅ Initialization complete');
    }
    catch (error) {
        logger.error('❌ Initialization failed:', error);
    }
}
/**
 * Legacy function for backward compatibility
 * @deprecated Use initializeConfig instead
 */
export function replayConfigIfCached() {
    logger.warn('⚠️ replayConfigIfCached is deprecated and has no effect. Config is now loaded from file during initialization.');
}
