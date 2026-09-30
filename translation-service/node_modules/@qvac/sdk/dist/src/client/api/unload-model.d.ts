import { type UnloadModelParams } from '@qvac/inference/surface';
/**
 * Unloads a previously loaded model from the server.
 *
 * When the last model is unloaded (no more models remain), this function
 * automatically closes the RPC connection on Node/Electron, allowing the
 * process to exit naturally without requiring manual cleanup. On Bare the
 * connection is left open by default so long-lived workers survive a routine
 * unload; pass `autoClose: true` to opt in to closing.
 *
 * @param params - The parameters for unloading the model
 * @param params.modelId - The unique identifier of the model to unload
 * @param params.clearStorage - Whether to clear the storage for the model
 * @param params.autoClose - Override the runtime-default auto-close behavior
 * @throws {QvacErrorBase} When the response type is invalid or when the unload operation fails
 */
export declare function unloadModel(params: UnloadModelParams): Promise<void>;
//# sourceMappingURL=unload-model.d.ts.map