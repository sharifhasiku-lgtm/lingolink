import { type QvacConfig, type RuntimeContext } from '@qvac/inference/surface';
import type RPC from 'bare-rpc';
type InitConfigMessage = {
    type: '__init_config';
    config: QvacConfig;
    runtimeContext?: RuntimeContext;
};
export declare function isInitConfigMessage(data: unknown): data is InitConfigMessage;
export declare function handleInitConfig(req: RPC.IncomingRequest, data: InitConfigMessage): void;
type ShutdownMessage = {
    type: '__shutdown__';
};
export declare function isShutdownMessage(data: unknown): data is ShutdownMessage;
export declare function handleShutdown(req: RPC.IncomingRequest): Promise<void>;
export {};
//# sourceMappingURL=handler-utils.d.ts.map