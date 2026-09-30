import type { LogLevel } from '@qvac/logging';
import type { Request } from '@qvac/inference/surface';
export declare function isLevelEnabled(messageLevel: LogLevel, currentLevel: LogLevel): boolean;
export declare function formatArg(arg: unknown): string;
export declare function summarizeRequest(request: Request): Record<string, unknown>;
//# sourceMappingURL=utils.d.ts.map