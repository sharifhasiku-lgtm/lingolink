export function getGlobalSingleton(key, create) {
    const global = globalThis;
    const existing = global[key];
    if (existing !== undefined) {
        return existing;
    }
    const value = create();
    global[key] = value;
    return value;
}
