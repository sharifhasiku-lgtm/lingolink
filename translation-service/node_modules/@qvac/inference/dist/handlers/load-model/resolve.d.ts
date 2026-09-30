import { type ModelProgressUpdate } from '../../schemas/index.js';
import type { ResolveResult, DownloadHooks, DownloadSecurityOptions } from './types.js';
import type { AbortSignal } from 'bare-abort-controller';
type ResolveMode = 'base' | 'stats';
export declare function resolveFallbackModel(fallbackSrc: string, expectedChecksum: string | undefined, progressCallback: ((progress: ModelProgressUpdate) => void) | undefined, mode: ResolveMode, signal: AbortSignal | undefined, hooks: DownloadHooks | undefined, security?: DownloadSecurityOptions): Promise<ResolveResult>;
export declare function resolveRegistryModel(params: {
    hasFallback: boolean;
    isKnownModel: boolean;
    downloadPrimary: () => Promise<ResolveResult>;
    resolveFallback: () => Promise<ResolveResult>;
    buildUnreachableError: (cause: unknown) => Error;
}): Promise<ResolveResult>;
export declare function resolveModelPath(modelSrc: unknown, progressCallback?: (progress: ModelProgressUpdate) => void, seed?: boolean, signal?: AbortSignal, hooks?: DownloadHooks, fallbackSrc?: string, security?: DownloadSecurityOptions): Promise<string>;
export declare function resolveModelPathWithStats(modelSrc: unknown, progressCallback?: (progress: ModelProgressUpdate) => void, seed?: boolean, signal?: AbortSignal, hooks?: DownloadHooks, fallbackSrc?: string, security?: DownloadSecurityOptions): Promise<ResolveResult>;
export {};
