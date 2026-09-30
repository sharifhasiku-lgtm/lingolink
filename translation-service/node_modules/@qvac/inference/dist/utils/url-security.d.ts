export type HeaderBag = Record<string, string | string[] | number | undefined>;
export declare function isLoopbackHost(host: string): boolean;
export declare function isHuggingFaceHost(host: string): boolean;
/**
 * Whether an HTTP(S) URL may be used for a model download. HTTPS is always
 * allowed; plaintext HTTP only for loopback. Other schemes are out of scope
 * here and return false.
 */
export declare function isSecureDownloadUrl(url: string | URL): boolean;
/**
 * Extract the Hugging Face Hub SHA-256 from a response's headers, if present.
 * The Hub publishes it as `X-Linked-Etag` (and `ETag` for LFS files) — the
 * content SHA-256 for LFS-backed files. A non-LFS file yields a git blob
 * SHA-1 (40 hex) or a CDN etag instead; those are not SHA-256 and return
 * undefined so the caller treats the download as unverifiable.
 */
export declare function extractHubSha256(headers: HeaderBag): string | undefined;
