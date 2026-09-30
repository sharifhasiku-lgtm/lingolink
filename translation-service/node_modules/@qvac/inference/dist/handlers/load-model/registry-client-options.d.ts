import type { AbortSignal } from 'bare-abort-controller';
import type { QvacConfig } from '../../schemas/index.js';
export declare const DEFAULT_REGISTRY_STREAM_TIMEOUT_MS = 60000;
export interface RegistryClientDownloadOptions {
    timeout: number;
    outputFile: string;
    maxRetries?: number;
    onProgress?: (progress: {
        downloaded: number;
        total: number;
    }) => void;
    signal?: AbortSignal;
}
/**
 * Build the options passed to @qvac/registry-client download methods from the
 * current QVAC config. Pure helper (no bare-* imports) so the mapping can be
 * unit-tested without standing up a real registry client.
 */
export declare function buildRegistryClientOptions(params: {
    config: Pick<QvacConfig, 'registryStreamTimeoutMs' | 'registryDownloadMaxRetries'>;
    outputFile: string;
    onProgress?: ((progress: {
        downloaded: number;
        total: number;
    }) => void) | undefined;
    signal?: AbortSignal | undefined;
}): RegistryClientDownloadOptions;
