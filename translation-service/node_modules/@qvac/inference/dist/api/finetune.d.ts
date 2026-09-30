import { type FinetuneGetStateParams, type FinetuneProgress, type FinetuneResult, type FinetuneRunParams, type FinetuneStopParams, type RPCOptions } from '../schemas/index.js';
export interface FinetuneHandle {
    progressStream: AsyncGenerator<FinetuneProgress>;
    result: Promise<FinetuneResult>;
}
type FinetuneReplyParams = FinetuneStopParams | FinetuneGetStateParams;
/**
 * Starts, resumes, inspects, pauses, or cancels a finetuning job for a loaded model.
 *
 * @param params - The finetuning parameters
 * @param params.modelId - The identifier of the loaded model to finetune
 * @param params.operation - The finetuning operation. Omit it to let the add-on
 *   choose whether to start fresh or resume automatically
 * @param params.options - Finetuning options for run and `getState` operations
 * @param params.options.trainDatasetDir - Directory containing the training dataset
 * @param params.options.validation - Validation configuration for the finetuning run
 * @param params.options.outputParametersDir - Directory where output adapter parameters are written
 * @param params.options.numberOfEpochs - Optional number of epochs to run
 * @param params.options.learningRate - Optional learning rate override
 * @param params.options.contextLength - Optional context length override
 * @param params.options.batchSize - Optional batch size override
 * @param params.options.microBatchSize - Optional micro batch size override
 * @param params.options.assistantLossOnly - Optional flag to compute loss only on assistant tokens
 * @param params.options.loraRank - Optional LoRA rank override
 * @param params.options.loraAlpha - Optional LoRA alpha override
 * @param params.options.loraInitStd - Optional LoRA initialization standard deviation
 * @param params.options.loraSeed - Optional LoRA initialization seed
 * @param params.options.loraModules - Optional comma-separated LoRA module selection
 * @param params.options.checkpointSaveDir - Optional directory for checkpoint snapshots
 * @param params.options.checkpointSaveSteps - Optional checkpoint save interval
 * @param params.options.chatTemplatePath - Optional custom chat template path
 * @param params.options.lrScheduler - Optional learning rate scheduler
 * @param params.options.lrMin - Optional minimum learning rate
 * @param params.options.warmupRatio - Optional warmup ratio
 * @param params.options.warmupRatioSet - Optional flag to enable warmup ratio
 * @param params.options.warmupSteps - Optional warmup step count
 * @param params.options.warmupStepsSet - Optional flag to enable explicit warmup steps
 * @param params.options.weightDecay - Optional weight decay override
 * @param rpcOptions - Optional RPC transport options
 * @returns For omitted-operation runs, `start`, and `resume`, returns a handle
 *   with a `progressStream` generator and a terminal `result` promise. For
 *   `getState`, `pause`, and `cancel`, returns a promise that resolves to the
 *   current finetune state/result.
 * @example
 * ```typescript
 * const handle = finetune({
 *   modelId,
 *   options: {
 *     trainDatasetDir: "./dataset/train",
 *     validation: { type: "split", fraction: 0.05 },
 *     outputParametersDir: "./artifacts/lora",
 *     numberOfEpochs: 2,
 *   },
 * });
 *
 * for await (const progress of handle.progressStream) {
 *   console.log(progress.global_steps, progress.loss);
 * }
 *
 * console.log(await handle.result);
 *
 * const pauseResult = await finetune({ modelId, operation: "pause" });
 * console.log(pauseResult.status);
 * ```
 */
/**
 * Run / start / resume a finetune job. Returns a handle with a streaming
 * `progressStream` and a terminal `result` promise.
 *
 * @overloadLabel "Run / start / resume"
 * @param params - The finetuning run parameters (see the function-level
 *   docs for the full breakdown of `params.options`).
 * @param rpcOptions - Optional RPC transport options.
 * @returns A `FinetuneHandle` with `progressStream` (yields per-step loss
 *   metrics) and `result` (resolves once the run terminates).
 */
export declare function finetune(params: FinetuneRunParams, rpcOptions?: RPCOptions): FinetuneHandle;
/**
 * Stop / pause / cancel an in-flight finetune, or query its current state.
 *
 * @overloadLabel "Stop / getState / pause / cancel"
 * @param params - Finetune control parameters; `params.operation` selects
 *   `pause`, `cancel`, or `getState`.
 * @param rpcOptions - Optional RPC transport options.
 * @returns A promise that resolves to the current `FinetuneResult`
 *   (status + last-known progress).
 */
export declare function finetune(params: FinetuneReplyParams, rpcOptions?: RPCOptions): Promise<FinetuneResult>;
export {};
