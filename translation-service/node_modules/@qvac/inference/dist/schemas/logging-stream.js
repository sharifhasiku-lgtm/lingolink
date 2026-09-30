import { z } from 'zod';
const logLevelValues = ['error', 'warn', 'info', 'debug', 'off'];
export const logLevelSchema = z.enum(logLevelValues);
const loggingParamsSchema = z.object({
    id: z.string()
});
export const loggingStreamRequestSchema = loggingParamsSchema.extend({
    type: z.literal('loggingStream')
});
export const loggingStreamResponseSchema = z.object({
    type: z.literal('loggingStream'),
    id: z.string(),
    level: logLevelSchema,
    namespace: z.string(),
    message: z.string(),
    timestamp: z.number()
});
