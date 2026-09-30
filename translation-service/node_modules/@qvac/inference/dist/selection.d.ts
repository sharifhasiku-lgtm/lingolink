import type { Request } from './schemas/index.js';
import type { HandlerEntry } from './handlers/types.js';
export declare function selectHandler(entry: HandlerEntry): HandlerEntry['handler'];
export declare function handlerSupportsProgress(entry: HandlerEntry, request: Request): boolean;
