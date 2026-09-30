import * as hostApi from './api/index.js';
import type { QvacPlugin } from '@qvac/inference/surface';
/**
 * Register plugins and return the client host API.
 */
export declare function plugins(pluginList: readonly QvacPlugin[]): typeof hostApi;
//# sourceMappingURL=plugins-factory.d.ts.map