export function createErrorOptions(code, adds, cause) {
    const options = { code };
    if (adds !== undefined) {
        options.adds = adds;
    }
    if (cause !== undefined) {
        options.cause =
            cause instanceof Error
                ? cause
                : new Error(typeof cause === 'string' ? cause : JSON.stringify(cause));
    }
    return options;
}
