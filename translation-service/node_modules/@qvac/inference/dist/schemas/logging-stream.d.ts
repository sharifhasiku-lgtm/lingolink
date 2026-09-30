import { z } from 'zod';
export declare const logLevelSchema: z.ZodEnum<{
    error: "error";
    off: "off";
    warn: "warn";
    info: "info";
    debug: "debug";
}>;
declare const loggingParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const loggingStreamRequestSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"loggingStream">;
}, z.core.$strip>;
export declare const loggingStreamResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"loggingStream">;
    id: z.ZodString;
    level: z.ZodEnum<{
        error: "error";
        off: "off";
        warn: "warn";
        info: "info";
        debug: "debug";
    }>;
    namespace: z.ZodString;
    message: z.ZodString;
    timestamp: z.ZodNumber;
}, z.core.$strip>;
export type LoggingParams = z.infer<typeof loggingParamsSchema>;
export type LoggingStreamRequest = z.infer<typeof loggingStreamRequestSchema>;
export type LoggingStreamResponse = z.infer<typeof loggingStreamResponseSchema>;
export {};
