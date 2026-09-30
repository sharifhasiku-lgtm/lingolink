import { type GetModelInfoParams, type ModelInfo } from '@qvac/inference/surface';
/**
 * Returns status information for a catalog model, including cache state and loaded instances.
 *
 * @param params - Query parameters.
 * @param params.name - The model's registry name (as found in the SDK's built-in catalog) to look up.
 * @returns A promise resolving to the model's status information (cache presence, loaded instances, size on disk, etc.).
 * @throws {QvacErrorBase} When the response type is invalid (`InvalidResponseError`) or the RPC layer fails.
 */
export declare function getModelInfo(params: GetModelInfoParams): Promise<ModelInfo>;
//# sourceMappingURL=get-model-info.d.ts.map