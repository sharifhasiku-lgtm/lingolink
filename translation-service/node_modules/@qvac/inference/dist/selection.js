export function selectHandler(entry) {
    return entry.handler;
}
export function handlerSupportsProgress(entry, request) {
    return !!('withProgress' in request &&
        request.withProgress &&
        (typeof entry.supportsProgress === 'function'
            ? entry.supportsProgress(request)
            : entry.supportsProgress));
}
