# bare-stdio

Standard input/output streams for Bare.

```
npm i bare-stdio
```

## Usage

```js
const stdio = require('bare-stdio')

// Write to stdout
stdio.out.write('Hello, World!\n')

// Write to stderr
stdio.err.write('An error occurred\n')

// Read from stdin
stdio.in.on('data', (data) => {
  console.log('Received:', data.toString())
})
```

## API

#### `stdio.in`

A readable stream for standard input (`fd 0`). Returns a `bare-tty` `ReadStream` if stdin is a terminal, a `bare-pipe` `Pipe` if it's a pipe, otherwise a `bare-fs` `ReadStream`.

#### `stdio.out`

A writable stream for standard output (`fd 1`). Returns a `bare-tty` `WriteStream` if stdout is a terminal, a `bare-pipe` `Pipe` if it's a pipe, otherwise a `bare-fs` `WriteStream`.

#### `stdio.err`

A writable stream for standard error (`fd 2`). Returns a `bare-tty` `WriteStream` if stderr is a terminal, a `bare-pipe` `Pipe` if it's a pipe, otherwise a `bare-fs` `WriteStream`.

## License

Apache-2.0
