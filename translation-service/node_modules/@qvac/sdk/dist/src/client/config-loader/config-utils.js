import { qvacConfigSchema } from '@qvac/inference/surface';
import { ConfigValidationFailedError } from '../../utils/errors-client.js';
import { formatZodError } from '../../utils/zod-error.js';
export function validateConfig(config) {
    const result = qvacConfigSchema.safeParse(config);
    if (!result.success) {
        throw new ConfigValidationFailedError(formatZodError(result.error));
    }
    return result.data;
}
export function parseJsonConfig(content, filePath) {
    try {
        return JSON.parse(content);
    }
    catch {
        throw new ConfigValidationFailedError(`Invalid JSON in config file: ${filePath}`);
    }
}
