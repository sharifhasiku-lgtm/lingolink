/**
 * Sanitize a path component that will be joined to a base directory.
 * Strips traversal sequences, absolute prefixes, and normalizes separators.
 *
 * Throws on null bytes (literal or URL-encoded).
 */
export declare function sanitizePathComponent(component: string): string;
