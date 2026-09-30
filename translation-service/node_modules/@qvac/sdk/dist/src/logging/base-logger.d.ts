import { type LogLevel } from '@qvac/logging';
import type { Logger, LoggerOptions } from './types.js';
export interface LoggerExtensions {
    onLog?: (level: LogLevel, namespace: string, message: string) => void;
}
export declare function createBaseLogger(namespace: string, options?: LoggerOptions, extensions?: LoggerExtensions): Logger;
//# sourceMappingURL=base-logger.d.ts.map