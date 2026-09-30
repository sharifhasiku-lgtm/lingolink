import { type UnloadModelParams } from '../schemas/index.js';
/**
 * Unloads a previously loaded model from the engine.
 *
 * When the last model is unloaded (no more models remain), this function can
 * automatically tear the engine down so the process can exit without manual
 * cleanup. On Bare the engine is left running by default so a long-lived
 * process survives a routine unload; pass `autoClose: true` to opt in to
 * closing.
 *
 * @param params - The parameters for unloading the model
 * @param params.modelId - The unique identifier of the model to unload
 * @param params.clearStorage - Whether to clear the storage for the model
 * @param params.autoClose - Override the runtime-default auto-close behavior
 * @throws {QvacErrorBase} When the response type is invalid or when the unload operation fails
 */
export declare function unloadModel(params: UnloadModelParams): Promise<void>;
