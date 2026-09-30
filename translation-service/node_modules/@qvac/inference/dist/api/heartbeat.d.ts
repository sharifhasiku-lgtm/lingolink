import { type HeartbeatResponse } from '../schemas/index.js';
/**
 * Checks whether the local engine is responsive by sending a heartbeat
 * round-trip.
 *
 * @returns A promise that resolves to a heartbeat response.
 * @throws {QvacErrorBase} When the response is invalid.
 *
 * @example
 * await heartbeat();
 */
export declare function heartbeat(): Promise<HeartbeatResponse>;
