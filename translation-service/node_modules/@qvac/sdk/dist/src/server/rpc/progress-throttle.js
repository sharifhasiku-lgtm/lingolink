export const PROGRESS_THROTTLE_MS = 150;
export const PROGRESS_MAX_PENDING = 100;
export function createProgressThrottle(writeBatch, clock = Date.now, throttleMs = PROGRESS_THROTTLE_MS, maxPending = PROGRESS_MAX_PENDING) {
    let lastWrite = 0;
    let pending = [];
    let flushTimer = null;
    function flushPending() {
        if (pending.length === 0)
            return;
        lastWrite = clock();
        const batch = pending;
        pending = [];
        writeBatch(batch);
    }
    function push(update) {
        const now = clock();
        if (now - lastWrite >= throttleMs) {
            lastWrite = now;
            writeBatch([update]);
        }
        else {
            pending.push(update);
            if (pending.length >= maxPending) {
                if (flushTimer) {
                    clearTimeout(flushTimer);
                    flushTimer = null;
                }
                flushPending();
                return;
            }
            if (!flushTimer) {
                flushTimer = setTimeout(() => {
                    flushTimer = null;
                    flushPending();
                }, throttleMs - (now - lastWrite));
            }
        }
    }
    function flush() {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
        flushPending();
    }
    return { push, flush };
}
