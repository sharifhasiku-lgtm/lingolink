import { z } from 'zod';
export declare const suspendRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"suspend">;
}, z.core.$strip>;
export declare const suspendResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"suspend">;
}, z.core.$strip>;
export declare const resumeRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"resume">;
}, z.core.$strip>;
export declare const resumeResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"resume">;
}, z.core.$strip>;
export declare const lifecycleStateSchema: z.ZodEnum<{
    active: "active";
    suspending: "suspending";
    suspended: "suspended";
    resuming: "resuming";
}>;
export declare const stateRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"state">;
}, z.core.$strip>;
export declare const stateResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"state">;
    state: z.ZodEnum<{
        active: "active";
        suspending: "suspending";
        suspended: "suspended";
        resuming: "resuming";
    }>;
}, z.core.$strip>;
export type SuspendRequest = z.infer<typeof suspendRequestSchema>;
export type SuspendResponse = z.infer<typeof suspendResponseSchema>;
export type ResumeRequest = z.infer<typeof resumeRequestSchema>;
export type ResumeResponse = z.infer<typeof resumeResponseSchema>;
export type LifecycleState = z.infer<typeof lifecycleStateSchema>;
export type StateRequest = z.infer<typeof stateRequestSchema>;
export type StateResponse = z.infer<typeof stateResponseSchema>;
