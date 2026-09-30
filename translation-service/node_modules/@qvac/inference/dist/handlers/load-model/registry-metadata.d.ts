import type { RegistryItem } from '../../models/registry/index.js';
export type ExplicitRegistryMetadata = {
    expectedSize?: number;
    sha256Checksum?: string;
};
export declare function getExplicitRegistryMetadata(modelSrc: unknown): ExplicitRegistryMetadata | undefined;
export declare function resolveRegistryDownloadMetadata(modelMetadata: RegistryItem | undefined, explicitMetadata: ExplicitRegistryMetadata | undefined, expectedChecksum: string | undefined): {
    expectedSize: number;
    checksum: string;
};
