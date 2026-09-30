import { getEngineLogger } from '../logging/index.js';
import { LifecycleOperationBlockedError } from '../errors/index.js';
const logger = getEngineLogger();
const LIFECYCLE_ALLOWED_TYPES = new Set(['suspend', 'resume', 'state']);
const swarms = new Map();
const stores = new Map();
const resumeListeners = new Set();
let state = 'active';
let transitionPromise = null;
/**
 * Register a callback fired after the runtime returns to "active". Lets in-flight
 * work (e.g. an HTTP download whose socket died while backgrounded) recover the
 * instant `resume()` runs instead of waiting for a timeout. Returns an
 * unregister function — callers MUST call it when their work finishes so the
 * listener doesn't leak into the next operation.
 */
export function onResume(listener) {
    resumeListeners.add(listener);
    return () => resumeListeners.delete(listener);
}
function notifyResume() {
    for (const listener of Array.from(resumeListeners)) {
        try {
            listener();
        }
        catch (error) {
            logger.error('Lifecycle: onResume listener threw:', error);
        }
    }
}
export function registerSwarm(swarm, meta) {
    swarms.set(swarm, meta);
    logger.debug(`Lifecycle: registered swarm [${meta.label}]`);
}
export function unregisterSwarm(swarm) {
    const meta = swarms.get(swarm);
    swarms.delete(swarm);
    if (meta) {
        logger.debug(`Lifecycle: unregistered swarm [${meta.label}]`);
    }
}
export function registerCorestore(store, meta) {
    stores.set(store, meta);
    logger.debug(`Lifecycle: registered corestore [${meta.label}]`);
}
export function unregisterCorestore(store) {
    const meta = stores.get(store);
    stores.delete(store);
    if (meta) {
        logger.debug(`Lifecycle: unregistered corestore [${meta.label}]`);
    }
}
export function getLifecycleState() {
    return state;
}
export function assertLifecycleAllowed(request) {
    if (state === 'active' || LIFECYCLE_ALLOWED_TYPES.has(request.type))
        return;
    throw new LifecycleOperationBlockedError(request.type, state);
}
export function getRegisteredResourceCounts() {
    return { swarms: swarms.size, stores: stores.size };
}
export function resetLifecycleState() {
    swarms.clear();
    stores.clear();
    resumeListeners.clear();
    state = 'active';
    transitionPromise = null;
}
async function runPhase(snapshot, liveSet, fn, phaseLabel) {
    const errors = [];
    for (const [resource, meta] of snapshot) {
        try {
            await fn(resource);
            logger.debug(`Lifecycle: ${phaseLabel} [${meta.label}] OK`);
        }
        catch (error) {
            if (!liveSet.has(resource))
                continue;
            logger.error(`Lifecycle: ${phaseLabel} [${meta.label}] failed:`, error);
            errors.push(new Error(`${meta.label}: ${String(error)}`));
        }
    }
    if (errors.length > 0) {
        throw new AggregateError(errors, `Lifecycle ${phaseLabel} phase failed`);
    }
}
export async function suspendRuntime() {
    if (state === 'suspended')
        return;
    if (state === 'suspending' && transitionPromise)
        return transitionPromise;
    // Opposite transition in flight: wait for it, then re-evaluate
    if (state === 'resuming' && transitionPromise) {
        await transitionPromise;
        return suspendRuntime();
    }
    state = 'suspending';
    logger.info(`⏸️ Suspending runtime (${stores.size} stores, ${swarms.size} swarms)`);
    transitionPromise = (async () => {
        const swarmSnapshot = Array.from(swarms.entries());
        const storeSnapshot = Array.from(stores.entries());
        await runPhase(storeSnapshot, stores, async (store) => {
            await store.suspend();
        }, 'suspend-store');
        await runPhase(swarmSnapshot, swarms, async (swarm) => {
            if (!swarm.suspended)
                await swarm.suspend();
        }, 'suspend-swarm');
    })()
        .then(() => {
        state = 'suspended';
        logger.info('⏸️ Runtime suspended');
    })
        .catch((error) => {
        // Partial failure: commit to target so recovery resume() can repair
        // instead of leaving state as "suspending" which blocks all future calls.
        state = 'suspended';
        logger.error('⏸️ Runtime suspend partially failed, state committed for recovery');
        throw error;
    })
        .finally(() => {
        transitionPromise = null;
    });
    return transitionPromise;
}
export async function resumeRuntime() {
    if (state === 'active')
        return;
    if (state === 'resuming' && transitionPromise)
        return transitionPromise;
    if (state === 'suspending' && transitionPromise) {
        await transitionPromise;
        return resumeRuntime();
    }
    state = 'resuming';
    logger.info(`▶️ Resuming runtime (${swarms.size} swarms, ${stores.size} stores)`);
    transitionPromise = (async () => {
        const swarmSnapshot = Array.from(swarms.entries());
        const storeSnapshot = Array.from(stores.entries());
        await runPhase(swarmSnapshot, swarms, async (swarm) => {
            await swarm.resume();
        }, 'resume-swarm');
        await runPhase(storeSnapshot, stores, async (store) => {
            await store.resume();
        }, 'resume-store');
    })()
        .then(() => {
        state = 'active';
        logger.info('▶️ Runtime resumed');
        notifyResume();
    })
        .catch((error) => {
        state = 'suspended';
        logger.error('▶️ Runtime resume partially failed, staying suspended for retry');
        throw error;
    })
        .finally(() => {
        transitionPromise = null;
    });
    return transitionPromise;
}
