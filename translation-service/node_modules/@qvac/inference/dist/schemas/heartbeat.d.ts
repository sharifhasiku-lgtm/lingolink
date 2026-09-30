import { z } from 'zod';
export declare const heartbeatRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"heartbeat">;
}, z.core.$strip>;
export declare const heartbeatResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"heartbeat">;
    number: z.ZodNumber;
}, z.core.$strip>;
export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;
export type HeartbeatResponse = z.infer<typeof heartbeatResponseSchema>;
