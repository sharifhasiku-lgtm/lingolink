import { type LlmConfig } from '../../../schemas/index.js';
/**
 * Converts an LlmConfig into the flat string-keyed map the C++ addon expects.
 *
 * JS-only fields excluded from the output (must NOT be forwarded to the addon):
 *   - modelType   (schema discriminant, meaningless at C++ level)
 *   - system_prompt  (JS-side history seeding only; C++ removed --system-prompt in 8189)
 */
export declare function transformLlmConfig(llmConfig: LlmConfig): Record<string, string>;
