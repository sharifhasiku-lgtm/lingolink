import RPC from 'bare-rpc';
export declare function getWorkerLifeSignal(): AbortSignal | null;
export declare function notifyChannelClosed(): void;
export declare function getRPC(): Promise<RPC>;
export declare function createDuplexSession(payload: string, commandId: number): Promise<{
    requestStream: RPC.OutgoingStream;
    responseStream: RPC.IncomingStream;
}>;
export declare function close(): Promise<void>;
//# sourceMappingURL=node-rpc-client.d.ts.map