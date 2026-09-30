import { z } from 'zod';
/**
 * Zod refinement for path components that get joined to a base directory.
 * Rejects strings containing traversal sequences (.., null bytes).
 *
 * DO NOT apply to fields that accept absolute user paths (e.g. audio, image,
 * model, or attachment paths).
 */
export declare const safePathComponent: z.ZodString;
