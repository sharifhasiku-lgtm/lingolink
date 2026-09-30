import { getLifecycleState } from '../runtime/runtime-lifecycle.js';
export function handleState() {
    return {
        type: 'state',
        state: getLifecycleState()
    };
}
