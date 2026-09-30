/**
 * O(1) bounded buffer for event storage.
 * Oldest events are overwritten when full.
 */
export interface RingBufferState<T> {
    buffer: (T | undefined)[];
    capacity: number;
    head: number;
    size: number;
    totalPushed: number;
}
export declare function createRingBuffer<T>(capacity: number): RingBufferState<T>;
export declare function ringBufferPush<T>(state: RingBufferState<T>, item: T): T | undefined;
export declare function ringBufferToArray<T>(state: RingBufferState<T>): T[];
export declare function ringBufferGetRecent<T>(state: RingBufferState<T>, count: number): T[];
export declare function ringBufferClear<T>(state: RingBufferState<T>): void;
export declare function ringBufferDroppedCount<T>(state: RingBufferState<T>): number;
export declare function ringBufferResize<T>(state: RingBufferState<T>, newCapacity: number): RingBufferState<T>;
