import { type OCRConfig, type ResolveContext, type ResolveResult } from '../../../schemas/index.js';
type OcrPipelineType = NonNullable<OCRConfig['pipelineType']>;
export declare const DETECTOR_FILENAMES: Record<OcrPipelineType, string>;
export declare function resolveOcrConfig(cfg: OCRConfig, ctx: ResolveContext): Promise<ResolveResult<Record<string, unknown>, 'detectorModelPath'>>;
export {};
