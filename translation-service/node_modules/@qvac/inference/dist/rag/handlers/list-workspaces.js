import { listWorkspaces as listWorkspacesFromManager } from '../rag-workspace-manager.js';
export function listWorkspaces() {
    return listWorkspacesFromManager();
}
