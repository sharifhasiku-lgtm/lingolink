import { getRagInstance, hasRagWorkspaceStorage } from '../rag-workspace-manager.js';
import { embed } from '../../plugins/ops/embed.js';
import { ragSearchParamsSchema } from '../../schemas/index.js';
export async function search(params) {
    const { modelId, query, topK, n, workspace } = ragSearchParamsSchema.parse(params);
    if (!hasRagWorkspaceStorage(workspace)) {
        return [];
    }
    async function embeddingFunction(text) {
        const result = await embed({ modelId, text });
        return result.embedding;
    }
    const rag = await getRagInstance(modelId, embeddingFunction, workspace);
    const results = await rag.search(query, { topK, n });
    return results;
}
