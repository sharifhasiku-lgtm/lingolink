import type { QvacConfig, RuntimeContext } from '@qvac/inference/surface';
type ResolveConfigFn = () => Promise<QvacConfig | undefined>;
interface RPCClient {
    request(command: number): any;
}
/**
 * Initializes SDK configuration and runtime context.
 * Config is loaded once and becomes immutable on the worker side.
 *
 * @param rpc - The RPC client instance
 * @param resolveConfig - Runtime-specific config resolver function
 * @param runtimeContext - Optional runtime context (platform, device info)
 */
export declare function initializeConfig(rpc: RPCClient, resolveConfig: ResolveConfigFn, runtimeContext?: RuntimeContext): Promise<void>;
/**
 * Legacy function for backward compatibility
 * @deprecated Use initializeConfig instead
 */
export declare function replayConfigIfCached(): void;
export {};
//# sourceMappingURL=init-hooks.d.ts.map