import type { ModelProgressUpdate } from '../../schemas/index.js';
import type { DownloadStats, DownloadResult, DownloadHooks, DownloadSecurityOptions, ResolveResult } from './types.js';
import type { ExplicitRegistryMetadata } from './registry-metadata.js';
export declare function downloadModelFromHttpWithStats(url: string, progressCallback?: (progress: ModelProgressUpdate) => void, downloadHooks?: DownloadHooks, security?: DownloadSecurityOptions): Promise<DownloadResult>;
export declare function downloadModelFromRegistryWithStats(registryPath: string, registrySource: string, progressCallback?: (progress: ModelProgressUpdate) => void, expectedChecksum?: string, downloadHooks?: DownloadHooks, explicitMetadata?: ExplicitRegistryMetadata): Promise<DownloadResult>;
export declare function downloadModelFromHyperdriveWithStats(hyperdriveKey: string, modelFileName: string, seed?: boolean, progressCallback?: (progress: ModelProgressUpdate) => void, downloadHooks?: DownloadHooks): Promise<DownloadResult>;
export declare function mergeDownloadStats(results: ResolveResult[]): DownloadStats | undefined;
