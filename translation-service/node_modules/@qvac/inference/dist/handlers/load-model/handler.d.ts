import type { LoadModelRequest, LoadModelResponse, ModelProgressUpdate } from '../../schemas/index.js';
export declare function handleLoadModel(request: LoadModelRequest, progressCallback?: (update: ModelProgressUpdate) => void): Promise<LoadModelResponse>;
