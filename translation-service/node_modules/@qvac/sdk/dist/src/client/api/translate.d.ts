import { type TranslateClientParams, type TranslationStats, type RPCOptions } from '@qvac/inference/surface';
/**
 * Translates text from one language to another using a specified translation model.
 * Supports both NMT (Neural Machine Translation) and LLM models.
 *
 * @param params - Translation configuration object
 * @param params.modelId - The identifier of the translation model to use
 * @param params.text - The input text to translate
 * @param params.from - Source language code (optional)
 * @param params.to - Target language code
 * @param params.stream - Whether to stream tokens (true) or return complete response (false). Defaults to true.
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns Object with a tokenStream generator, `translations` (one entry per
 * input, in order), `text` (those entries joined by newlines) and stats
 * @throws {QvacErrorBase} When translation fails with an error message or when language detection fails
 * @example
 * ```typescript
 * // Streaming mode (default)
 * const result = translate({
 *   modelId: "modelId",
 *   text: "Hello world",
 *   from: "en",
 *   to: "es",
 *   modelType: "llm",
 * });
 *
 * for await (const token of result.tokenStream) {
 *   console.log(token);
 * }
 *
 * // Non-streaming mode
 * const response = translate({
 *   modelId: "modelId",
 *   text: "Hello world",
 *   from: "en",
 *   to: "es",
 *   modelType: "llm",
 *   stream: false,
 * });
 *
 * console.log(await response.text);
 * ```
 */
export declare function translate(params: TranslateClientParams, options?: RPCOptions): {
    tokenStream: AsyncGenerator<string>;
    stats: Promise<TranslationStats | undefined>;
    translations: Promise<string[]>;
    text: Promise<string>;
    requestId: string;
};
//# sourceMappingURL=translate.d.ts.map