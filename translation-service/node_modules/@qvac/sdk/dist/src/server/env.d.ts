/**
 * Initialize the worker environment. Call once at worker startup.
 * Returns whether RPC config was parsed from arguments.
 */
export declare function initEnv(): {
    hasRPCConfig: boolean;
};
/**
 * Get the worker environment. Must call initEnv() first.
 */
export declare function getEnv(): {
    HOME_DIR: string;
    QVAC_IPC_SOCKET_PATH?: string | undefined;
};
/**
 * Get the validated env config. Must call initEnv() first.
 */
export declare function getValidatedEnv(): {
    HOME_DIR: string;
    QVAC_IPC_SOCKET_PATH?: string | undefined;
};
//# sourceMappingURL=env.d.ts.map