import { registerPlugins } from '../server/plugins/index.js';
import * as hostApi from './api/index.js';
/**
 * Register plugins and return the client host API.
 */
export function plugins(pluginList) {
    registerPlugins(pluginList);
    return hostApi;
}
