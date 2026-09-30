import { getModel } from '../../../../runtime/model-registry.js';
import Buffer from 'bare-buffer';
import { classifyRequestSchema } from '../../../../schemas/index.js';
import { nowMs } from '../../../../profiling/index.js';
function hasClassify(model) {
    return (typeof model === 'object' &&
        model !== null &&
        'classify' in model &&
        typeof model.classify === 'function');
}
export async function classify(params) {
    const { modelId, image, topK, width, height, channels } = classifyRequestSchema.parse(params);
    const model = getModel(modelId);
    if (!hasClassify(model)) {
        throw new Error('Loaded model does not support classify()');
    }
    const imageBytes = Buffer.from(image, 'base64');
    const opts = {};
    if (topK !== undefined)
        opts.topK = topK;
    if (width !== undefined)
        opts.width = width;
    if (height !== undefined)
        opts.height = height;
    if (channels !== undefined)
        opts.channels = channels;
    const modelStart = nowMs();
    const results = await model.classify(imageBytes, opts);
    const modelExecutionMs = nowMs() - modelStart;
    return { results, modelExecutionMs };
}
