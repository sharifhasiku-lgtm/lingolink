import { normalizeModelType, ModelType } from '../schemas/index.js';
import { buildParakeetReloadConfig, buildWhisperReloadConfig } from '../plugins/builtin/asr-ggml/config.js';
// The model's concurrent sequence slots. Missing / 0 / NaN all mean single-slot;
// floor a fractional value so it can't over-admit.
export function getModelParallel(config) {
    const n = Math.floor(Number(config.parallel));
    return Number.isFinite(n) && n >= 1 ? n : 1;
}
export function transformConfigForReload(modelType, config) {
    const canonicalType = normalizeModelType(modelType);
    switch (canonicalType) {
        case ModelType.whispercppTranscription: {
            return buildWhisperReloadConfig(config);
        }
        case ModelType.parakeetTranscription: {
            return buildParakeetReloadConfig(config);
        }
        case ModelType.llamacppCompletion:
        case ModelType.llamacppEmbedding:
        case ModelType.nmtcppTranslation:
        case ModelType.ttsGgml:
            // Return as-is for now
            return config;
        default:
            return config;
    }
}
