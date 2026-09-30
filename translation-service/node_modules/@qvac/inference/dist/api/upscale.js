import { upscaleStreamResponseSchema } from '../schemas/sdcpp-config.js';
import { stream as streamRpc } from '../dispatch.js';
import { decodeBase64, encodeBase64 } from '../utils/encoding.js';
import { StreamEndedError } from '../errors/index.js';
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
export function upscale(params) {
    const request = {
        modelId: params.modelId,
        image: encodeBase64(params.image),
        ...(params.repeats !== undefined && { repeats: params.repeats }),
        type: 'upscaleStream'
    };
    let statsResolver = () => { };
    let statsRejecter = () => { };
    const statsPromise = new Promise((resolve, reject) => {
        statsResolver = resolve;
        statsRejecter = reject;
    });
    statsPromise.catch(() => { });
    let outputsResolver = () => { };
    let outputsRejecter = () => { };
    const outputsPromise = new Promise((resolve, reject) => {
        outputsResolver = resolve;
        outputsRejecter = reject;
    });
    outputsPromise.catch(() => { });
    const collectedBuffers = [];
    async function processResponses() {
        let sawDone = false;
        try {
            for await (const response of streamRpc(request)) {
                if (response &&
                    typeof response === 'object' &&
                    'type' in response &&
                    response.type === 'upscaleStream') {
                    const parsed = upscaleStreamResponseSchema.parse(response);
                    if (parsed.data) {
                        collectedBuffers.push(decodeBase64(parsed.data));
                    }
                    if (parsed.done) {
                        sawDone = true;
                        statsResolver(parsed.stats);
                        outputsResolver(collectedBuffers);
                    }
                }
            }
            if (!sawDone) {
                const error = new StreamEndedError();
                statsRejecter(error);
                outputsRejecter(error);
            }
        }
        catch (error) {
            statsRejecter(error);
            outputsRejecter(error);
        }
    }
    void processResponses();
    return {
        outputs: outputsPromise,
        stats: statsPromise
    };
}
