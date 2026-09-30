import type { FinetuneProgressResponse, FinetuneRequest, FinetuneResult } from '../schemas/index.js';
export declare function handleFinetune(request: FinetuneRequest, progressCallback?: (update: FinetuneProgressResponse) => void): Promise<FinetuneResult>;
