import type { RagRequest, RagResponse, RagProgressUpdate } from '../schemas/index.js';
export declare function handleRag(request: RagRequest, onProgress?: (update: RagProgressUpdate) => void): Promise<RagResponse>;
