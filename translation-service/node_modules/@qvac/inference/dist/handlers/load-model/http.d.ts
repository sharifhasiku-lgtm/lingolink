import type { ModelProgressUpdate } from '../../schemas/index.js';
import type { DownloadHooks, DownloadSecurityOptions } from './types.js';
/**
 * A mid-stream socket/body error, a connection failure (HTTP status 0, no
 * response), or our own resume-triggered abort is recoverable by resuming from
 * the partial. A real HTTP status (4xx/5xx) or a missing/unreadable body is not.
 *
 * `DownloadCancelledError` is intentionally NOT excluded here: this is only
 * reached after the caller's consumer-cancel gate, so a cancellation at this
 * point is our per-attempt abort (resume interrupt), which must be retried.
 */
export declare function isResumableTransferError(error: unknown): boolean;
export declare function downloadModelFromHttp(url: string, progressCallback?: (progress: ModelProgressUpdate) => void, hooks?: DownloadHooks, security?: DownloadSecurityOptions): Promise<string>;
