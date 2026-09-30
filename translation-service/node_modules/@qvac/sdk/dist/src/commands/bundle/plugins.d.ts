import type { Logger } from '../../logging/types.js';
import type { QvacConfig } from '@qvac/inference/surface';
export declare function buildBuiltinSpecifier(sdkName: string, suffix: string): string;
export declare function parseBuiltinSpecifier(specifier: string, sdkName: string): {
    suffix: string;
    exportName: string;
} | null;
export declare function resolvePluginSpecifiers(config: QvacConfig, sdkName: string, logger: Logger): string[];
//# sourceMappingURL=plugins.d.ts.map