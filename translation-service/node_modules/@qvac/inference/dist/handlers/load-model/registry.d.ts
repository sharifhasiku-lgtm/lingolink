import type { ModelProgressUpdate } from '../../schemas/index.js';
import type { DownloadHooks } from './types.js';
import { type ExplicitRegistryMetadata } from './registry-metadata.js';
export declare function downloadModelFromRegistry(registryPath: string, registrySource: string, progressCallback?: (progress: ModelProgressUpdate) => void, expectedChecksum?: string, hooks?: DownloadHooks, explicitMetadata?: ExplicitRegistryMetadata): Promise<string>;
