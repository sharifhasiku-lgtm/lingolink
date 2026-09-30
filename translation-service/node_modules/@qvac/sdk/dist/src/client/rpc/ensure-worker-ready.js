import { getAllPlugins } from '../../server/plugins/index.js';
import { PearWorkerEntryRequiredError, WorkerPluginsNotRegisteredError } from '../../utils/errors-client.js';
const PEAR_WORKER_ENTRY_PATH = 'qvac/worker.pear.entry.mjs';
/**
 * Throw if no plugins are registered before an SDK call. On Pear,
 * point at the generated worker entry; otherwise raise a generic
 * registration error. `isPear` is overridable for tests.
 */
export async function ensurePluginsRegistered(opts) {
    if (getAllPlugins().length > 0)
        return;
    const isPear = opts?.isPear ?? (await import('which-runtime')).isPear;
    if (isPear) {
        throw new PearWorkerEntryRequiredError(PEAR_WORKER_ENTRY_PATH);
    }
    throw new WorkerPluginsNotRegisteredError();
}
