import type { RagChunkParams, RagDoc, RagIngestParams, RagSaveEmbeddingsParams, RagSaveEmbeddingsResult, RagSearchParams, RagSearchResult, RagDeleteEmbeddingsParams, RagReindexParams, RagReindexResult, RagWorkspaceInfo, RagCloseWorkspaceParams, RagDeleteWorkspaceParams, RPCOptions } from '@qvac/inference/surface';
/**
 * Chunks documents into smaller pieces for embedding.
 * Part of the segregated flow: ragChunk() → embed() → ragSaveEmbeddings()
 *
 * @param params - The parameters for chunking
 * @param params.documents - Documents to chunk (string or array)
 * @param params.chunkOpts - Chunking options (chunkSize, chunkOverlap, chunkStrategy)
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns Array of chunk results with id and content
 * @throws {RAGChunkFailedError} When the operation fails
 *
 * @example
 * ```typescript
 * const chunks = await ragChunk({
 *   documents: ["Long document text here..."],
 *   chunkOpts: {
 *     chunkSize: 256,
 *     chunkOverlap: 50,
 *     chunkStrategy: "paragraph",
 *   },
 * });
 * ```
 */
export declare function ragChunk(params: RagChunkParams, options?: RPCOptions): Promise<RagDoc[]>;
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Ingests documents into the RAG vector database.
 * Full pipeline: chunk → embed → save
 *
 * **Workspace lifecycle:** This operation implicitly opens (or creates) the workspace.
 * The workspace remains open until closed.
 *
 * @param params - The embedding model, documents, optional chunking settings,
 *   workspace (default: `"default"`), and progress callback configuration.
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns Processing results and dropped indices
 * @throws {RAGSaveFailedError} When the operation fails
 * @throws {StreamEndedError} When streaming ends unexpectedly (only when using onProgress)
 *
 * @example
 * ```typescript
 * // Simple ingest
 * const result = await ragIngest({
 *   modelId,
 *   documents: ["Document 1", "Document 2"],
 * });
 *
 * // With progress tracking
 * const result = await ragIngest({
 *   modelId,
 *   documents: ["Document 1", "Document 2"],
 *   workspace: "my-docs",
 *   onProgress: (stage, current, total) => {
 *     console.log(`[${stage}] ${current}/${total}`);
 *   },
 * });
 * ```
 */
export declare function ragIngest(params: RagIngestParams, options?: RPCOptions): Promise<{
    processed: RagSaveEmbeddingsResult[];
    droppedIndices: number[];
}> & {
    requestId: string;
};
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Saves pre-embedded documents to the RAG vector database.
 * Part of the segregated flow: chunk() → embed() → saveEmbeddings()
 *
 * **Workspace lifecycle:** This operation implicitly opens (or creates) the workspace.
 * The workspace remains open until closed.
 *
 * @param params - The pre-embedded documents, workspace (default:
 *   `"default"`), and optional progress callback configuration.
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns Array of save results
 * @throws {RAGSaveFailedError} When the operation fails
 * @throws {StreamEndedError} When streaming ends unexpectedly (only when using onProgress)
 *
 * @example
 * ```typescript
 * // Segregated flow
 * const chunks = await ragChunk({ documents: ["text1", "text2"] });
 * const { embedding: embeddings } = await embed({ modelId, text: chunks.map(c => c.content) });
 * const embeddedDocs = chunks.map((chunk, i) => ({
 *   ...chunk,
 *   embedding: embeddings[i],
 *   embeddingModelId: modelId,
 * }));
 * const result = await ragSaveEmbeddings({
 *   documents: embeddedDocs,
 *   workspace: "my-workspace",
 * });
 * ```
 */
export declare function ragSaveEmbeddings(params: RagSaveEmbeddingsParams, options?: RPCOptions): Promise<RagSaveEmbeddingsResult[]> & {
    requestId: string;
};
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Searches for similar documents in the RAG vector database.
 *
 * **Workspace lifecycle:** This operation requires an existing workspace. If the workspace
 * doesn't exist, returns an empty array.
 *
 * @param params - The parameters for searching
 * @param params.modelId - The identifier of the embedding model to use
 * @param params.query - The search query text
 * @param params.topK - Number of top results to retrieve (default: 5)
 * @param params.n - Number of centroids to use for IVF index search (default: 3)
 * @param params.workspace - Workspace to search in (default: "default").
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns Array of search results with id, content, and score. Empty array if workspace doesn't exist.
 * @throws {RAGSearchFailedError} When the operation fails
 *
 * @example
 * ```typescript
 * const results = await ragSearch({
 *   modelId,
 *   query: "AI and machine learning",
 *   topK: 5,
 *   workspace: "my-docs",
 * });
 * ```
 */
export declare function ragSearch(params: RagSearchParams, options?: RPCOptions): Promise<RagSearchResult[]>;
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Deletes document embeddings from the RAG vector database.
 *
 * **Workspace lifecycle:** This operation requires an existing workspace.
 *
 * @param params - The parameters for deleting embeddings
 * @param params.ids - Array of document IDs to delete
 * @param params.workspace - Workspace to delete from (default: "default")
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @throws {RAGDeleteFailedError} When the operation fails or workspace doesn't exist
 *
 * @example
 * ```typescript
 * await ragDeleteEmbeddings({
 *   ids: ["doc-1", "doc-2"],
 *   workspace: "my-docs",
 * });
 * ```
 */
export declare function ragDeleteEmbeddings(params: RagDeleteEmbeddingsParams, options?: RPCOptions): Promise<void>;
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Reindexes the RAG database to optimize search performance.
 * For HyperDB, this rebalances centroids using k-means clustering.
 *
 * **Workspace lifecycle:** This operation requires an existing workspace.
 *
 * **Note:** Reindex requires a minimum number of documents to perform clustering.
 * For HyperDB, this is 16 documents by default. If there are insufficient documents,
 * `reindexed` will be `false` with `details` explaining the reason.
 *
 * @param params - The existing workspace to reindex (default: `"default"`)
 *   and optional progress callback.
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns Reindex result with `reindexed` boolean and optional `details`
 * @throws {RAGSaveFailedError} When the operation fails or workspace doesn't exist
 * @throws {StreamEndedError} When streaming ends unexpectedly (only when using onProgress)
 *
 * @example
 * ```typescript
 * // Simple reindex
 * const result = await ragReindex({
 *   workspace: "my-docs",
 * });
 *
 * // Check result
 * if (!result.reindexed) {
 *   console.log("Reindex skipped:", result.details?.reason);
 * }
 *
 * // With progress tracking
 * const result = await ragReindex({
 *   workspace: "my-docs",
 *   onProgress: (stage, current, total) => {
 *     console.log(`[${stage}] ${current}/${total}`);
 *   },
 * });
 * ```
 */
export declare function ragReindex(params: RagReindexParams, options?: RPCOptions): Promise<RagReindexResult> & {
    requestId: string;
};
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Lists all RAG workspaces with their open status.
 *
 * Returns all workspaces that exist on disk. The `open` field indicates whether
 * the workspace is currently loaded in memory and holding active resources
 * (Corestore, HyperDB adapter, and possibly a RAG instance).
 *
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @returns Array of workspace info with name and open status
 * @throws {RAGListWorkspacesFailedError} When the operation fails
 *
 * @example
 * ```typescript
 * const workspaces = await ragListWorkspaces();
 * // [{ name: "default", open: true }, { name: "my-docs", open: false }]
 * ```
 */
export declare function ragListWorkspaces(options?: RPCOptions): Promise<RagWorkspaceInfo[]>;
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Closes a RAG workspace, releasing in-memory resources (Corestore, HyperDB adapter, RAG instance).
 *
 * **Workspace lifecycle:** Workspaces are implicitly opened.
 * This function explicitly closes them, releasing memory and file locks. The workspace data
 * remains on disk unless `deleteOnClose` is set to true.
 *
 * @param params - The workspace to close (default: `"default"`) and whether
 *   its on-disk data should also be deleted.
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @throws {RAGCloseWorkspaceFailedError} When the operation fails
 *
 * @example
 * ```typescript
 * // Close a specific workspace
 * await ragCloseWorkspace({ workspace: "my-docs" });
 *
 * // Close and delete in one call
 * await ragCloseWorkspace({ workspace: "my-docs", deleteOnClose: true });
 * ```
 */
export declare function ragCloseWorkspace(params?: RagCloseWorkspaceParams, options?: RPCOptions): Promise<void>;
/**
 * @prototype The built-in RAG vector store is not production grade. For production, use an external vector DB (see the RAG guide).
 *
 * Deletes a RAG workspace and all its data.
 * The workspace must not be currently loaded/in-use.
 *
 * @param params - The parameters for deletion
 * @param params.workspace - Name of the workspace to delete
 * @param options - Optional RPC options (timeout, profiling, force new connection, etc.).
 * @throws {RAGDeleteFailedError} When the workspace doesn't exist or is currently loaded
 *
 * @example
 * ```typescript
 * await ragDeleteWorkspace({ workspace: "my-docs" });
 * ```
 */
export declare function ragDeleteWorkspace(params: RagDeleteWorkspaceParams, options?: RPCOptions): Promise<void>;
//# sourceMappingURL=rag.d.ts.map