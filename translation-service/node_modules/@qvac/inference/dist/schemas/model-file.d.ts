import { z } from 'zod';
export declare const SUPPORTED_ARCHIVE_EXTENSIONS: readonly [".tar", ".tar.gz", ".tgz"];
export declare const archiveTypeSchema: z.ZodEnum<{
    tar: "tar";
    "tar.gz": "tar.gz";
}>;
export declare const filenameToArchiveTypeSchema: z.ZodPipe<z.ZodString, z.ZodTransform<"tar" | "tar.gz" | null, string>>;
export type ArchiveType = z.infer<typeof archiveTypeSchema>;
export declare const shardFileMetadataSchema: z.ZodObject<{
    filename: z.ZodString;
    expectedSize: z.ZodNumber;
    sha256Checksum: z.ZodString;
}, z.core.$strip>;
export declare const shardUrlSchema: z.ZodObject<{
    url: z.ZodURL;
    filename: z.ZodString;
}, z.core.$strip>;
export declare const shardPatternInfoSchema: z.ZodObject<{
    isSharded: z.ZodBoolean;
    currentShard: z.ZodOptional<z.ZodNumber>;
    totalShards: z.ZodOptional<z.ZodNumber>;
    baseFilename: z.ZodOptional<z.ZodString>;
    extension: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ShardFileMetadata = z.infer<typeof shardFileMetadataSchema>;
export type ShardUrl = z.infer<typeof shardUrlSchema>;
export type ShardPatternInfo = z.infer<typeof shardPatternInfoSchema>;
