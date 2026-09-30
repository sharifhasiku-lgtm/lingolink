import { dispatchPluginReply } from './plugin-dispatch.js';
import { startFinetune } from '../plugins/builtin/llamacpp-completion/ops/finetune.js';
export async function handleFinetune(request, progressCallback) {
    if (progressCallback &&
        (request.operation === 'start' ||
            request.operation === 'resume' ||
            request.operation === undefined)) {
        return startFinetune(request, (progress) => {
            const update = {
                type: 'finetune:progress',
                modelId: request.modelId,
                ...progress
            };
            progressCallback(update);
        });
    }
    return dispatchPluginReply(request.modelId, 'finetune', request);
}
