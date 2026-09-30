import { z } from 'zod';
// ============== Archive types ==============
export const SUPPORTED_ARCHIVE_EXTENSIONS = ['.tar', '.tar.gz', '.tgz'];
export const archiveTypeSchema = z.enum(['tar', 'tar.gz']);
export const filenameToArchiveTypeSchema = z.string().transform((filename) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz'))
        return 'tar.gz';
    if (lower.endsWith('.tar'))
        return 'tar';
    return null;
});
// ============== Shard metadata ==============
export const shardFileMetadataSchema = z.object({
    filename: z.string(),
    expectedSize: z.number(),
    sha256Checksum: z.string()
});
export const shardUrlSchema = z.object({
    url: z.url(),
    filename: z.string()
});
export const shardPatternInfoSchema = z.object({
    isSharded: z.boolean(),
    currentShard: z.number().optional(),
    totalShards: z.number().optional(),
    baseFilename: z.string().optional(),
    extension: z.string().optional()
});
