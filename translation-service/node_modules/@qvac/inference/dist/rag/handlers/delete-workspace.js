import { deleteWorkspace as deleteWorkspaceFromManager } from '../rag-workspace-manager.js';
import { ragDeleteWorkspaceParamsSchema } from '../../schemas/index.js';
import { RAGWorkspaceNotFoundError } from '../../errors/index.js';
export async function deleteWorkspace(params) {
    const { workspace } = ragDeleteWorkspaceParamsSchema.parse(params);
    const deleted = await deleteWorkspaceFromManager(workspace);
    if (!deleted) {
        throw new RAGWorkspaceNotFoundError(workspace);
    }
}
