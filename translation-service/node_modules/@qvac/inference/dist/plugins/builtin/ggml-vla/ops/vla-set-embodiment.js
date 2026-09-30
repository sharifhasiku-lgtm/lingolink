import { getModel } from '../../../../runtime/model-registry.js';
import { vlaHparamsSchema } from '../../../../schemas/index.js';
export async function vlaSetEmbodiment(request) {
    const model = getModel(request.modelId);
    const hparams = await model.setEmbodiment(request.embodiment);
    // Validate the addon-reported hparams against our schema so the wire
    // shape stays consistent even if the underlying addon changes.
    return { hparams: vlaHparamsSchema.parse(hparams) };
}
