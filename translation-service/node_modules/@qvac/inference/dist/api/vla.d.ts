import { type VlaClientRunParams, type VlaClientRunResult, type VlaEmbodimentSelection, type VlaHparams } from '../schemas/index.js';
/**
 * Run VLA inference on a loaded model (SmolVLA or π₀.₅) and return the
 * produced action chunk plus per-stage timings.
 *
 * @param params - Inference inputs.
 * @param params.modelId - Identifier of the loaded VLA model (returned by
 *   `loadModel({ modelType: "vla", ... })`).
 * @param params.images - The preprocessed camera frames; each is a
 *   `Float32Array` of length `3 * imgWidth * imgHeight` in CHW layout, range
 *   `[-1, 1]`. Pass exactly `hparams.numCameras` frames (2 for SmolVLA, 3
 *   for π₀.₅). Use the addon's `preprocessImage()` (re-exported as
 *   `vlaPreprocessImage`) to produce them.
 * @param params.imgWidth - Width of each preprocessed image; must equal
 *   `hparams.visionImageSize`.
 * @param params.imgHeight - Height of each preprocessed image; must equal
 *   `hparams.visionImageSize`.
 * @param params.state - Robot end-effector / gripper state. For
 *   continuous-state models (SmolVLA) pad to `hparams.maxStateDim` with
 *   `vlaPadState`. For discrete-state models (π₀.₅,
 *   `hparams.stateInputMode === 'discrete'`) the state is tokenised into the
 *   prompt and this buffer is ignored — pass an empty `Float32Array(0)`.
 * @param params.tokens - Tokenized instruction (`Int32Array` of length
 *   `hparams.tokenizerMaxLength`). Tokenize on the consumer side with the
 *   model's tokenizer (SmolVLM2 for SmolVLA, PaliGemma/Gemma for π₀.₅).
 * @param params.mask - Token attention mask (`Uint8Array` matching `tokens`).
 * @param params.noise - Optional seeded noise prior
 *   (`Float32Array` of length `hparams.chunkSize * hparams.maxActionDim`).
 *   When omitted the addon samples its own prior.
 * @returns A `VlaClientRunResult` with the produced `actions` Float32Array
 *   (length `chunkSize * actionDim`), the corresponding `chunkSize` /
 *   `actionDim` returned by the addon, and optional per-stage `stats`.
 *
 * @example
 * ```typescript
 * import { loadModel, vla, vlaPreprocessImage, vlaPadState, vlaHparams } from "@qvac/inference";
 *
 * const modelId = await loadModel({ modelSrc: "/path/to/smolvla.gguf", modelType: "vla" });
 * const { hparams } = await vlaHparams({ modelId });
 * const size = hparams.visionImageSize;
 * const front = vlaPreprocessImage(frontPixels, frontW, frontH, { size });
 * const wrist = vlaPreprocessImage(wristPixels, wristW, wristH, { size });
 * const state = vlaPadState(robotState, hparams.maxStateDim);
 * const tokens = new Int32Array(hparams.tokenizerMaxLength);
 * const mask = new Uint8Array(hparams.tokenizerMaxLength);
 * // ...tokenize the instruction into tokens/mask...
 * const { actions } = await vla({
 *   modelId, images: [front, wrist], imgWidth: size, imgHeight: size,
 *   state, tokens, mask,
 * });
 * ```
 */
export declare function vla(params: VlaClientRunParams): Promise<VlaClientRunResult>;
/**
 * Fetch the loaded VLA model's hyperparameters and the active ggml backend
 * name. Useful to size token / state / noise buffers before calling `vla()`.
 *
 * @param params - Identifier of the loaded VLA model.
 * @returns The model's hparams and the human-readable backend name
 *   (`"CPU"` / `"Vulkan"` / `"Metal"` / `"OpenCL"` / `null` if the addon
 *   has not surfaced one).
 */
export declare function vlaHparams(params: {
    modelId: string;
}): Promise<{
    hparams: VlaHparams;
    backendName: string | null;
}>;
/**
 * Switch a loaded multi-embodiment GR00T model to another embodiment shipped
 * in the same GGUF — no reload, only that embodiment's weight rows are re-read.
 *
 * The returned hparams follow the newly active embodiment: re-read
 * `numCameras` (and re-size buffers if needed) before the next `vla()` call.
 * `selectedEmbodimentTag` / `selectedEmbodimentCatId` report what was
 * resolved. Selecting by `catId` reports that id's canonical tag, which may
 * differ from the alias used to select — the id is the stable identity.
 *
 * Rejects (leaving the current embodiment active) for a non-GR00T or
 * single-embodiment model, an unknown tag or `cat_id`, one not stored in the
 * GGUF, an embodiment with no known camera count and no `numCameras`
 * override, or while an inference response is still pending — await the
 * in-flight `vla()` call first.
 *
 * @param params.modelId - Identifier of the loaded VLA model.
 * @param params.embodiment - The embodiment to activate: a tag string, a
 *   numeric `cat_id` (0..31), or `{ tag | catId, numCameras }` where
 *   `numCameras` overrides the camera count stored in the GGUF.
 * @returns The refreshed model hparams after the switch.
 *
 * @example
 * ```typescript
 * import { loadModel, vlaSetEmbodiment, vlaHparams } from "@qvac/inference";
 *
 * const modelId = await loadModel({
 *   modelSrc: "/path/to/groot-multi.gguf",
 *   modelType: "vla",
 *   modelConfig: { embodiment: "libero_sim" }, // initial selection at load
 * });
 * const { hparams } = await vlaSetEmbodiment({ modelId, embodiment: "real_droid" });
 * console.log(hparams.selectedEmbodimentTag, hparams.numCameras);
 * ```
 */
export declare function vlaSetEmbodiment(params: {
    modelId: string;
    embodiment: VlaEmbodimentSelection;
}): Promise<{
    hparams: VlaHparams;
}>;
