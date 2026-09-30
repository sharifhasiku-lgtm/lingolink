import { type RagSaveEmbeddingsParams } from '../../schemas/index.js';
import type { AbortSignal } from 'bare-abort-controller';
import type { SaveStage } from '@qvac/rag';
interface SaveEmbeddingsHandlerOptions {
    onProgress?: (stage: SaveStage, current: number, total: number) => void;
    signal?: AbortSignal;
}
export declare function saveEmbeddings(params: RagSaveEmbeddingsParams, options?: SaveEmbeddingsHandlerOptions): Promise<import("@qvac/rag").SaveEmbeddingsResult[]>;
export {};
