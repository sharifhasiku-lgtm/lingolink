import { getModel } from '../../../../runtime/model-registry.js';
import { vlaHparamsSchema } from '../../../../schemas/index.js';
export function vlaGetHparams(request) {
    const model = getModel(request.modelId);
    // Validate the addon-reported hparams against our schema so the response
    // shape stays consistent even if the underlying addon changes.
    const parsed = vlaHparamsSchema.parse(model.hparams);
    return Promise.resolve({
        hparams: parsed,
        backendName: model.backendName ?? null
    });
}
