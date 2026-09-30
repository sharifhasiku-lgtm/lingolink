/**
 * Extract tensor names from all GGUF shards and write to {baseFilename}.tensors.txt
 * Required for sharded models to enable incremental/async loading
 * @throws ModelLoadFailedError if any shard fails extraction
 */
export declare function extractAndWriteTensorsFile(shardDir: string, shardFilenames: string[], baseFilename: string): Promise<string>;
/**
 * Check if a file has a valid GGUF header structure.
 * Returns true if the header parses successfully and contains tensor metadata.
 *
 * NOTE: This only validates the header structure, NOT that tensor data exists.
 * A file can have a valid header but be incomplete.
 */
export declare function hasValidGGUFHeader(filePath: string): Promise<boolean>;
