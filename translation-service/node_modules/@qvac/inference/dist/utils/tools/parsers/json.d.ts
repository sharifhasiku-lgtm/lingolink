import type { Tool } from '../../../schemas/index.js';
import { type ParserResult } from '../shared.js';
export declare function parseGemmaFormat(text: string, tools: Tool[]): ParserResult;
export declare function parseLlamacppFormat(text: string, tools: Tool[]): ParserResult;
export declare function parseGenericFormat(text: string, tools: Tool[]): ParserResult;
