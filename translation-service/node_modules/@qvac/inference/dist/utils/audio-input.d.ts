import { Readable } from 'bare-stream';
import type { AudioInput, AudioFormat } from '../schemas/index.js';
/**
 * Converts an AudioInput (base64 or filePath) into a Readable stream,
 * decoding the audio when necessary.
 *
 * Shared by all transcription plugins (Whisper, Parakeet, etc.).
 */
export declare function createAudioStream(audioChunk: AudioInput, audioFormat: AudioFormat): Promise<Readable>;
