import { resumeRuntime } from '../runtime/runtime-lifecycle.js';
import { LifecycleResumeFailedError } from '../errors/index.js';
export async function handleResume() {
    try {
        await resumeRuntime();
        return { type: 'resume' };
    }
    catch (error) {
        throw new LifecycleResumeFailedError(error instanceof Error ? error.message : String(error), error);
    }
}
