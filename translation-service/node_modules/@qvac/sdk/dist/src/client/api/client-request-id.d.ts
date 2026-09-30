/**
 * UUIDv4 generator for client-side request ids. The Web Crypto API
 * ships `crypto.randomUUID` everywhere we run today (Bun, modern Node,
 * modern browsers, React Native via the polyfill that the workbench-
 * desktop / RN runtime config injects). The fallback exists so the SDK
 * never crashes in an exotic JS environment without
 * `crypto.randomUUID` — `requestId` semantics still hold (uniqueness,
 * opaque to the caller), just without the UUIDv4 wire shape.
 *
 * Shared with the long-running call sites that decorate their promises
 * with `requestId`: `completion(...)`, `loadModel(...)`,
 * `downloadAsset(...)`. The decorated promise's `op.requestId` and the
 * server's registry entry's `requestId` must match — generating once
 * here keeps that invariant.
 */
export declare function generateClientRequestId(): string;
//# sourceMappingURL=client-request-id.d.ts.map