import type { AbortSignal } from 'bare-abort-controller';
export declare function isArchiveUrl(url: string): boolean;
export declare function extractTarStream(archivePath: string, extractDir: string, useGunzip: boolean, signal?: AbortSignal): Promise<void>;
export declare function extractAndValidateShardedArchive(archivePath: string, extractDir: string, signal?: AbortSignal): Promise<string>;
