export async function resolveBciConfig(cfg, ctx) {
    const { embedderModelSrc, ...bciConfig } = cfg;
    if (!embedderModelSrc) {
        return { config: bciConfig };
    }
    const embedderPath = await ctx.resolveModelPath(embedderModelSrc);
    return {
        config: bciConfig,
        artifacts: { embedderPath }
    };
}
