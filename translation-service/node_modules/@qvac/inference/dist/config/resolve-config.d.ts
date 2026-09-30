import { type QvacConfig } from './config-utils.js';
/**
 * Resolution order for Bare:
 * 1. QVAC_CONFIG_PATH environment variable
 * 2. Config file in project root (qvac.config.js, qvac.config.json)
 * 3. built-in defaults
 */
export declare function resolveConfig(): Promise<QvacConfig | undefined>;
