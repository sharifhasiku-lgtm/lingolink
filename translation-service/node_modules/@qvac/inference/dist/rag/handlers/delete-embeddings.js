import { getRagDbAdapter, hasRagWorkspaceStorage } from '../rag-workspace-manager.js';
import { ragDeleteEmbeddingsParamsSchema } from '../../schemas/index.js';
import { RAGDeleteFailedError } from '../../errors/index.js';
export async function deleteEmbeddings(params) {
    const { ids, workspace } = ragDeleteEmbeddingsParamsSchema.parse(params);
    if (!hasRagWorkspaceStorage(workspace)) {
        throw new RAGDeleteFailedError('workspace is not initialized');
    }
    const dbAdapter = await getRagDbAdapter(workspace);
    await dbAdapter.deleteEmbeddings(ids);
}
