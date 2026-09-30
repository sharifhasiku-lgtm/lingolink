import { suspendRuntime } from '../runtime/runtime-lifecycle.js';
import { LifecycleSuspendFailedError } from '../errors/index.js';
export async function handleSuspend() {
    try {
        await suspendRuntime();
        return { type: 'suspend' };
    }
    catch (error) {
        throw new LifecycleSuspendFailedError(error instanceof Error ? error.message : String(error), error);
    }
}
