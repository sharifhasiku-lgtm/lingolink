/**
 * Mint the `requestId` at call time so it can be surfaced synchronously on the
 * returned handle (e.g. the `CompletionRun`) for use with `cancel({ requestId })`.
 * The decorated promise's `op.requestId` and the request registry entry's
 * `requestId` must be the same value, so it is generated exactly once here.
 *
 * Prefers `crypto.randomUUID` and falls back to 128 random bits as hex when it
 * is unavailable — the fallback keeps `requestId` semantics (unique, opaque)
 * without guaranteeing the UUIDv4 format.
 */
export declare function generateRequestId(): string;
/**
 * Fill in a missing `requestId` from the runtime's UUID generator. The request
 * schema marks `requestId` optional; this supplies a v4 UUID when the caller
 * did not provide one.
 */
export declare function generateRandomRequestId(): string;
