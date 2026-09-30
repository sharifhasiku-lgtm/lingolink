import { z } from 'zod';
export const suspendRequestSchema = z.object({
    type: z.literal('suspend')
});
export const suspendResponseSchema = z.object({
    type: z.literal('suspend')
});
export const resumeRequestSchema = z.object({
    type: z.literal('resume')
});
export const resumeResponseSchema = z.object({
    type: z.literal('resume')
});
export const lifecycleStateSchema = z.enum(['active', 'suspending', 'suspended', 'resuming']);
export const stateRequestSchema = z.object({
    type: z.literal('state')
});
export const stateResponseSchema = z.object({
    type: z.literal('state'),
    state: lifecycleStateSchema
});
