import type { DeleteCacheRequest, DeleteCacheResponse } from '../schemas/index.js';
/**
 * RPC handler for `deleteCache(...)`. The three KV-cache bookkeeping
 * layers (on-disk `.bin`, `initializedCaches`, `cachedMessageCounts`)
 * are private to `kv-cache-session.ts`; this handler delegates to that
 * module's single administrative entry point (`deleteKvCacheState`).
 * The handler must have **zero** direct references to
 * `fsPromises.unlink`, the `initializedCaches` set, or the
 * `cachedMessageCounts` map.
 */
export declare function handleDeleteCache(request: DeleteCacheRequest): Promise<DeleteCacheResponse>;
