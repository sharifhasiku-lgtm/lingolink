import { getRagDbAdapter, hasRagWorkspaceStorage } from '../rag-workspace-manager.js';
import { ragReindexParamsSchema } from '../../schemas/index.js';
import { RAGHyperDBFailedError } from '../../errors/index.js';
export async function reindex(params, options) {
    const { workspace } = ragReindexParamsSchema.parse(params);
    if (!hasRagWorkspaceStorage(workspace)) {
        throw new RAGHyperDBFailedError('workspace is not initialized');
    }
    const dbAdapter = await getRagDbAdapter(workspace);
    const reindexOpts = {
        onProgress: options?.onProgress,
        signal: options?.signal
    };
    const result = await dbAdapter.reindex(reindexOpts);
    return result;
}
