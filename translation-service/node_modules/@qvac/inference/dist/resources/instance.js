import { createSystemResourceCollector } from './collector.js';
let resourceCollector;
export function initializeResourceCollector(dependencies) {
    if (!resourceCollector) {
        resourceCollector = createSystemResourceCollector(dependencies);
    }
    return resourceCollector;
}
export function getResourceCollector() {
    return resourceCollector;
}
export function destroyResourceCollector() {
    resourceCollector?.destroy();
    resourceCollector = undefined;
}
