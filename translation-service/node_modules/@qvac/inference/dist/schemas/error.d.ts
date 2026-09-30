import { z } from 'zod';
/**
 * Serialized shape for errors that cross a response boundary — an RPC
 * reply over `bare-rpc`, or a duplex stream.
 * The fields are the union of (a) the `QvacErrorBase` serialisation
 * (`name`, `code`, `message`, `stack`, `cause`, `timestamp`) and (b) the
 * `typedFields` map carrying per-class structured data a receiver uses
 * to rebuild the original typed error.
 *
 * `typedFields` is opaque in transit — `z.unknown()` — and a receiver
 * casts each member at the boundary. The single-map shape keeps the
 * schema compact regardless of how many typed-error classes we
 * surface. A new typed-error class that needs reconstruction adds a
 * `toErrorResponseFields()` method; the schema itself doesn't change.
 */
export declare const errorResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"error">;
    message: z.ZodString;
    stack: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodNumber>;
    cause: z.ZodOptional<z.ZodUnknown>;
    typedFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
/**
 * A `QvacErrorBase` subclass that opts into typed-field serialisation.
 * The method returns the subset of own properties a receiver needs to
 * rebuild the original class with its named constructor arguments
 * populated.
 *
 * Co-located with each class (see `errors/index.ts`) so adding a new
 * typed error that survives serialisation is a two-step change: define
 * the class and implement the method.
 */
export interface TypedErrorSerializer {
    toErrorResponseFields(): Record<string, unknown>;
}
export declare function createErrorResponse(error: unknown): ErrorResponse;
