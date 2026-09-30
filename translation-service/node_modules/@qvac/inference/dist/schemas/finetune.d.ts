import { z } from 'zod';
export declare const finetuneValidationSchema: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"none">;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"split">;
    fraction: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"dataset">;
    path: z.ZodString;
}, z.core.$strict>], "type">, z.ZodTransform<{
    type: "none";
} | {
    type: "dataset";
    path: string;
} | {
    fraction: number;
    type: "split";
}, {
    type: "none";
} | {
    type: "split";
    fraction?: number | undefined;
} | {
    type: "dataset";
    path: string;
}>>;
export declare const finetuneRunParamsSchema: z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    operation: z.ZodOptional<z.ZodEnum<{
        start: "start";
        resume: "resume";
    }>>;
}, z.core.$strict>;
export declare const finetuneGetStateParamsSchema: z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    operation: z.ZodLiteral<"getState">;
}, z.core.$strict>;
export declare const finetuneStopParamsSchema: z.ZodObject<{
    modelId: z.ZodString;
    operation: z.ZodEnum<{
        cancel: "cancel";
        pause: "pause";
    }>;
}, z.core.$strict>;
export declare const finetuneParamsSchema: z.ZodUnion<readonly [z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    operation: z.ZodOptional<z.ZodEnum<{
        start: "start";
        resume: "resume";
    }>>;
}, z.core.$strict>, z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    operation: z.ZodLiteral<"getState">;
}, z.core.$strict>, z.ZodObject<{
    modelId: z.ZodString;
    operation: z.ZodEnum<{
        cancel: "cancel";
        pause: "pause";
    }>;
}, z.core.$strict>]>;
export declare const finetuneRunRequestSchema: z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    type: z.ZodLiteral<"finetune">;
    operation: z.ZodOptional<z.ZodEnum<{
        start: "start";
        resume: "resume";
    }>>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const finetuneGetStateRequestSchema: z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    type: z.ZodLiteral<"finetune">;
    operation: z.ZodLiteral<"getState">;
}, z.core.$strict>;
export declare const finetuneStopRequestSchema: z.ZodObject<{
    modelId: z.ZodString;
    type: z.ZodLiteral<"finetune">;
    operation: z.ZodEnum<{
        cancel: "cancel";
        pause: "pause";
    }>;
}, z.core.$strict>;
export declare const finetuneRequestSchema: z.ZodUnion<readonly [z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    type: z.ZodLiteral<"finetune">;
    operation: z.ZodOptional<z.ZodEnum<{
        start: "start";
        resume: "resume";
    }>>;
    withProgress: z.ZodOptional<z.ZodBoolean>;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    modelId: z.ZodString;
    options: z.ZodObject<{
        trainDatasetDir: z.ZodString;
        validation: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"none">;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"split">;
            fraction: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"dataset">;
            path: z.ZodString;
        }, z.core.$strict>], "type">, z.ZodTransform<{
            type: "none";
        } | {
            type: "dataset";
            path: string;
        } | {
            fraction: number;
            type: "split";
        }, {
            type: "none";
        } | {
            type: "split";
            fraction?: number | undefined;
        } | {
            type: "dataset";
            path: string;
        }>>;
        outputParametersDir: z.ZodString;
        numberOfEpochs: z.ZodOptional<z.ZodNumber>;
        learningRate: z.ZodOptional<z.ZodNumber>;
        contextLength: z.ZodOptional<z.ZodNumber>;
        batchSize: z.ZodOptional<z.ZodNumber>;
        microBatchSize: z.ZodOptional<z.ZodNumber>;
        assistantLossOnly: z.ZodOptional<z.ZodBoolean>;
        loraRank: z.ZodOptional<z.ZodNumber>;
        loraAlpha: z.ZodOptional<z.ZodNumber>;
        loraInitStd: z.ZodOptional<z.ZodNumber>;
        loraSeed: z.ZodOptional<z.ZodNumber>;
        loraModules: z.ZodOptional<z.ZodString>;
        checkpointSaveDir: z.ZodOptional<z.ZodString>;
        checkpointSaveSteps: z.ZodOptional<z.ZodNumber>;
        chatTemplatePath: z.ZodOptional<z.ZodString>;
        lrScheduler: z.ZodOptional<z.ZodEnum<{
            constant: "constant";
            cosine: "cosine";
            linear: "linear";
        }>>;
        lrMin: z.ZodOptional<z.ZodNumber>;
        warmupRatio: z.ZodOptional<z.ZodNumber>;
        warmupRatioSet: z.ZodOptional<z.ZodBoolean>;
        warmupSteps: z.ZodOptional<z.ZodNumber>;
        warmupStepsSet: z.ZodOptional<z.ZodBoolean>;
        weightDecay: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    type: z.ZodLiteral<"finetune">;
    operation: z.ZodLiteral<"getState">;
}, z.core.$strict>, z.ZodObject<{
    modelId: z.ZodString;
    type: z.ZodLiteral<"finetune">;
    operation: z.ZodEnum<{
        cancel: "cancel";
        pause: "pause";
    }>;
}, z.core.$strict>]>;
export declare const finetuneStatusSchema: z.ZodEnum<{
    IDLE: "IDLE";
    RUNNING: "RUNNING";
    PAUSED: "PAUSED";
    CANCELLED: "CANCELLED";
    COMPLETED: "COMPLETED";
}>;
export declare const finetuneProgressSchema: z.ZodObject<{
    is_train: z.ZodBoolean;
    loss: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    loss_uncertainty: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    accuracy: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    accuracy_uncertainty: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    global_steps: z.ZodNumber;
    current_epoch: z.ZodNumber;
    current_batch: z.ZodNumber;
    total_batches: z.ZodNumber;
    elapsed_ms: z.ZodNumber;
    eta_ms: z.ZodNumber;
}, z.core.$strict>;
export declare const finetuneStatsSchema: z.ZodObject<{
    train_loss: z.ZodOptional<z.ZodNumber>;
    train_loss_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
    val_loss: z.ZodOptional<z.ZodNumber>;
    val_loss_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
    train_accuracy: z.ZodOptional<z.ZodNumber>;
    train_accuracy_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
    val_accuracy: z.ZodOptional<z.ZodNumber>;
    val_accuracy_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
    learning_rate: z.ZodOptional<z.ZodNumber>;
    global_steps: z.ZodNumber;
    epochs_completed: z.ZodNumber;
}, z.core.$strict>;
export declare const finetuneResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"finetune">;
    status: z.ZodEnum<{
        IDLE: "IDLE";
        RUNNING: "RUNNING";
        PAUSED: "PAUSED";
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
    }>;
    stats: z.ZodOptional<z.ZodObject<{
        train_loss: z.ZodOptional<z.ZodNumber>;
        train_loss_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
        val_loss: z.ZodOptional<z.ZodNumber>;
        val_loss_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
        train_accuracy: z.ZodOptional<z.ZodNumber>;
        train_accuracy_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
        val_accuracy: z.ZodOptional<z.ZodNumber>;
        val_accuracy_uncertainty: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>>;
        learning_rate: z.ZodOptional<z.ZodNumber>;
        global_steps: z.ZodNumber;
        epochs_completed: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const finetuneProgressResponseSchema: z.ZodObject<{
    is_train: z.ZodBoolean;
    loss: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    loss_uncertainty: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    accuracy: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    accuracy_uncertainty: z.ZodNullable<z.ZodUnion<readonly [z.ZodNumber, z.ZodNaN]>>;
    global_steps: z.ZodNumber;
    current_epoch: z.ZodNumber;
    current_batch: z.ZodNumber;
    total_batches: z.ZodNumber;
    elapsed_ms: z.ZodNumber;
    eta_ms: z.ZodNumber;
    type: z.ZodLiteral<"finetune:progress">;
    modelId: z.ZodString;
}, z.core.$strict>;
export type FinetuneValidation = z.input<typeof finetuneValidationSchema>;
export type FinetuneRunParams = z.input<typeof finetuneRunParamsSchema>;
export type FinetuneGetStateParams = z.input<typeof finetuneGetStateParamsSchema>;
export type FinetuneStopParams = z.infer<typeof finetuneStopParamsSchema>;
export type FinetuneParams = z.input<typeof finetuneParamsSchema>;
export type FinetuneRunRequest = z.infer<typeof finetuneRunRequestSchema>;
export type FinetuneGetStateRequest = z.infer<typeof finetuneGetStateRequestSchema>;
export type FinetuneStopRequest = z.infer<typeof finetuneStopRequestSchema>;
export type FinetuneRequest = z.infer<typeof finetuneRequestSchema>;
export type FinetuneStatus = z.infer<typeof finetuneStatusSchema>;
export type FinetuneProgress = z.infer<typeof finetuneProgressSchema>;
export type FinetuneStats = z.infer<typeof finetuneStatsSchema>;
export type FinetuneResult = z.infer<typeof finetuneResponseSchema>;
export type FinetuneProgressResponse = z.infer<typeof finetuneProgressResponseSchema>;
