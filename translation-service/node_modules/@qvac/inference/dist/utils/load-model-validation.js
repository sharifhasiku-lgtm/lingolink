import { inferModelTypeFromModelSrc } from '../schemas/model-src-utils.js';
import { normalizeModelType } from '../schemas/model-types.js';
import { ModelSrcTypeMismatchError } from '../errors/index.js';
/**
 * Throws {@link ModelSrcTypeMismatchError} when explicit
 * `modelType` disagrees with the type inferred from `modelSrc`.
 * No-op when nothing can be inferred.
 */
export function assertModelSrcMatchesModelType(modelSrc, explicitModelType) {
    const inferred = inferModelTypeFromModelSrc(modelSrc);
    if (!inferred)
        return;
    const normalizedInferred = normalizeModelType(inferred);
    const normalizedExplicit = normalizeModelType(explicitModelType);
    if (normalizedInferred !== normalizedExplicit) {
        throw new ModelSrcTypeMismatchError(normalizedInferred, normalizedExplicit);
    }
}
