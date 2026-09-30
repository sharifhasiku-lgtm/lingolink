export function buildBciWhispercppArgs(modelPath, embedderPath, logger) {
    const args = {
        files: {
            model: modelPath,
            ...(embedderPath ? { embedder: embedderPath } : {})
        },
        logger,
        opts: {
            stats: true
        }
    };
    return args;
}
