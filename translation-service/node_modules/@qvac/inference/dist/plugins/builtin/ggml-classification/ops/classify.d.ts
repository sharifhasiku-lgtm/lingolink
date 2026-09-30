import { type ClassifyRequest, type ClassificationResult } from '../../../../schemas/index.js';
export declare function classify(params: ClassifyRequest): Promise<{
    results: ClassificationResult[];
    modelExecutionMs: number;
}>;
