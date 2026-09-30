import { type ModelTypeInput } from '../schemas/index.js';
export declare function getModelParallel(config: {
    parallel?: number | undefined;
}): number;
export declare function transformConfigForReload(modelType: ModelTypeInput, config: unknown): unknown;
