import type { ResourceCollectorDependencies, SystemResourceCollector } from './types.js';
export declare function initializeResourceCollector(dependencies: ResourceCollectorDependencies): SystemResourceCollector;
export declare function getResourceCollector(): SystemResourceCollector | undefined;
export declare function destroyResourceCollector(): void;
