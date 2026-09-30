import { z } from 'zod';
import type { Doc, EmbeddedDoc, SaveEmbeddingsResult, SearchResult, ReindexResult, IngestResult, IngestStage, ReindexStage, SaveStage } from '@qvac/rag';
export declare const ragIngestParamsSchema: z.ZodObject<{
    workspace: z.ZodOptional<z.ZodString>;
    modelId: z.ZodString;
    documents: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    chunk: z.ZodDefault<z.ZodBoolean>;
    chunkOpts: z.ZodOptional<z.ZodObject<{
        chunkSize: z.ZodOptional<z.ZodNumber>;
        chunkOverlap: z.ZodOptional<z.ZodNumber>;
        chunkStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            paragraph: "paragraph";
        }>>;
        splitStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            word: "word";
            token: "token";
            sentence: "sentence";
            line: "line";
        }>>;
    }, z.core.$strip>>;
    progressInterval: z.ZodOptional<z.ZodNumber>;
    onProgress: z.ZodOptional<z.ZodUnknown>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ragChunkParamsSchema: z.ZodObject<{
    documents: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    chunkOpts: z.ZodOptional<z.ZodObject<{
        chunkSize: z.ZodOptional<z.ZodNumber>;
        chunkOverlap: z.ZodOptional<z.ZodNumber>;
        chunkStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            paragraph: "paragraph";
        }>>;
        splitStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            word: "word";
            token: "token";
            sentence: "sentence";
            line: "line";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ragSaveEmbeddingsParamsSchema: z.ZodObject<{
    modelId: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    documents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        embedding: z.ZodArray<z.ZodNumber>;
        embeddingModelId: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    progressInterval: z.ZodOptional<z.ZodNumber>;
    onProgress: z.ZodOptional<z.ZodUnknown>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ragReindexParamsSchema: z.ZodObject<{
    modelId: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    onProgress: z.ZodOptional<z.ZodUnknown>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ragSearchParamsSchema: z.ZodObject<{
    workspace: z.ZodOptional<z.ZodString>;
    modelId: z.ZodString;
    query: z.ZodString;
    topK: z.ZodDefault<z.ZodNumber>;
    n: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const ragDeleteEmbeddingsParamsSchema: z.ZodObject<{
    modelId: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    ids: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const ragCloseWorkspaceParamsSchema: z.ZodObject<{
    workspace: z.ZodOptional<z.ZodString>;
    deleteOnClose: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ragDeleteWorkspaceParamsSchema: z.ZodObject<{
    workspace: z.ZodPipe<z.ZodString, z.ZodString>;
}, z.core.$strip>;
export declare const ragRequestSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    documents: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    chunkOpts: z.ZodOptional<z.ZodObject<{
        chunkSize: z.ZodOptional<z.ZodNumber>;
        chunkOverlap: z.ZodOptional<z.ZodNumber>;
        chunkStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            paragraph: "paragraph";
        }>>;
        splitStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            word: "word";
            token: "token";
            sentence: "sentence";
            line: "line";
        }>>;
    }, z.core.$strip>>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"chunk">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    workspace: z.ZodOptional<z.ZodString>;
    modelId: z.ZodString;
    documents: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    chunk: z.ZodDefault<z.ZodBoolean>;
    chunkOpts: z.ZodOptional<z.ZodObject<{
        chunkSize: z.ZodOptional<z.ZodNumber>;
        chunkOverlap: z.ZodOptional<z.ZodNumber>;
        chunkStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            paragraph: "paragraph";
        }>>;
        splitStrategy: z.ZodOptional<z.ZodEnum<{
            character: "character";
            word: "word";
            token: "token";
            sentence: "sentence";
            line: "line";
        }>>;
    }, z.core.$strip>>;
    progressInterval: z.ZodOptional<z.ZodNumber>;
    onProgress: z.ZodOptional<z.ZodUnknown>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"ingest">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    modelId: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    documents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        embedding: z.ZodArray<z.ZodNumber>;
        embeddingModelId: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    progressInterval: z.ZodOptional<z.ZodNumber>;
    onProgress: z.ZodOptional<z.ZodUnknown>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"saveEmbeddings">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    workspace: z.ZodOptional<z.ZodString>;
    modelId: z.ZodString;
    query: z.ZodString;
    topK: z.ZodDefault<z.ZodNumber>;
    n: z.ZodDefault<z.ZodNumber>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"search">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    modelId: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    ids: z.ZodArray<z.ZodString>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"deleteEmbeddings">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    modelId: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    onProgress: z.ZodOptional<z.ZodUnknown>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"reindex">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"listWorkspaces">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    workspace: z.ZodOptional<z.ZodString>;
    deleteOnClose: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"closeWorkspace">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    workspace: z.ZodPipe<z.ZodString, z.ZodString>;
    type: z.ZodLiteral<"rag">;
    operation: z.ZodLiteral<"deleteWorkspace">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "operation">;
declare const ragWorkspaceInfoSchema: z.ZodObject<{
    name: z.ZodString;
    open: z.ZodBoolean;
}, z.core.$strip>;
export declare const ragResponseSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"chunk">;
    chunks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"ingest">;
    processed: z.ZodArray<z.ZodObject<{
        status: z.ZodEnum<{
            fulfilled: "fulfilled";
            rejected: "rejected";
        }>;
        id: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    droppedIndices: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"saveEmbeddings">;
    processed: z.ZodArray<z.ZodObject<{
        status: z.ZodEnum<{
            fulfilled: "fulfilled";
            rejected: "rejected";
        }>;
        id: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"search">;
    results: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        score: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"deleteEmbeddings">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"reindex">;
    result: z.ZodObject<{
        reindexed: z.ZodBoolean;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"listWorkspaces">;
    workspaces: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        open: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"closeWorkspace">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"rag">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    operation: z.ZodLiteral<"deleteWorkspace">;
}, z.core.$strip>], "operation">;
export declare const ragProgressUpdateSchema: z.ZodObject<{
    type: z.ZodLiteral<"rag:progress">;
    operation: z.ZodEnum<{
        ingest: "ingest";
        saveEmbeddings: "saveEmbeddings";
        reindex: "reindex";
    }>;
    workspace: z.ZodString;
    stage: z.ZodString;
    current: z.ZodNumber;
    total: z.ZodNumber;
    timestamp: z.ZodNumber;
}, z.core.$strip>;
export type RagRequest = z.infer<typeof ragRequestSchema>;
export type RagResponse = z.infer<typeof ragResponseSchema>;
export type RagProgressUpdate = z.infer<typeof ragProgressUpdateSchema>;
export type RagChunkParams = z.infer<typeof ragChunkParamsSchema>;
export type RagIngestParams = z.input<typeof ragIngestParamsSchema> & {
    onProgress?: (stage: IngestStage, current: number, total: number) => void;
};
export type RagSaveEmbeddingsParams = z.infer<typeof ragSaveEmbeddingsParamsSchema> & {
    onProgress?: (stage: SaveStage, current: number, total: number) => void;
};
export type RagSearchParams = z.input<typeof ragSearchParamsSchema>;
export type RagDeleteEmbeddingsParams = z.infer<typeof ragDeleteEmbeddingsParamsSchema>;
export type RagReindexParams = z.input<typeof ragReindexParamsSchema> & {
    onProgress?: (stage: ReindexStage, current: number, total: number) => void;
};
export type RagCloseWorkspaceParams = z.infer<typeof ragCloseWorkspaceParamsSchema>;
export type RagDeleteWorkspaceParams = z.infer<typeof ragDeleteWorkspaceParamsSchema>;
export type RagWorkspaceInfo = z.infer<typeof ragWorkspaceInfoSchema>;
export type { Doc as RagDoc, EmbeddedDoc as RagEmbeddedDoc, SaveEmbeddingsResult as RagSaveEmbeddingsResult, SearchResult as RagSearchResult, ReindexResult as RagReindexResult, IngestStage as RagIngestStage, ReindexStage as RagReindexStage, SaveStage as RagSaveStage, IngestResult as RagIngestResult };
