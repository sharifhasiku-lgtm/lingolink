import { Readable } from 'bare-stream';
import fs from 'bare-fs';
import Buffer from 'bare-buffer';
import { needsDecoding, decodeAudioToStream } from './audio/decoder.js';
import { AudioFileNotFoundError, InvalidAudioChunkError } from '../errors/index.js';
/**
 * Converts an AudioInput (base64 or filePath) into a Readable stream,
 * decoding the audio when necessary.
 *
 * Shared by all transcription plugins (Whisper, Parakeet, etc.).
 */
export async function createAudioStream(audioChunk, audioFormat) {
    switch (audioChunk.type) {
        case 'base64': {
            const audioBuffer = Buffer.from(audioChunk.value, 'base64');
            return Readable.from([audioBuffer]);
        }
        case 'filePath': {
            const filePath = audioChunk.value;
            try {
                fs.accessSync(filePath);
            }
            catch (error) {
                throw new AudioFileNotFoundError(filePath, error);
            }
            if (needsDecoding(filePath)) {
                return decodeAudioToStream(filePath, audioFormat);
            }
            return fs.createReadStream(filePath);
        }
        default:
            throw new InvalidAudioChunkError();
    }
}
