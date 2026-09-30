import { z } from 'zod';
export const heartbeatRequestSchema = z.object({
    type: z.literal('heartbeat')
});
export const heartbeatResponseSchema = z.object({
    type: z.literal('heartbeat'),
    number: z.number()
});
