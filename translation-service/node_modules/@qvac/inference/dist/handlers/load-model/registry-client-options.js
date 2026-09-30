export const DEFAULT_REGISTRY_STREAM_TIMEOUT_MS = 60_000;
/**
 * Build the options passed to @qvac/registry-client download methods from the
 * current QVAC config. Pure helper (no bare-* imports) so the mapping can be
 * unit-tested without standing up a real registry client.
 */
export function buildRegistryClientOptions(params) {
    const { config, outputFile, onProgress, signal } = params;
    const timeout = config.registryStreamTimeoutMs ?? DEFAULT_REGISTRY_STREAM_TIMEOUT_MS;
    const maxRetries = config.registryDownloadMaxRetries;
    return {
        timeout,
        outputFile,
        ...(maxRetries !== undefined && { maxRetries }),
        ...(onProgress && { onProgress }),
        ...(signal && { signal: signal })
    };
}
