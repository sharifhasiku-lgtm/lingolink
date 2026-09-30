# rabin-native

<https://github.com/holepunchto/librabin> bindings for JavaScript.

```
npm i rabin-native
```

## Usage

```js
const rabin = require('rabin-native')

const chunker = new rabin.Chunker()
const chunks = []

for (const chunk of chunker.push(shakespeare)) {
  chunks.push(chunk)
}

const chunk = chunker.end()

if (chunk) chunks.push(chunk)
```

## API

#### `const chunker = new Chunker([options])`

Construct a new chunker.

Options include:

```js
options = {
  minSize: 512 * 1024, // 512 KiB
  maxSize: 8 * 1024 * 1024 // 8 MiB
}
```

#### `const iterator = chunker.push(data)`

Push data to the chunker, returning an iterator over the identified chunks.

Each chunk has the following shape:

```js
chunk = {
  // Size of the chunk in bytes
  length,
  // Offset of the chunk within the stream
  offset
}
```

#### `const chunk = chunker.end()`

Finish the chunker, returning the trailing chunk or `null`.

## License

Apache-2.0
