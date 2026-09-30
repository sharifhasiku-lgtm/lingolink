import { z } from 'zod';
// ============== Delete cache ==============
export const deleteCacheRequestSchema = z.union([
    z
        .object({
        type: z.literal('deleteCache'),
        all: z.literal(true)
    })
        .meta({ title: 'DeleteCacheAllRequest' }),
    z
        .object({
        type: z.literal('deleteCache'),
        auto: z.literal(true)
    })
        .meta({ title: 'DeleteCacheAutoRequest' }),
    z
        .object({
        type: z.literal('deleteCache'),
        kvCacheKey: z.string(),
        modelId: z.string().optional()
    })
        .meta({ title: 'DeleteCacheKvEntryRequest' })
]);
export const deleteCacheResponseSchema = z.object({
    type: z.literal('deleteCache'),
    success: z.boolean(),
    error: z.string().optional()
});
// ============== Unload model ==============
export const unloadModelParamsSchema = z.object({
    modelId: z.string(),
    clearStorage: z.boolean().default(false),
    autoClose: z.boolean().optional()
});
export const unloadModelRequestSchema = z.object({
    type: z.literal('unloadModel'),
    modelId: z.string(),
    clearStorage: z.boolean().default(false)
});
export const unloadModelResponseSchema = z.object({
    type: z.literal('unloadModel'),
    success: z.boolean(),
    error: z.string().optional(),
    hasActiveModels: z.boolean().optional()
});
