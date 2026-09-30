import { closeRagInstance, deleteWorkspace, DEFAULT_WORKSPACE } from '../rag-workspace-manager.js';
import { ragCloseWorkspaceParamsSchema } from '../../schemas/index.js';
export async function closeWorkspace(params) {
    const { workspace, deleteOnClose } = ragCloseWorkspaceParamsSchema.parse(params);
    await closeRagInstance(workspace);
    if (deleteOnClose) {
        await deleteWorkspace(workspace ?? DEFAULT_WORKSPACE);
    }
}
