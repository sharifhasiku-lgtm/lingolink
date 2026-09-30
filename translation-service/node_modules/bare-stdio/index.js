const fs = require('bare-fs')
const tty = require('bare-tty')
const Pipe = require('bare-pipe')
const binding = require('./binding')

const { TTY, NAMED_PIPE } = binding

class IO {
  constructor() {
    this._in = null
    this._out = null
    this._err = null
  }

  get in() {
    if (this._in === null) {
      switch (binding.guessType(0)) {
        case TTY:
          this._in = new tty.ReadStream(0)
          break
        case NAMED_PIPE:
          this._in = new Pipe(0, { eagerOpen: false })
          break
        default:
          this._in = fs.createReadStream(null, { fd: 0, eagerOpen: false })
      }
    }

    return this._in
  }

  get out() {
    if (this._out === null) {
      switch (binding.guessType(1)) {
        case TTY:
          this._out = new tty.WriteStream(1)
          break
        case NAMED_PIPE:
          this._out = new Pipe(1, { eagerOpen: false })
          this._out.unref()
          break
        default:
          this._out = fs.createWriteStream(null, { fd: 1, eagerOpen: false })
      }
    }

    return this._out
  }

  get err() {
    if (this._err === null) {
      switch (binding.guessType(2)) {
        case TTY:
          this._err = new tty.WriteStream(2)
          break
        case NAMED_PIPE:
          this._err = new Pipe(2, { eagerOpen: false })
          this._err.unref()
          break
        default:
          this._err = fs.createWriteStream(null, { fd: 2, eagerOpen: false })
      }
    }

    return this._err
  }
}

module.exports = new IO()
