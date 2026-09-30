import { z } from 'zod';
export declare const deleteCacheRequestSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"deleteCache">;
    all: z.ZodLiteral<true>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"deleteCache">;
    auto: z.ZodLiteral<true>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"deleteCache">;
    kvCacheKey: z.ZodString;
    modelId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>]>;
export declare const deleteCacheResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"deleteCache">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DeleteCacheRequest = z.infer<typeof deleteCacheRequestSchema>;
export type DeleteCacheResponse = z.infer<typeof deleteCacheResponseSchema>;
export declare const unloadModelParamsSchema: z.ZodObject<{
    modelId: z.ZodString;
    clearStorage: z.ZodDefault<z.ZodBoolean>;
    autoClose: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const unloadModelRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"unloadModel">;
    modelId: z.ZodString;
    clearStorage: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const unloadModelResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"unloadModel">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    hasActiveModels: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type UnloadModelParams = z.input<typeof unloadModelParamsSchema>;
export type UnloadModelRequest = z.infer<typeof unloadModelRequestSchema>;
export type UnloadModelResponse = z.infer<typeof unloadModelResponseSchema>;
