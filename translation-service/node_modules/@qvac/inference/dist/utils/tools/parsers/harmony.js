import { generateStableToolCallId, validateToolArguments } from '../shared.js';
const HARMONY_FRAME_RE = /to=functions\.([\w-]+)\s+<\|constrain\|>json<\|message\|>([\s\S]*?)(?=<\|call\|>|$)/g;
export function parseHarmonyFormat(text, tools) {
    const toolCalls = [];
    const errors = [];
    if (!text.includes('to=functions.')) {
        return { matched: false, toolCalls, errors };
    }
    HARMONY_FRAME_RE.lastIndex = 0;
    let m;
    while ((m = HARMONY_FRAME_RE.exec(text)) !== null) {
        const name = m[1];
        const payload = m[2]?.trim();
        const raw = m[0];
        if (!name || payload === undefined)
            continue;
        let parsedArgs;
        try {
            parsedArgs = JSON.parse(payload);
        }
        catch (error) {
            errors.push({
                code: 'PARSE_ERROR',
                message: `Failed to parse Harmony tool call JSON for ${name}: ${error instanceof Error ? error.message : String(error)}`,
                raw
            });
            continue;
        }
        if (typeof parsedArgs !== 'object' || parsedArgs === null || Array.isArray(parsedArgs)) {
            errors.push({
                code: 'PARSE_ERROR',
                message: `Harmony tool call payload for ${name} is not a JSON object`,
                raw
            });
            continue;
        }
        const args = parsedArgs;
        const validation = validateToolArguments(name, args, tools);
        if (!validation.isValid && validation.error) {
            errors.push({ ...validation.error, raw });
            continue;
        }
        toolCalls.push({
            id: generateStableToolCallId(name, args),
            name,
            arguments: args,
            raw
        });
    }
    // Defer `matched` to extraction so partial Harmony shapes fall through
    // to the next parser instead of short-circuiting the chain.
    return {
        matched: toolCalls.length > 0 || errors.length > 0,
        toolCalls,
        errors
    };
}
