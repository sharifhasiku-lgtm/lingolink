import type { Readable } from 'bare-stream';
import type { AbortSignal } from 'bare-abort-controller';
import { type HeaderBag } from '../../utils/url-security.js';
export interface SafeFetchResponse {
    status: number;
    statusText: string;
    headers: HeaderBag;
    /** Terminal response body. Consume or destroy it to free the socket. */
    body: Readable;
    /** URL of the final (non-redirect) response. */
    finalUrl: string;
    redirected: boolean;
    /**
     * SHA-256 captured from a Hugging Face hop's `X-Linked-Etag`, if the chain
     * passed through huggingface.co / hf.co and exposed a SHA-256-shaped hash.
     */
    hubSha256?: string | undefined;
}
export interface SafeFetchOptions {
    method?: 'GET' | 'HEAD';
    headers?: Record<string, string>;
    signal?: AbortSignal;
    /** Per-hop connection timeout. */
    timeoutMs?: number;
    /**
     * Reject plaintext HTTP (non-loopback) and HTTPS→HTTP downgrade hops. Off by
     * default: a bring-your-own HTTP server on any domain, plaintext included, is
     * allowed. Callers turn this on for a strict, verified-only posture.
     */
    enforceSecureTransport?: boolean;
    /**
     * Which hop hosts are trusted to publish the integrity hash we read from
     * `X-Linked-Etag`. Defaults to Hugging Face; overridable for tests.
     */
    captureHashFromHost?: (host: string) => boolean;
}
/**
 * Fetch a model URL, walking redirects ourselves so every hop is checked:
 * plaintext HTTP (non-loopback) and HTTPS→HTTP downgrades are refused before a
 * request is issued to the insecure hop, and the Hugging Face Hub SHA-256 is
 * captured from the pre-redirect resolve response (bare-fetch's auto-follow
 * would discard it). The returned body is the terminal response stream.
 */
export declare function safeFetch(input: string, options?: SafeFetchOptions): Promise<SafeFetchResponse>;
