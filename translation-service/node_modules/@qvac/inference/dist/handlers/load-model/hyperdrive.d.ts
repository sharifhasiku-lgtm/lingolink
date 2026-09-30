import type { ModelProgressUpdate } from '../../schemas/index.js';
import type { DownloadHooks } from './types.js';
export declare function deleteCorestoreDirectory(corestoreDir: string): Promise<void>;
export declare function downloadModelFromHyperdrive(hyperdriveKey: string, modelFileName: string, seed?: boolean, progressCallback?: (progress: ModelProgressUpdate) => void, hooks?: DownloadHooks, expectedChecksum?: string): Promise<string>;
