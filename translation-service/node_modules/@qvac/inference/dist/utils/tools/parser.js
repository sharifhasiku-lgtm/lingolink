import { stripThinkingBlocks } from './shared.js';
import { parseGemmaFormat, parseGenericFormat, parseLlamacppFormat } from './parsers/json.js';
import { parseHermesFormat } from './parsers/hermes.js';
import { parsePythonicFormat } from './parsers/pythonic.js';
import { parseHarmonyFormat } from './parsers/harmony.js';
import { parseQwen35Format } from './parsers/qwen35.js';
import { parseGemma4NativeFormat } from './parsers/gemma4native.js';
import { parseDsmlFormat } from './parsers/dsml.js';
function pickFormatParsers(dialect) {
    switch (dialect) {
        case 'pythonic':
            return [parsePythonicFormat];
        case 'hermes':
            // Hermes first so frame errors surface; JSON fallbacks then cover
            // unknown JSON-payload models.
            return [parseHermesFormat, parseGemmaFormat, parseLlamacppFormat];
        case 'json':
            return [parseGemmaFormat, parseLlamacppFormat];
        case 'harmony':
            return [parseHarmonyFormat];
        case 'qwen35':
            // Hermes fallback: Qwen3.5 templates sometimes emit OpenAI-style JSON
            // when the native XML format fails; Hermes chain recovers those.
            return [parseQwen35Format, parseHermesFormat];
        case 'gemma4':
            // No JSON fallback: Gemma4 emits only its native channel-thought dialect
            // and never falls back to JSON-envelope formats.
            return [parseGemma4NativeFormat];
        case 'dsml':
            // Hermes fallback: DeepSeek templates fall back to OpenAI-style JSON when
            // the DSML block fails to materialise.
            return [parseDsmlFormat, parseHermesFormat, parseLlamacppFormat];
        default:
            // DSML first: the `<｜DSML｜` token is unique to DeepSeek and can't
            // false-match another dialect.
            // Gemma4 next: `<|tool_call>` is uniquely distinctive and can't
            // false-match other dialects.
            // Harmony next: `to=functions.` is also uniquely Harmony.
            // Qwen35 before Hermes: defers to Hermes when JSON is inside <tool_call>,
            // so the XML path is recovered without breaking Hermes-JSON payloads.
            // Pythonic last: its bare `[name(...)]` form can match payloads that
            // look like other dialects.
            return [
                parseDsmlFormat,
                parseGemma4NativeFormat,
                parseHarmonyFormat,
                parseQwen35Format,
                parseHermesFormat,
                parseGemmaFormat,
                parseLlamacppFormat,
                parsePythonicFormat
            ];
    }
}
export function parseToolCalls(text, tools, dialect) {
    if (!tools || tools.length === 0) {
        return { toolCalls: [], errors: [] };
    }
    const cleaned = stripThinkingBlocks(text);
    const formatParsers = pickFormatParsers(dialect);
    for (const parser of formatParsers) {
        const result = parser(cleaned, tools);
        if (result.matched) {
            return { toolCalls: result.toolCalls, errors: result.errors };
        }
    }
    const generic = parseGenericFormat(cleaned, tools);
    return { toolCalls: generic.toolCalls, errors: generic.errors };
}
