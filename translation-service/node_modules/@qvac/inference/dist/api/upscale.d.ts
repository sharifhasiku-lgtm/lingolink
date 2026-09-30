import { type UpscaleClientParams, type UpscaleStats } from '../schemas/sdcpp-config.js';
interface UpscaleResult {
    outputs: Promise<Uint8Array[]>;
    stats: Promise<UpscaleStats | undefined>;
}
/**
 * Runs standalone ESRGAN upscaling on an arbitrary PNG/JPEG image.
 *
 * The model must have been loaded with `modelType: "diffusion"` and
 * `modelConfig.mode: "upscale"` — calling `upscale()` against a model
 * loaded in default (`mode: "diffusion"`) mode throws
 * `ModelOperationNotSupportedError` upfront.
 *
 * `outputs` always resolves to length 1: `repeats` runs N passes
 * internally and emits a single final image at `source * scale^repeats`
 * dimensions. The `Uint8Array[]` shape reserves headroom for future
 * multi-output variants.
 *
 * @param params - `{ modelId, image, repeats? }`. `image` is raw PNG/JPEG
 *   bytes; they are base64-encoded in the request.
 * @returns `{ outputs, stats }` — `outputs` resolves to a single-element
 *   array containing the final upscaled PNG; `stats` resolves to
 *   addon-side stats (load/upscale ms, final width/height, repeats
 *   actually executed, etc.).
 * @throws {ModelOperationNotSupportedError} If the model was not loaded
 *   with `mode: "upscale"`.
 * @throws {StreamEndedError} If the stream closes without emitting a
 *   terminal `done` chunk.
 *
 * @example
 * ```ts
 * const modelId = await loadModel(REALESRGAN_X4PLUS_ANIME_6B, {
 *   modelType: "diffusion",
 *   modelConfig: { mode: "upscale", upscaler: { tile_size: 128 } },
 * });
 * const pngBytes = fs.readFileSync("input.png");
 * const { outputs, stats } = upscale({ modelId, image: pngBytes, repeats: 2 });
 * const [upscaledPng] = await outputs;
 * fs.writeFileSync("upscaled.png", upscaledPng);
 * console.log(await stats);
 * ```
 */
export declare function upscale(params: UpscaleClientParams): UpscaleResult;
export {};
