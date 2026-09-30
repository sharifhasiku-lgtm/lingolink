/**
 * Generate a short hash (16 characters) from any input string
 */
export declare function generateShortHash(input: string): string;
/**
 * Create a stable, deterministic string representation of a config object.
 * - Recursively sorts all object keys
 * - Normalizes ModelDescriptor objects to their src string
 */
export declare function canonicalConfigString(config: Record<string, unknown> | undefined): string;
/**
 * Calculate progress percentage with bounds checking and consistent formatting
 * @param current - Current progress value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage clamped between 0-100 with fixed decimal places
 */
export declare function calculatePercentage(current: number, total: number, decimals?: number): number;
