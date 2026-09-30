import type { ProfilingEventKind } from './types.js';
import type { ServerBreakdown } from '../schemas/index.js';
export interface BaseTimings {
    profileId: string;
    requestType: string;
    requestStart: number;
}
export interface BaseEvent {
    ts: number;
    op: string;
    kind: ProfilingEventKind;
    profileId: string;
}
export declare function recordPhase(base: BaseEvent, phase: string, ms?: number, extra?: {
    count?: number;
}): void;
export declare function recordFailure(base: BaseEvent, startTime: number, error: unknown): void;
export declare function recordServerBreakdownPhases(base: BaseEvent, server: ServerBreakdown, prefix?: string): void;
