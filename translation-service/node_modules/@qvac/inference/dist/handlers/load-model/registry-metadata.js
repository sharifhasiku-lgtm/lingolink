import { modelDescriptorSchema } from '../../schemas/index.js';
export function getExplicitRegistryMetadata(modelSrc) {
    const parsed = modelDescriptorSchema.safeParse(modelSrc);
    if (!parsed.success || !parsed.data.src.startsWith('registry://')) {
        return undefined;
    }
    const metadata = {};
    if (typeof parsed.data.expectedSize === 'number') {
        metadata.expectedSize = parsed.data.expectedSize;
    }
    if (typeof parsed.data.sha256Checksum === 'string') {
        metadata.sha256Checksum = parsed.data.sha256Checksum;
    }
    return metadata.expectedSize !== undefined || metadata.sha256Checksum !== undefined
        ? metadata
        : undefined;
}
export function resolveRegistryDownloadMetadata(modelMetadata, explicitMetadata, expectedChecksum) {
    return {
        expectedSize: modelMetadata?.expectedSize ?? explicitMetadata?.expectedSize ?? 0,
        checksum: modelMetadata?.sha256Checksum ?? expectedChecksum ?? explicitMetadata?.sha256Checksum ?? ''
    };
}
