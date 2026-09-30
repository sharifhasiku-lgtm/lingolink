/**
 * Decodes a base64 string to a Uint8Array.
 *
 * Uses atob which is available across all runtimes (Node, Bare, React Native).
 * Buffer is not globally available in React Native (Hermes engine), so this
 * provides a cross-platform alternative to Buffer.from(str, "base64").
 */
export declare function decodeBase64(base64: string): Uint8Array;
/**
 * Encodes a Uint8Array to a base64 string.
 *
 * Uses btoa which is available across all runtimes (Node, Bare, React Native).
 * Buffer is not globally available in React Native (Hermes engine), so this
 * provides a cross-platform alternative to Buffer.from(bytes).toString("base64").
 */
export declare function encodeBase64(bytes: Uint8Array): string;
//# sourceMappingURL=encoding.d.ts.map