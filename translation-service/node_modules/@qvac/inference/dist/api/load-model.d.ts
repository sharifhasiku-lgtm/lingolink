import { type LoadModelOptions, type LoadCustomPluginModelOptions, type LoadModelDescriptorParam, type ReloadConfigOptions, type RPCOptions, type ModelDescriptor } from '../schemas/index.js';
/**
 * Loads a model from a descriptor; `modelType` is inferred from `modelSrc`.
 * `modelConfig` narrows per-engine when `modelSrc.engine` is a literal,
 * otherwise falls back to a permissive shape.
 *
 * @overloadLabel "From descriptor"
 * @param options - Descriptor-based load options. `modelSrc` is a
 *   `ModelDescriptor` (e.g. one of the `LLAMA_3_2_1B_INST_Q4_0`-style
 *   constants); `modelType` is inferred from it.
 * @param rpcOptions - Optional RPC options including per-call profiling.
 * @returns Promise that resolves to the loaded model ID.
 * @throws {ModelTypeRequiredError} When `modelType` cannot be inferred from `modelSrc` at runtime.
 * @example
 * ```typescript
 * await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0, modelConfig: { ctx_size: 2048 } });
 * await loadModel({ modelSrc: WHISPER_TINY });
 * ```
 */
export declare function loadModel<S extends ModelDescriptor>(options: LoadModelDescriptorParam<S>, rpcOptions?: RPCOptions): Promise<string> & {
    requestId: string;
};
/**
 * Loads a machine learning model from a local path, remote URL, or Hyperdrive key.
 *
 * This function supports multiple model types: LLM (Large Language Model), Whisper (speech recognition),
 * embeddings, NMT (translation), and TTS. It can handle both local file paths and Hyperdrive URLs (pear://).
 *
 * When `onProgress` is provided, the function uses streaming to provide real-time download progress.
 * Otherwise, it uses a simple request-response pattern for faster execution.
 *
 * @overloadLabel "Load new model"
 * @param options - An object that defines all configuration parameters required for loading the model, including:
 *   - modelSrc: The location from which the model weights are fetched (local path, remote URL, or Hyperdrive URL).
 *     Hugging Face URLs (huggingface.co / hf.co) are verified against the Hub's SHA-256, and their transport is
 *     hardened (plaintext http:// and https://→http:// downgrades rejected, loopback excepted). Other HTTP(S) URLs
 *     are downloaded as-is and unverified (bring-your-own — plaintext on any host is allowed). Set
 *     `requireHttpChecksum` in the config to reject Hugging Face downloads that expose no usable checksum.
 *   - modelType: The canonical type of model ("llamacpp-completion",
 *     "whispercpp-transcription", "llamacpp-embedding", "nmtcpp-translation",
 *     "tts-ggml", ...). May be omitted when `modelSrc` is a registry descriptor
 *     that already carries the engine.
 *   - modelConfig: Model-specific configuration options (companion sources, model parameters, etc.)
 *   - onProgress: Callback for download progress updates
 *   - logger: Logger instance for model operation logs
 * @param rpcOptions - Optional RPC options including per-call profiling configuration
 *
 * @returns Promise that resolves to the model ID (either the provided modelSrc or a generated ID)
 *
 * @throws {QvacErrorBase} When model loading fails, with details in the error message
 * @throws {QvacErrorBase} When streaming ends unexpectedly (only when using onProgress)
 * @throws {QvacErrorBase} When receiving an invalid response type from the engine
 *
 * @example
 * ```typescript
 * // Local file path - absolute path
 * const localModelId = await loadModel({
 *   modelSrc: "/home/user/models/llama-7b.gguf",
 *   modelType: "llamacpp-completion",
 *   modelConfig: { ctx_size: 2048 }
 * });
 *
 * // Local file path - relative path
 * const relativeModelId = await loadModel({
 *   modelSrc: "./models/whisper-base.gguf",
 *   modelType: "whispercpp-transcription"
 * });
 *
 * // Hyperdrive URL with key and path
 * const hyperdriveId = await loadModel({
 *   modelSrc: "pear://<hyperdrive-key>/llama-7b.gguf",
 *   modelType: "llamacpp-completion",
 *   modelConfig: { ctx_size: 2048 }
 * });
 *
 * // Remote HTTP/HTTPS URL with progress tracking
 * const remoteId = await loadModel({
 *   modelSrc: "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf",
 *   modelType: "llamacpp-completion",
 *   onProgress: (progress) => {
 *     console.log(`Downloaded: ${progress.percentage}%`);
 *   }
 * });
 *
 * // Multimodal model with projection
 * const multimodalId = await loadModel({
 *   modelSrc: "https://huggingface.co/.../main-model.gguf",
 *   modelType: "llamacpp-completion",
 *   modelConfig: {
 *     ctx_size: 512,
 *     projectionModelSrc: "https://huggingface.co/.../projection-model.gguf"
 *   },
 *   onProgress: (progress) => {
 *     console.log(`Loading: ${progress.percentage}%`);
 *   }
 * });
 *
 * // Whisper with VAD model
 * const whisperId = await loadModel({
 *   modelSrc: "https://huggingface.co/.../whisper-model.gguf",
 *   modelType: "whispercpp-transcription",
 *   modelConfig: {
 *     mode: "caption",
 *     output_format: "plaintext",
 *     min_seconds: 2,
 *     max_seconds: 6,
 *     vadModelSrc: "https://huggingface.co/.../vad-model.bin"
 *   }
 * });
 *
 * // Load with automatic logging - logs from the model will be forwarded to your logger
 * import { getLogger } from "../logging/index.js";
 * const logger = getLogger("my-app");
 *
 * const modelId = await loadModel({
 *   modelSrc: "/path/to/model.gguf",
 *   modelType: "llamacpp-completion",
 *   logger // Pass logger in options
 * });
 * ```
 */
export declare function loadModel(options: LoadModelOptions, rpcOptions?: RPCOptions): Promise<string> & {
    requestId: string;
};
/**
 * Loads a custom plugin model (any non-built-in `modelType` string).
 * `modelConfig` is plugin-defined; we do not narrow it.
 *
 * @overloadLabel "Custom plugin"
 * @param options - Custom plugin load options. `modelType` can be any
 *   string registered by a plugin; `modelConfig` is forwarded to the
 *   plugin's `loadModel` handler unchanged.
 * @param rpcOptions - Optional RPC options including per-call profiling.
 * @returns Promise that resolves to the loaded model ID.
 */
export declare function loadModel<T extends string>(options: LoadCustomPluginModelOptions<T>, rpcOptions?: RPCOptions): Promise<string> & {
    requestId: string;
};
/**
 * Hot-reloads configuration on an already loaded model.
 *
 * @overloadLabel "Hot-reload config"
 * @param options - Configuration for reloading config on an existing model:
 *   - modelId: The ID of an existing loaded model
 *   - modelType: The type of model (must match the loaded model)
 *   - modelConfig: New configuration to apply
 * @param rpcOptions - Optional RPC options including per-call profiling configuration
 *
 * @returns Promise that resolves to the model ID
 *
 * @throws {QvacErrorBase} When model reload fails, with details in the error message
 * @throws {QvacErrorBase} When receiving an invalid response type from the engine
 *
 * @example
 * ```typescript
 * // Load new model
 * const modelId = await loadModel({
 *   modelSrc: "pear://<hyperdrive-key>/whisper-tiny.gguf",
 *   modelType: "whisper",
 *   modelConfig: { language: "en" },
 * });
 *
 * // Later, update the config without reloading the model
 * await loadModel({
 *   modelId,
 *   modelType: "whisper",
 *   modelConfig: { language: "es" },
 * });
 * ```
 */
export declare function loadModel(options: ReloadConfigOptions, rpcOptions?: RPCOptions): Promise<string> & {
    requestId: string;
};
