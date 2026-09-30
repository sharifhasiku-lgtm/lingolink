# bare-mime

MIME type parsing for Bare, implementing the MIME type record and parser defined by the MIME Sniffing Standard at <https://mimesniff.spec.whatwg.org>.

```
npm i bare-mime
```

## Usage

```js
const MIME = require('bare-mime')

const mime = MIME.parse('text/plain;charset=utf-8')

console.log(mime.type) // 'text'
console.log(mime.subtype) // 'plain'
console.log(mime.parameters.get('charset')) // 'utf-8'
```

## API

#### `const mime = new MIME(type, subtype[, parameters])`

Construct a new MIME type record with the given `type` and `subtype` strings. `parameters` is an optional `Map` of parameter name-value pairs, defaulting to an empty `Map`.

#### `mime.type`

The type of the MIME type record, e.g. `'text'`.

#### `mime.subtype`

The subtype of the MIME type record, e.g. `'plain'`.

#### `mime.parameters`

A `Map` of parameters associated with the MIME type record.

#### `const mime = MIME.parse(input)`

Parse a MIME type string per <https://mimesniff.spec.whatwg.org/#parse-a-mime-type>. Returns a `MIME` instance on success or `null` on failure. The `type` and `subtype` are lowercased and leading/trailing HTTP whitespace is stripped. Parameters are parsed from the input, with duplicate parameter names ignored in favor of the first occurrence.

## License

Apache-2.0
