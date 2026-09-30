import { type HeartbeatResponse } from '@qvac/inference/surface';
/**
 * Checks whether the local SDK worker is responsive by sending a heartbeat
 * round-trip.
 *
 * @returns A promise that resolves to a heartbeat response.
 * @throws {QvacErrorBase} When the response is invalid.
 *
 * @example
 * await heartbeat();
 */
export declare function heartbeat(): Promise<HeartbeatResponse>;
//# sourceMappingURL=heartbeat.d.ts.map