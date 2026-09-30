import { WorkerStartupError } from '../../utils/errors-client.js';
export interface WorkerExit {
    code: number | null;
    signal: string | null;
}
/**
 * Always returns a cause. A worker that is still running and has written
 * nothing carries no diagnostic text, but `workerExited: false` is what tells a
 * caller that waiting longer could still help.
 */
export declare function createRPCInitTimeoutCause(stderrTail: string, workerExit: WorkerExit | null): WorkerStartupError;
//# sourceMappingURL=worker-startup-error.d.ts.map