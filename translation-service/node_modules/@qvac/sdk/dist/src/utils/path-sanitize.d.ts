/**
 * Pure string sanitization for path components. No runtime-specific dependencies.
 * Safe to import from both Bare (server) and Bun/Node (tests, client).
 */
/**
 * Sanitize a path component that will be joined to a base directory.
 * Strips traversal sequences, absolute prefixes, and normalizes separators.
 *
 * Throws on null bytes (literal or URL-encoded).
 */
export declare function sanitizePathComponent(component: string): string;
/**
 * Check whether a resolved target path is contained within a base directory.
 * Portable — caller provides the resolve function and separator for their runtime.
 */
export declare function checkPathWithinBase(basePath: string, targetPath: string, resolveFn: (...args: string[]) => string, sep: string): boolean;
//# sourceMappingURL=path-sanitize.d.ts.map