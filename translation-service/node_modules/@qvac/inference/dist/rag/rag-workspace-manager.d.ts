import { RAG, HyperDBAdapter, TurboVecAdapter, type EmbeddingFunction } from '@qvac/rag';
type RagDbAdapter = HyperDBAdapter | TurboVecAdapter;
export declare const DEFAULT_WORKSPACE = "default";
export declare function hasRagWorkspaceStorage(workspace?: string): boolean;
export declare function getRagDbAdapter(workspace?: string): Promise<RagDbAdapter>;
export declare function getRagInstance(modelId: string, embeddingFunction: EmbeddingFunction, workspace?: string): Promise<RAG>;
export declare function closeRagInstance(workspace?: string): Promise<void>;
export declare function closeAllRagInstances(): Promise<void>;
export interface RagWorkspaceInfo {
    name: string;
    open: boolean;
}
export declare function listWorkspaces(): RagWorkspaceInfo[];
export declare function isWorkspaceLoaded(workspace: string): boolean;
export declare function deleteWorkspace(workspace: string): Promise<boolean>;
export {};
