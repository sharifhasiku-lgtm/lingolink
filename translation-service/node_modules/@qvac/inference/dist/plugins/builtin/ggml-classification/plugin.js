import ImageClassifier from '@qvac/classification-ggml';
import { definePlugin, defineHandler, classifyRequestSchema, classifyResponseSchema, ModelType, classificationConfigSchema, ADDON_CLASSIFICATION } from '../../../schemas/index.js';
import { createStreamLogger, registerAddonLogger } from '../../../logging/index.js';
import { classify } from './ops/classify.js';
export const classificationPlugin = definePlugin({
    modelType: ModelType.ggmlClassification,
    displayName: 'Image Classification (GGML)',
    addonPackage: ADDON_CLASSIFICATION,
    loadConfigSchema: classificationConfigSchema,
    skipPrimaryModelPathValidation: true,
    createModel(params) {
        const config = (params.modelConfig ?? {});
        const resolvedModelPath = config.modelPath ?? (params.modelPath || undefined);
        const logger = createStreamLogger(params.modelId, ModelType.ggmlClassification);
        registerAddonLogger(params.modelId, ModelType.ggmlClassification, logger);
        const inner = new ImageClassifier({
            ...(resolvedModelPath ? { modelPath: resolvedModelPath } : {}),
            logger,
            nativeLogger: config.nativeLogger ?? false
        });
        // Apply the load-time `topK` as a default for classify() calls so the
        // load-config field is not silently ignored. Per-request `topK` (passed
        // in the second arg) wins via the `...opts` spread.
        const defaultTopK = config.topK;
        const model = {
            load: () => inner.load(),
            classify: (image, opts = {}) => inner.classify(image, {
                ...(defaultTopK !== undefined && { topK: defaultTopK }),
                ...opts
            }),
            unload: () => inner.unload()
        };
        return { model };
    },
    handlers: {
        classify: defineHandler({
            requestSchema: classifyRequestSchema,
            responseSchema: classifyResponseSchema,
            streaming: true,
            // Classification is a single forward pass with no addon-side cancel
            // surface — mirrors `ocr`/`tts`/`upscale`. The yield-once handler
            // can't be interrupted partway, so we declare scope:"none".
            cancel: { scope: 'none' },
            handler: async function* (request) {
                const { results, modelExecutionMs } = await classify(request);
                yield {
                    type: 'classify',
                    results,
                    done: true,
                    modelExecutionMs
                };
            }
        })
    }
});
