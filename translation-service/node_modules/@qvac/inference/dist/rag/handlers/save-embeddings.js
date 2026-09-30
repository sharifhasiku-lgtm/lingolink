import { getRagDbAdapter } from '../rag-workspace-manager.js';
import { ragSaveEmbeddingsParamsSchema } from '../../schemas/index.js';
export async function saveEmbeddings(params, options) {
    const { documents, progressInterval, workspace } = ragSaveEmbeddingsParamsSchema.parse(params);
    if (documents.length === 0) {
        return [];
    }
    const dbAdapter = await getRagDbAdapter(workspace);
    const saveOpts = {
        progressInterval,
        onProgress: options?.onProgress,
        signal: options?.signal
    };
    return await dbAdapter.saveEmbeddings(documents, saveOpts);
}
