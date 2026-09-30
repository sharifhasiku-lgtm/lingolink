import {} from '@qvac/inference/surface';
import { setConfig, setRuntimeContext } from '@qvac/inference/engine';
export function isInitConfigMessage(data) {
    return (typeof data === 'object' && data !== null && 'type' in data && data.type === '__init_config');
}
export function handleInitConfig(req, data) {
    try {
        if (data.config) {
            setConfig(data.config);
        }
        if (data.runtimeContext) {
            setRuntimeContext(data.runtimeContext);
        }
        req.reply(JSON.stringify({ success: true }), 'utf-8');
    }
    catch (error) {
        req.reply(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }), 'utf-8');
    }
}
export function isShutdownMessage(data) {
    return (typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        data.type === '__shutdown__');
}
export async function handleShutdown(req) {
    try {
        const { cleanupForTerminate } = await import('./lifecycle.js');
        await cleanupForTerminate();
        req.reply(JSON.stringify({ success: true }), 'utf-8');
    }
    catch (error) {
        req.reply(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }), 'utf-8');
    }
}
