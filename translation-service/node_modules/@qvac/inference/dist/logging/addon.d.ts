import type { Logger } from './types.js';
export declare function registerAddonLogger(modelId: string, namespace: string, logger: Logger): void;
export declare function unregisterAddonLogger(modelId: string): void;
export declare function createAddonLoggerCallback(namespace: string): (priority: number, message: string) => void;
export declare function clearAllAddonLoggers(): void;
