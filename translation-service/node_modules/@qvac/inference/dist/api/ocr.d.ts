import { type OCRClientParams, type OCRTextBlock, type OCRStats } from '../schemas/index.js';
/**
 * Performs Optical Character Recognition (OCR) on an image to extract text.
 *
 * @param params - The OCR parameters
 * @param params.modelId - The identifier of the loaded OCR model to use
 * @param params.image - Image input as either a file path (string) or image buffer
 * @param params.options - Optional OCR options (e.g., paragraph mode)
 * @param params.stream - Whether to stream blocks as they're detected (true) or return all at once (false). Defaults to false
 * @returns Object with blockStream generator, blocks promise, and stats promise
 * @example
 * ```typescript
 * // Non-streaming mode (default) - get all blocks at once
 * const { blocks } = ocr({ modelId, image: "/path/to/image.png" });
 * for (const block of await blocks) {
 *   console.log(block.text, block.bbox, block.confidence);
 * }
 *
 * // Streaming mode - process blocks as they arrive
 * const { blockStream } = ocr({ modelId, image: imageBuffer, stream: true });
 * for await (const blocks of blockStream) {
 *   console.log("Detected:", blocks);
 * }
 * ```
 */
export declare function ocr(params: OCRClientParams): {
    blockStream: AsyncGenerator<OCRTextBlock[]>;
    blocks: Promise<OCRTextBlock[]>;
    stats: Promise<OCRStats | undefined>;
};
