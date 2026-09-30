/**
 * Pure-JS helpers for preparing VLA inference inputs.
 *
 * Mirrors `preprocessImage` / `padState` / `DEFAULT_IMAGE_SIZE` from
 * `@qvac/vla-ggml/addon.js`. Kept inlined (not re-exported from the addon)
 * so preparing inputs never loads the addon's native binding.
 *
 * This file is a verbatim port of the addon's JS implementation; keep them
 * in sync so the produced tensors stay byte-identical regardless of where
 * preprocessing runs (in-process vs addon).
 */
/** Default vision tower image size used by SmolVLA-LIBERO. */
export declare const VLA_DEFAULT_IMAGE_SIZE = 512;
type PixelsInput = Float32Array | Uint8Array | number[];
type ImageLayout = 'hwc' | 'chw';
export interface VlaPreprocessImageOptions {
    size?: number;
    layout?: ImageLayout;
    /**
     * Skip the [0,255] vs [0,1] auto-detection heuristic when the caller knows
     * the range. `1` = pixels already in [0,1] (no rescale). `1/255` = pixels
     * in [0,255] (rescale to [0,1]). Any other value (including the literal
     * `'auto'`) falls back to the heuristic.
     */
    scale?: number | 'auto';
}
/**
 * Resize + letterbox + normalize a camera frame to `(3, size, size)` Float32
 * in `[-1, 1]`. Drop-in equivalent of `@qvac/vla-ggml`'s `preprocessImage`.
 *
 * Letterbox places the resized content at the **bottom-right** with padding
 * at top/left (`padLeft = size - newW`, `padTop = size - newH`), matching
 * the reference smolvla.cpp behavior.
 */
export declare function vlaPreprocessImage(pixels: PixelsInput, width: number, height: number, opts?: VlaPreprocessImageOptions): Float32Array;
/**
 * Zero-pad a state vector to `targetDim`. Extra entries are zero-initialised;
 * input longer than `targetDim` raises. Mirrors how smolvla.cpp expects the
 * state tensor (`max_state_dim` = 32 by default).
 */
export declare function vlaPadState(state: ArrayLike<number>, targetDim?: number): Float32Array;
export {};
