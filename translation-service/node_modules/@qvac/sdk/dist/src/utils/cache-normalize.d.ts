/**
 * Canonicalize assistant message text for the auto-cache key.
 *
 * The server saves raw stream text (with think tags when `captureThinking` is
 * on), while `final.contentText` only aggregates `contentDelta` events.
 * Stripping think blocks (paired and unclosed-trailing) and trimming lets
 * callers push back either shape and still hit the cache.
 */
export declare function normalizeAssistantCacheContent(content: string): string;
//# sourceMappingURL=cache-normalize.d.ts.map