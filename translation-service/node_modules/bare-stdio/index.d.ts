import { ReadStream as TTYReadStream, WriteStream as TTYWriteStream } from 'bare-tty'
import Pipe from 'bare-pipe'
import { ReadStream as FileReadStream, WriteStream as FileWriteStream } from 'bare-fs'

interface IO {
  readonly in: TTYReadStream | Pipe | FileReadStream
  readonly out: TTYWriteStream | Pipe | FileWriteStream
  readonly err: TTYWriteStream | Pipe | FileWriteStream
}

declare const io: IO

export = io
