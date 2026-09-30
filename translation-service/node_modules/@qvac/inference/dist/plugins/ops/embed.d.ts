import { type EmbedParams, type EmbedStats } from '../../schemas/index.js';
export interface EmbedResult {
    embedding: number[] | number[][];
    stats?: EmbedStats;
}
export declare function embed(params: {
    modelId: string;
    text: string;
}, requestId?: string): Promise<EmbedResult>;
export declare function embed(params: {
    modelId: string;
    text: string[];
}, requestId?: string): Promise<EmbedResult>;
export declare function embed(params: EmbedParams, requestId?: string): Promise<EmbedResult>;
export declare function normalizeVector(vector: Float32Array): number[];
