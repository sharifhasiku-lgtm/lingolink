export function mapValues(obj, fn) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value, key)]));
}
