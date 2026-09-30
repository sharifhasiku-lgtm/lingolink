import { type RagIngestParams } from '../../schemas/index.js';
import type { AbortSignal } from 'bare-abort-controller';
import type { IngestStage } from '@qvac/rag';
interface IngestHandlerOptions {
    onProgress?: (stage: IngestStage, current: number, total: number) => void;
    signal?: AbortSignal;
}
export declare function ingest(params: RagIngestParams, options?: IngestHandlerOptions): Promise<import("@qvac/rag").IngestResult>;
export {};
