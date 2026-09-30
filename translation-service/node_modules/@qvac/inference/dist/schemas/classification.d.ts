import { z } from 'zod';
export declare const classificationConfigSchema: z.ZodObject<{
    modelPath: z.ZodOptional<z.ZodString>;
    topK: z.ZodOptional<z.ZodNumber>;
    nativeLogger: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const classifyParamsSchema: z.ZodObject<{
    modelId: z.ZodString;
    image: z.ZodString;
    topK: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    channels: z.ZodOptional<z.ZodLiteral<3>>;
}, z.core.$strip>;
export declare const classifyRequestSchema: z.ZodObject<{
    modelId: z.ZodString;
    image: z.ZodString;
    topK: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    channels: z.ZodOptional<z.ZodLiteral<3>>;
    type: z.ZodLiteral<"classify">;
}, z.core.$strip>;
export declare const classificationResultSchema: z.ZodObject<{
    label: z.ZodString;
    confidence: z.ZodNumber;
}, z.core.$strip>;
export declare const classifyResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"classify">;
    results: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        confidence: z.ZodNumber;
    }, z.core.$strip>>;
    done: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ClassificationConfig = z.infer<typeof classificationConfigSchema>;
export type ClassifyParams = z.infer<typeof classifyParamsSchema>;
export type ClassifyRequest = z.infer<typeof classifyRequestSchema>;
export type ClassificationResult = z.infer<typeof classificationResultSchema>;
export type ClassifyResponse = z.infer<typeof classifyResponseSchema>;
export interface ClassifyClientParams {
    modelId: string;
    /** JPEG or PNG buffer. */
    image: Uint8Array;
    topK?: number;
    /** Raw RGB image width (required for raw bytes). */
    width?: number;
    /** Raw RGB image height (required for raw bytes). */
    height?: number;
    /** Channel count — must be 3 for raw RGB. */
    channels?: 3;
}
