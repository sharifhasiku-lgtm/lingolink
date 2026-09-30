/**
 * Millisecond clock for profiling durations. Bare has no monotonic clock
 * global, so this uses `Date.now` — ample resolution for inference timing.
 */
const startMs = Date.now();
export function nowMs() {
    return Date.now() - startMs;
}
export async function measureAsync(fn) {
    const start = nowMs();
    const result = await fn();
    return [result, nowMs() - start];
}
export function measureSync(fn) {
    const start = nowMs();
    const result = fn();
    return [result, nowMs() - start];
}
export function generateProfileId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}
