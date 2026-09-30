import type { ZodSchema } from 'zod';
import { type CanonicalModelType, type DevicePattern, type DeviceMatch, type RuntimeContext } from '../schemas/index.js';
export declare const CANONICAL_TO_ALIAS: Record<CanonicalModelType, string>;
export declare const MODEL_CONFIG_SCHEMAS: Partial<Record<CanonicalModelType, ZodSchema>>;
export declare const BUILTIN_DEVICE_PATTERNS: DevicePattern[];
export declare function matchesPattern(ctx: RuntimeContext, match: DeviceMatch): boolean;
export declare function findAllMatchingPatterns(ctx: RuntimeContext, patterns: DevicePattern[]): DevicePattern[];
export declare function getDefaultsFromPattern(modelType: CanonicalModelType, pattern: DevicePattern): Record<string, unknown> | undefined;
export type ConfigResolutionLog = {
    appliedPatterns: string[];
    mergedDefaults: Record<string, unknown>;
    finalConfig: Record<string, unknown>;
};
export declare function resolveModelConfigWithContext<T>(modelType: CanonicalModelType, userInput: Record<string, unknown>, ctx: RuntimeContext, userPatterns: DevicePattern[], builtinPatterns?: DevicePattern[], onLog?: (log: ConfigResolutionLog) => void): T;
