import { getRagInstance } from '../rag-workspace-manager.js';
import { embed } from '../../plugins/ops/embed.js';
import { ragIngestParamsSchema } from '../../schemas/index.js';
export async function ingest(params, options) {
    const { modelId, documents, chunk, chunkOpts, workspace, progressInterval } = ragIngestParamsSchema.parse(params);
    async function embeddingFunction(text) {
        const result = await embed({ modelId, text });
        return result.embedding;
    }
    const rag = await getRagInstance(modelId, embeddingFunction, workspace);
    const ingestOpts = {
        chunk,
        chunkOpts,
        progressInterval,
        onProgress: options?.onProgress,
        signal: options?.signal
    };
    return await rag.ingest(documents, modelId, ingestOpts);
}
