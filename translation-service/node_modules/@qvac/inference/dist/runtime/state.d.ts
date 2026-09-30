import type { QvacConfig, RuntimeContext, CanonicalModelType } from '../schemas/index.js';
export { CANONICAL_TO_ALIAS, MODEL_CONFIG_SCHEMAS, BUILTIN_DEVICE_PATTERNS, matchesPattern, findAllMatchingPatterns, getDefaultsFromPattern, resolveModelConfigWithContext } from './model-config-utils.js';
/**
 * Sets the QVAC configuration. This can only be called ONCE during initialization.
 * After the first call, the config becomes immutable and any subsequent calls will throw.
 *
 * @param config - The configuration to set
 * @throws {ConfigAlreadySetError} If config has already been set
 * @throws {CacheDirNotAbsoluteError} If cacheDirectory is not an absolute path
 * @throws {CacheDirNotWritableError} If cacheDirectory is not writable
 */
export declare function setConfig(config: QvacConfig): void;
export declare function getConfig(): QvacConfig;
/**
 * Whether config has been set (injected by a host or resolved from disk). A host
 * that pushes config uses this to keep `initializeConfig` from resolving again —
 * a second `setConfig` would throw {@link ConfigAlreadySetError}.
 */
export declare function isConfigSet(): boolean;
export declare function getConfiguredCacheDir(): string;
export declare function setRuntimeContext(ctx: RuntimeContext): void;
export declare function getRuntimeContext(): RuntimeContext;
export declare function isMobile(): boolean;
export declare function isAndroid(): boolean;
export declare function isIOS(): boolean;
export declare function resolveModelConfig<T>(modelType: CanonicalModelType, userInput: Record<string, unknown>): T;
