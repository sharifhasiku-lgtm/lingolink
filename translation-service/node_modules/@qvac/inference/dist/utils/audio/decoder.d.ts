import { type DecoderOutput } from '@qvac/decoder-audio';
import { Readable } from 'bare-stream';
import { type AudioFormat } from '../../schemas/index.js';
export declare function needsDecoding(filePath: string): boolean;
/**
 * Longest silence the decoder may go without emitting a PCM chunk before the
 * decode is abandoned. Measured between outputs, not against the whole file, so
 * long inputs decode fine as long as FFmpeg keeps producing data.
 */
export declare const DECODER_INACTIVITY_TIMEOUT_MS = 10000;
export interface DecodeAudioOptions {
    /** Output sample rate; the decoder's default is 16 kHz (what every transcription engine expects). */
    sampleRate?: number;
    /** Inactivity timeout between decoded chunks (default `DECODER_INACTIVITY_TIMEOUT_MS`). */
    inactivityTimeoutMs?: number;
}
/** The subset of the decoder's `QvacResponse` that the stream bridge consumes. */
export interface DecoderResponseLike {
    onUpdate(callback: (output: DecoderOutput) => void): DecoderResponseLike;
    onFinish(callback: () => void): DecoderResponseLike;
    onError(callback: (error: Error) => void): DecoderResponseLike;
    await(): Promise<unknown>;
}
export interface DecoderStreamOptions {
    /** Used in error messages only. */
    inputPath: string;
    inactivityTimeoutMs?: number;
    /** Runs once, on whichever terminal path (finish, error, timeout) settles the stream. */
    onSettled?: () => void;
}
/**
 * Decode an audio file into a raw mono PCM stream.
 */
export declare function decodeAudioToStream(inputPath: string, audioFormat?: AudioFormat, options?: DecodeAudioOptions): Promise<Readable>;
/**
 * Bridge a decoder response into a `Readable` of PCM chunks. The stream fails
 * if the decoder emits nothing for `inactivityTimeoutMs`; the timer is re-armed
 * on every chunk, so it bounds inactivity, not the total decode time.
 */
export declare function decoderResponseToStream(response: DecoderResponseLike, options: DecoderStreamOptions): Readable;
