import { type TranslateParams, type TranslationStats } from '../../schemas/index.js';
export declare function getLanguage(code: string | undefined): string;
export declare function isAfrican(code: string | undefined): boolean;
export declare function translate(params: TranslateParams, requestId?: string): AsyncGenerator<string, {
    modelExecutionMs: number;
    stats?: TranslationStats;
}, unknown>;
