import { z } from 'zod';
import { formatZodError } from '../utils/zod-error.js';
import { RequestValidationFailedError } from '../utils/errors-client.js';
export function parseClientInput(schema, value) {
    try {
        return schema.parse(value);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new RequestValidationFailedError(formatZodError(error));
        }
        throw error;
    }
}
