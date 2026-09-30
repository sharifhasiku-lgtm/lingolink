import type { ModelProgressUpdate } from '../../schemas/index.js';
import type { RegistryItem } from '../../models/registry/index.js';
import type { AbortSignal } from 'bare-abort-controller';
import type { DownloadHooks } from './types.js';
type CompanionSetMetadata = NonNullable<RegistryItem['companionSet']>;
export interface DownloadCompanionSetOptions {
    companionSet: CompanionSetMetadata;
    downloadKey: string;
    allowLegacyFlatCache?: boolean | undefined;
    progressCallback?: ((progress: ModelProgressUpdate) => void) | undefined;
    signal?: AbortSignal | undefined;
    hooks?: DownloadHooks | undefined;
    shouldClearCache?: (() => boolean) | undefined;
}
/**
 * Download a companion set from the registry, placing files directly
 * into their canonical layout at `sets/<setKey>/<targetName>`.
 *
 * Returns the path to the primary file.
 */
export declare function downloadCompanionSetFromRegistry(options: DownloadCompanionSetOptions): Promise<string>;
export {};
