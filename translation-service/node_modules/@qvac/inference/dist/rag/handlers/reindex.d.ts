import { type RagReindexParams } from '../../schemas/index.js';
import type { AbortSignal } from 'bare-abort-controller';
import type { ReindexResult, ReindexStage } from '@qvac/rag';
interface ReindexHandlerOptions {
    onProgress?: (stage: ReindexStage, current: number, total: number) => void;
    signal?: AbortSignal;
}
export declare function reindex(params: RagReindexParams, options?: ReindexHandlerOptions): Promise<ReindexResult>;
export {};
