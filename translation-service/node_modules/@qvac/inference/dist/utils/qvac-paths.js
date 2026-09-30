import path from 'bare-path';
import { getEnv } from '../runtime/env.js';
export function getQvacPath(...subPaths) {
    return path.join(getEnv().HOME_DIR, '.qvac', ...subPaths);
}
