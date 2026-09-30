import { getModel } from '../../../../runtime/model-registry.js';
import { decodeBase64, encodeBase64 } from '../../../../utils/encoding.js';
function f32FromBase64(b64) {
    const bytes = decodeBase64(b64);
    // ArrayBuffer view must be aligned; copy if needed.
    if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
        return new Float32Array(bytes.buffer);
    }
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Float32Array(copy.buffer);
}
function i32FromBase64(b64) {
    const bytes = decodeBase64(b64);
    if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
        return new Int32Array(bytes.buffer);
    }
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Int32Array(copy.buffer);
}
function u8FromBase64(b64) {
    return decodeBase64(b64);
}
function f32ToBase64(arr) {
    return encodeBase64(new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength));
}
function pickStats(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const r = raw;
    const out = {};
    if (typeof r['vision_ms'] === 'number')
        out.vision_ms = r['vision_ms'];
    if (typeof r['prefill_compute_ms'] === 'number')
        out.prefill_compute_ms = r['prefill_compute_ms'];
    if (typeof r['prefill_total_ms'] === 'number')
        out.prefill_total_ms = r['prefill_total_ms'];
    if (typeof r['smollm2_compute_ms'] === 'number')
        out.smollm2_compute_ms = r['smollm2_compute_ms'];
    if (typeof r['smollm2_total_ms'] === 'number')
        out.smollm2_total_ms = r['smollm2_total_ms'];
    if (typeof r['ode_ms'] === 'number')
        out.ode_ms = r['ode_ms'];
    if (typeof r['total_ms'] === 'number')
        out.total_ms = r['total_ms'];
    if (typeof r['backendDevice'] === 'number')
        out.backendDevice = r['backendDevice'];
    return Object.keys(out).length > 0 ? out : undefined;
}
export async function vlaRun(request) {
    const model = getModel(request.modelId);
    const images = request.images.map(f32FromBase64);
    const state = f32FromBase64(request.state);
    const tokens = i32FromBase64(request.tokens);
    const mask = u8FromBase64(request.mask);
    const noise = request.noise ? f32FromBase64(request.noise) : undefined;
    const response = await model.run({
        images,
        imgWidth: request.imgWidth,
        imgHeight: request.imgHeight,
        state,
        tokens,
        mask,
        ...(noise && { noise })
    });
    const result = await response.await();
    const hp = model.hparams;
    if (!hp) {
        throw new Error('VLA model hparams unavailable after run');
    }
    return {
        actions: f32ToBase64(result.actions),
        actionDim: hp.actionDim,
        chunkSize: hp.chunkSize,
        ...(pickStats(result.stats) && { stats: pickStats(result.stats) })
    };
}
