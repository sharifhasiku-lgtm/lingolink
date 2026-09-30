import type { DownloadHooks } from './types.js';
export declare function isHuggingFaceUrl(url: string): boolean;
/**
 * Whether an HTTP download's transport must be secure (plaintext / HTTPS→HTTP
 * downgrades refused, loopback exempt). Hugging Face is always enforced so a
 * downgrade can't sidestep its Hub SHA-256 attestation; `requireSecureTransport`
 * extends the same enforcement to every HTTP source.
 */
export declare function shouldEnforceSecureTransport(url: string, requireSecureTransport: boolean): boolean;
/**
 * Enforce the download integrity policy for a freshly downloaded HTTP file.
 *
 * A Hugging Face download carries the Hub's SHA-256 (captured from the resolve
 * hop), so it is always verified and a mismatch fails. When no trusted checksum
 * is available, the behavior depends on `requireChecksum`: a source that should
 * be verifiable (Hugging Face without a usable hash) is rejected under the flag;
 * a source with no checksum source at all (non-Hugging-Face) always downloads,
 * with a warning that it was unverified.
 */
export declare function verifyHttpModelFile(url: string, filePath: string, hubSha256: string | undefined, requireChecksum: boolean, hooks?: DownloadHooks): Promise<void>;
