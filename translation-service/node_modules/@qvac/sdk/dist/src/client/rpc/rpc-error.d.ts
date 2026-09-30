import type { ErrorResponse } from '@qvac/inference/surface';
export declare class RPCError extends Error {
    readonly timestamp?: string;
    readonly remoteStack?: string;
    readonly code?: number;
    readonly cause?: unknown;
    readonly isQvacError: boolean;
    constructor(errorResponse: ErrorResponse);
    toJSON(): {
        name: string;
        code: number | undefined;
        message: string;
        stack: string | undefined;
        cause: unknown;
        timestamp: string | undefined;
        isQvacError: boolean;
    };
}
/**
 * Rebuild the original server-thrown typed error from its serialised
 * envelope so consumer code can do
 * `if (err instanceof RequestRejectedByPolicyError) { ... }` across
 * the RPC boundary. Unknown error names fall through to the legacy
 * `RPCError` wrapper, which preserves `name`/`code`/`message` for
 * code-based predicates.
 */
export declare function reconstructError(response: ErrorResponse): Error;
//# sourceMappingURL=rpc-error.d.ts.map