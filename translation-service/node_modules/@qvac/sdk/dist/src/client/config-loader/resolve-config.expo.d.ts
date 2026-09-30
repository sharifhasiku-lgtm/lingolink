import { type QvacConfig } from './config-utils.js';
/**
 * Resolution order for Expo:
 * 1. QVAC_CONFIG_PATH environment variable (if set)
 * 2. Default Expo path: ${Paths.document.uri}qvac.config.json
 * 3. SDK defaults
 *
 * Note: Only JSON config files are supported in React Native
 */
export declare function resolveConfig(): Promise<QvacConfig | undefined>;
//# sourceMappingURL=resolve-config.expo.d.ts.map