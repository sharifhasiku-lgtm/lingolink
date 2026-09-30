import { LLMChunkAdapter } from '@qvac/rag';
import { ragChunkParamsSchema } from '../../schemas/index.js';
export async function chunk(params) {
    const { documents, chunkOpts } = ragChunkParamsSchema.parse(params);
    const chunker = new LLMChunkAdapter(chunkOpts);
    return await chunker.chunkText(documents, chunkOpts);
}
