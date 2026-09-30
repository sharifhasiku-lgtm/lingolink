/**
 * Initialize the environment. Call once at startup.
 */
export declare function initEnv(): void;
/**
 * Get the engine environment. Must call initEnv() first.
 */
export declare function getEnv(): {
    HOME_DIR: string;
};
/**
 * Get the validated env config. Must call initEnv() first.
 */
export declare function getValidatedEnv(): {
    HOME_DIR: string;
};
