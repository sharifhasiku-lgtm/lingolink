import { ModelLoadFailedError } from '../../../errors/index.js';
import { hyperdriveUrlSchema } from '../../../schemas/load-model.js';
import { OCR_CRAFT, OCR_DOCTR_1 } from '../../../models/registry/index.js';
// Detector weights paired with each pipeline. EasyOCR runs CRAFT
// detection, DocTR runs DBNet detection — the addon cannot load one
// pipeline's detector into the other.
export const DETECTOR_FILENAMES = {
    easyocr: 'craft_mlt_25k.gguf',
    doctr: 'db_mobilenet_v3_large.gguf'
};
const DETECTOR_REGISTRY_SOURCES = {
    easyocr: OCR_CRAFT.src,
    doctr: OCR_DOCTR_1.src
};
// The addon defaults to the EasyOCR pipeline, so a DocTR recognizer
// loaded without an explicit `pipelineType` dies deep in the EasyOCR
// CRNN weight loader with a raw missing-tensor error (QVAC-22514).
// Recognize the known DocTR registry artifacts by name and opt in to
// the DocTR pipeline automatically.
function inferPipelineType(recognizerSrc) {
    const path = srcPathname(recognizerSrc);
    const filename = path.split('/').pop() ?? '';
    if (filename === 'crnn_mobilenet_v3_small.gguf' || path.includes('/gguf/doctr')) {
        return 'doctr';
    }
    return undefined;
}
function srcPathname(src) {
    return (src.split(/[?#]/)[0] ?? '').toLowerCase();
}
function srcToString(src) {
    return typeof src === 'string' ? src : src.src;
}
// The registry still lists legacy `.onnx` OCR artifacts under the
// "@qvac/ocr-onnx" engine; the ggml-ocr addon can only open GGUF, so a
// raw "failed to open GGUF" surfaces mid-load. Fail fast with the
// supported configurations instead (QVAC-22514).
function assertGgufSource(src, role) {
    if (!srcPathname(src).endsWith('.onnx'))
        return;
    throw new ModelLoadFailedError(`ggml-ocr only loads GGUF models, but the ${role} source points to an ONNX file: ${src}. ` +
        'The .onnx OCR registry entries are legacy artifacts of the removed "onnx-ocr" engine. ' +
        'Supported registry configurations: EasyOCR (default) — modelSrc: OCR_LATIN.src (detector OCR_CRAFT auto-derived); ' +
        'DocTR — modelSrc: OCR_DOCTR.src (pipelineType and detector OCR_DOCTR_1 auto-derived).');
}
function deriveDetectorSource(modelSrc, pipelineType) {
    if (modelSrc.startsWith('pear://')) {
        const { key } = hyperdriveUrlSchema.parse(modelSrc);
        return `pear://${key}/${DETECTOR_FILENAMES[pipelineType]}`;
    }
    if (modelSrc.startsWith('registry://')) {
        return DETECTOR_REGISTRY_SOURCES[pipelineType];
    }
    return undefined;
}
export async function resolveOcrConfig(cfg, ctx) {
    const { detectorModelSrc, ...ocrConfig } = cfg;
    assertGgufSource(ctx.modelSrc, 'recognizer');
    const pipelineType = ocrConfig.pipelineType ?? inferPipelineType(ctx.modelSrc) ?? 'easyocr';
    const detectorSrc = detectorModelSrc ?? deriveDetectorSource(ctx.modelSrc, pipelineType);
    if (!detectorSrc) {
        throw new ModelLoadFailedError(`Detector model required for OCR (${pipelineType} pipeline expects ` +
            `${DETECTOR_FILENAMES[pipelineType]}). Use a hyperdrive or registry ` +
            'source, or provide detectorModelSrc');
    }
    assertGgufSource(srcToString(detectorSrc), 'detector');
    const detectorModelPath = await ctx.resolveModelPath(detectorSrc);
    return {
        config: { ...ocrConfig, pipelineType },
        artifacts: { detectorModelPath }
    };
}
