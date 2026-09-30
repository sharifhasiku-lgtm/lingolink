import crypto from 'bare-crypto';
import { Buffer } from 'bare-buffer';
/**
 * Generate a short hash (16 characters) from any input string
 */
export function generateShortHash(input) {
    const hash = crypto.createHash('sha-256').update(Buffer.from(input, 'utf8')).digest('hex');
    return hash.substring(0, 16);
}
function isModelDescriptor(value) {
    return (typeof value === 'object' && value !== null && 'src' in value && typeof value.src === 'string');
}
function normalizeValue(value) {
    if (isModelDescriptor(value)) {
        return value.src;
    }
    if (Array.isArray(value)) {
        return value.map(normalizeValue);
    }
    if (typeof value === 'object' && value !== null) {
        return normalizeConfig(value);
    }
    return value;
}
function normalizeConfig(config) {
    const result = {};
    for (const key of Object.keys(config).sort()) {
        result[key] = normalizeValue(config[key]);
    }
    return result;
}
/**
 * Create a stable, deterministic string representation of a config object.
 * - Recursively sorts all object keys
 * - Normalizes ModelDescriptor objects to their src string
 */
export function canonicalConfigString(config) {
    if (!config)
        return '{}';
    return JSON.stringify(normalizeConfig(config));
}
/**
 * Calculate progress percentage with bounds checking and consistent formatting
 * @param current - Current progress value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage clamped between 0-100 with fixed decimal places
 */
export function calculatePercentage(current, total, decimals = 2) {
    if (total <= 0 || current < 0) {
        return 0;
    }
    const rawPercentage = (current / total) * 100;
    const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
    return Number(clampedPercentage.toFixed(decimals));
}
