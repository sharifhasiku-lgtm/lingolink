import { z } from 'zod';
export function formatZodError(error) {
    return z.prettifyError(error);
}
