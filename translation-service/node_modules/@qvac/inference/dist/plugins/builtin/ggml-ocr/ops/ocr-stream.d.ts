import { type OCRParams, type OCRTextBlock, type OCRStats } from '../../../../schemas/index.js';
export declare function ocr(params: OCRParams): AsyncGenerator<{
    blocks: OCRTextBlock[];
}, {
    modelExecutionMs: number;
    stats?: OCRStats;
}, void>;
