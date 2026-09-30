export declare function getWorkspaceKey(workspace?: string): string;
/**
 * Returns the `requestId` of any in-flight RAG operation on the workspace
 * (or `undefined` if none). The dispatcher uses this to decide whether to
 * pre-empt before calling `registry.begin(...)`.
 */
export declare function getActiveRagRequest(workspace?: string): string | undefined;
/**
 * Records the `requestId` of a freshly-begun RAG operation. Called by the
 * dispatcher in `rag.ts` after `registry.begin(...)` succeeds; paired with
 * `clearActiveRagRequest` via the request scope's deferred cleanup so the
 * map never outlives the request.
 */
export declare function setActiveRagRequest(workspace: string | undefined, requestId: string): void;
/**
 * Clears the workspace's mapping iff it still belongs to `requestId`. The
 * conditional guard handles the natural race between two ingest calls on
 * the same workspace: the older context's scope unwind must not stomp the
 * newer context's mapping installed by the pre-emption sequence.
 */
export declare function clearActiveRagRequest(workspace: string | undefined, requestId: string): void;
/**
 * Shutdown / workspace-close sweep. Cancels every tracked RAG request via
 * the registry and clears the workspace map. Idempotent — callers that
 * re-invoke during a teardown (workspace-close fired twice, shutdown
 * racing with `close-all`) get a no-op on the second pass.
 */
export declare function cancelAllRagOperations(): void;
