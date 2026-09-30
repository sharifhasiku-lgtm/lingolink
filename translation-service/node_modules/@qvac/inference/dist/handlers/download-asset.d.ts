import type { DownloadAssetRequest, DownloadAssetResponse, ModelProgressUpdate } from '../schemas/index.js';
export declare function handleDownloadAsset(request: DownloadAssetRequest, progressCallback?: (update: ModelProgressUpdate) => void): Promise<DownloadAssetResponse>;
