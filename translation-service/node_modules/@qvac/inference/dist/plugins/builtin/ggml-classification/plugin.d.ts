import { type CreateModelParams, type PluginModelResult } from '../../../schemas/index.js';
export declare const classificationPlugin: {
    modelType: "ggml-classification";
    displayName: string;
    addonPackage: "@qvac/classification-ggml";
    loadConfigSchema: import("zod").ZodObject<{
        modelPath: import("zod").ZodOptional<import("zod").ZodString>;
        topK: import("zod").ZodOptional<import("zod").ZodNumber>;
        nativeLogger: import("zod").ZodOptional<import("zod").ZodBoolean>;
    }, import("zod/v4/core").$strip>;
    skipPrimaryModelPathValidation: true;
    createModel(params: CreateModelParams): PluginModelResult;
    handlers: {
        classify: import("../../../schemas/index.js").PluginHandlerDefinition<import("zod").ZodObject<{
            modelId: import("zod").ZodString;
            image: import("zod").ZodString;
            topK: import("zod").ZodOptional<import("zod").ZodNumber>;
            width: import("zod").ZodOptional<import("zod").ZodNumber>;
            height: import("zod").ZodOptional<import("zod").ZodNumber>;
            channels: import("zod").ZodOptional<import("zod").ZodLiteral<3>>;
            type: import("zod").ZodLiteral<"classify">;
        }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
            type: import("zod").ZodLiteral<"classify">;
            results: import("zod").ZodArray<import("zod").ZodObject<{
                label: import("zod").ZodString;
                confidence: import("zod").ZodNumber;
            }, import("zod/v4/core").$strip>>;
            done: import("zod").ZodOptional<import("zod").ZodBoolean>;
        }, import("zod/v4/core").$strip>>;
    };
};
