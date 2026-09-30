import { z } from 'zod';
import type { NmtLanguage } from './translation-config.js';
import { type NmtModelTypeInput, type LlmModelTypeInput } from './model-types.js';
declare const translateParamsSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    modelId: z.ZodString;
    text: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    stream: z.ZodBoolean;
    modelType: z.ZodEnum<{
        "nmtcpp-translation": "nmtcpp-translation";
        nmt: "nmt";
    }>;
}, z.core.$strip>, z.ZodObject<{
    modelId: z.ZodString;
    text: z.ZodString;
    stream: z.ZodBoolean;
    modelType: z.ZodEnum<{
        "llamacpp-completion": "llamacpp-completion";
        llm: "llm";
    }>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "modelType">;
export declare const translationStatsSchema: z.ZodObject<{
    totalTime: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    tokensPerSecond: z.ZodOptional<z.ZodNumber>;
    timeToFirstToken: z.ZodOptional<z.ZodNumber>;
    decodeTime: z.ZodOptional<z.ZodNumber>;
    encodeTime: z.ZodOptional<z.ZodNumber>;
    cacheTokens: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const translateRequestSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    modelId: z.ZodString;
    text: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    stream: z.ZodBoolean;
    modelType: z.ZodEnum<{
        "nmtcpp-translation": "nmtcpp-translation";
        nmt: "nmt";
    }>;
    type: z.ZodLiteral<"translate">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    modelId: z.ZodString;
    text: z.ZodString;
    stream: z.ZodBoolean;
    modelType: z.ZodEnum<{
        "llamacpp-completion": "llamacpp-completion";
        llm: "llm";
    }>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"translate">;
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "modelType">;
export declare const translateServerParamsSchema: z.ZodPipe<z.ZodDiscriminatedUnion<[z.ZodObject<{
    modelId: z.ZodString;
    text: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    stream: z.ZodBoolean;
    modelType: z.ZodEnum<{
        "nmtcpp-translation": "nmtcpp-translation";
        nmt: "nmt";
    }>;
}, z.core.$strip>, z.ZodObject<{
    modelId: z.ZodString;
    text: z.ZodString;
    stream: z.ZodBoolean;
    modelType: z.ZodEnum<{
        "llamacpp-completion": "llamacpp-completion";
        llm: "llm";
    }>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "modelType">, z.ZodTransform<{
    modelType: string;
    modelId: string;
    text: string | string[];
    stream: boolean;
} | {
    modelType: string;
    modelId: string;
    text: string;
    stream: boolean;
    to: string;
    from?: string | undefined;
    context?: string | undefined;
}, {
    modelId: string;
    text: string | string[];
    stream: boolean;
    modelType: "nmtcpp-translation" | "nmt";
} | {
    modelId: string;
    text: string;
    stream: boolean;
    modelType: "llamacpp-completion" | "llm";
    to: string;
    from?: string | undefined;
    context?: string | undefined;
}>>;
export declare const translateResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"translate">;
    token: z.ZodString;
    done: z.ZodOptional<z.ZodBoolean>;
    stats: z.ZodOptional<z.ZodObject<{
        totalTime: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        tokensPerSecond: z.ZodOptional<z.ZodNumber>;
        timeToFirstToken: z.ZodOptional<z.ZodNumber>;
        decodeTime: z.ZodOptional<z.ZodNumber>;
        encodeTime: z.ZodOptional<z.ZodNumber>;
        cacheTokens: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TranslateParams = z.infer<typeof translateParamsSchema>;
export type TranslateRequest = z.infer<typeof translateRequestSchema>;
export type TranslateResponse = z.infer<typeof translateResponseSchema>;
export type TranslationStats = z.infer<typeof translationStatsSchema>;
type TranslateParamsNmt = {
    modelId: string;
    text: string | string[];
    stream: boolean;
    modelType: NmtModelTypeInput;
};
type TranslateParamsLlm = {
    modelId: string;
    text: string;
    stream: boolean;
    modelType: LlmModelTypeInput;
    from?: NmtLanguage | (string & {});
    to: NmtLanguage | (string & {});
    context?: string;
};
export type TranslateClientParams = TranslateParamsNmt | TranslateParamsLlm;
export {};
