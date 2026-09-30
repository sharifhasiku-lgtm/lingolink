import { type DownloadAssetOptions as BaseDownloadAssetOptions, type RPCOptions } from '../schemas/index.js';
export type DownloadAssetOptions = BaseDownloadAssetOptions;
/**
 * Downloads an asset (model file) without loading it into memory.
 *
 * This function is specifically designed for download-only operations and
 * doesn't accept runtime configuration options like modelConfig.
 * Use this for download-only operations instead of loadModel for better semantic clarity.
 *
 * @param options - Download configuration including:
 *   - assetSrc: The location from which the asset is downloaded (local path, remote URL, or Hyperdrive URL)
 *   - seed: Optional boolean for hyperdrive seeding
 *   - onProgress: Optional callback for download progress
 * @param rpcOptions - Optional RPC options including per-call profiling configuration
 *
 * @returns Promise that resolves to the asset ID (either the provided assetSrc or a generated ID),
 *   decorated with a synchronous `requestId` field for use with
 *   `cancel({ requestId: op.requestId })` before the promise resolves.
 *
 * @throws {QvacErrorBase} When asset download fails, with details in the error message
 * @throws {QvacErrorBase} When streaming ends unexpectedly (only when using onProgress)
 * @throws {QvacErrorBase} When receiving an invalid response type from the engine
 *
 * @example
 * ```typescript
 * // Download model without loading
 * const assetId = await downloadAsset({
 *   assetSrc: "/path/to/model.gguf",
 *   seed: true
 * });
 *
 * // Download with progress tracking
 * const assetId = await downloadAsset({
 *   assetSrc: "pear://key123/model.gguf",
 *   onProgress: (progress) => {
 *     console.log(`Downloaded: ${progress.percentage}%`);
 *   }
 * });
 *
 * // Targeted cancel by requestId — grab the id synchronously, then
 * // cancel before the download resolves.
 * const op = downloadAsset({ assetSrc: "https://example.com/large.gguf" });
 * setTimeout(() => cancel({ requestId: op.requestId }), 1000);
 * await op; // rejects with `InferenceCancelledError`
 * ```
 */
export declare function downloadAsset(options: DownloadAssetOptions, rpcOptions?: RPCOptions): Promise<string> & {
    requestId: string;
};
