import { type CollectDiagnostics, type NativeAddon } from './addon-source.js';
export declare class InvalidNodeModulesSourceError extends Error {
    nodeModulesPath: string;
    constructor(nodeModulesPath: string, cause: unknown);
}
export interface CollectAddonsFromNodeModulesOptions {
    nodeModulesRoot: string;
    diagnostics?: CollectDiagnostics;
}
export declare function collectAddonsFromNodeModules(options: CollectAddonsFromNodeModulesOptions): Promise<NativeAddon[]>;
//# sourceMappingURL=node-modules-source.d.ts.map