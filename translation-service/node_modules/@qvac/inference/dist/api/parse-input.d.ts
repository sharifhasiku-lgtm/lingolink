import { z } from 'zod';
export declare function parseClientInput<S extends z.ZodType>(schema: S, value: unknown): z.output<S>;
