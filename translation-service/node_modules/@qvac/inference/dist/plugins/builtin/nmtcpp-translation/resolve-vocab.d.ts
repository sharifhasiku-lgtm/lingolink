import { type ModelSrcInput, type NmtConfig, type ResolveContext, type ResolveResult } from '../../../schemas/index.js';
export interface PivotModelConfig {
    modelSrc: string;
    srcVocabSrc?: ModelSrcInput;
    dstVocabSrc?: ModelSrcInput;
}
export declare function buildBergamotVocabSources(basePath: string, langPair: string): {
    srcVocabSrc: string;
    dstVocabSrc: string;
};
export declare function deriveBergamotVocabSources(modelSrc: string): {
    srcVocabSrc: string;
    dstVocabSrc: string;
} | null;
export declare function deriveBergamotRegistryVocabSources(modelSrc: string): {
    srcVocabSrc: string;
    dstVocabSrc: string;
} | null;
/**
 * Resolves Bergamot vocab sources to absolute filesystem paths via the
 * resolver context, optionally including a pivot model.
 *
 * For `registry://` sources with auto-derived vocabs, this skips per-vocab
 * resolution because the companion-set download already colocates the vocabs
 * next to the primary model under `sets/<setKey>/`. `createModel` then derives
 * the colocated paths via `deriveColocatedBergamotVocabPaths`. This avoids a
 * redundant flat-cache copy and sidesteps the dedup edge case in QVAC-18420
 * where two directions of a bidirectional pair ship the same vocab blob under
 * distinct registry paths and only one survives sha256 dedup.
 */
export declare function resolveBergamotVocab(nmtConfig: NmtConfig, ctx: ResolveContext, srcVocabSrc: ModelSrcInput | undefined, dstVocabSrc: ModelSrcInput | undefined, pivotModel?: PivotModelConfig): Promise<ResolveResult<Record<string, unknown>>>;
