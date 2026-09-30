/**
 * Declared pixel dimensions of a PNG or JPEG, read from its header.
 *
 * Exists so a caller-supplied image can be size-checked BEFORE anything decodes
 * it. A compressed format's transfer size says nothing about its decoded size —
 * a 1.5 MB PNG of uniform scanlines can declare 40000x40000, which is 1.6
 * gigapixels and several GB in one native allocation. Bounding the encoded bytes
 * does not prevent that; bounding the declared dimensions does.
 *
 * Returns `null` when the dimensions cannot be read. A size guard MUST treat that
 * as a refusal, not as a pass: the sender chooses the format, so failing open on
 * an unreadable header means a bomb only has to arrive as a BMP to skip the
 * check entirely. `worldSceneRequestSchema` documents PNG/JPEG, so refusing
 * anything this cannot size enforces the contract that is already published.
 *
 * `@qvac/diffusion-cpp` ships its own copy of this, and so does the world e2e
 * suite. Deliberately independent of both: the addon's is exported only from
 * `./addon.js`, which is absent from its `exports` map and carries no types, so
 * depending on it would bind the SDK to an addon internal that can change
 * without a semver signal. Keep them in sync only in behaviour, not by import.
 */
export interface ImageDimensions {
    width: number;
    height: number;
}
export declare function readImageDimensions(buf: Uint8Array): ImageDimensions | null;
