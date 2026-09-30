class MIME {
  constructor(type, subtype, parameters = new Map()) {
    this._type = type
    this._subtype = subtype
    this._parameters = parameters
  }

  // https://mimesniff.spec.whatwg.org/#type
  get type() {
    return this._type
  }

  // https://mimesniff.spec.whatwg.org/#subtype
  get subtype() {
    return this._subtype
  }

  // https://mimesniff.spec.whatwg.org/#parameters
  get parameters() {
    return this._parameters
  }
}

module.exports = exports = MIME

// https://mimesniff.spec.whatwg.org/#parse-a-mime-type
exports.parse = function parse(input) {
  // 1.
  input = input.replace(httpWhitespaceLeadingAndTrailing, '')

  // 2.
  let position = 0

  // 3.
  let type = ''

  while (position < input.length && input[position] !== '/') {
    type += input[position++]
  }

  // 4.
  if (type === '' || !isHTTPTokenCodePoints(type)) return null

  // 5.
  if (position >= input.length) return null

  // 6.
  position++

  // 7.
  let subtype = ''

  while (position < input.length && input[position] !== ';') {
    subtype += input[position++]
  }

  // 8.
  subtype = subtype.replace(httpWhitespaceTrailing, '')

  // 9.
  if (subtype === '' || !isHTTPTokenCodePoints(subtype)) return null

  // 10.
  const mimeType = new MIME(type.toLowerCase(), subtype.toLowerCase())

  // 11.
  while (position < input.length) {
    // 11.1.
    position++

    // 11.2.
    while (position < input.length && httpWhitespace.test(input[position])) {
      position++
    }

    // 11.3.
    let parameterName = ''

    while (position < input.length && input[position] !== ';' && input[position] !== '=') {
      parameterName += input[position++]
    }

    // 11.4.
    parameterName = parameterName.toLowerCase()

    // 11.5.
    if (position < input.length && input[position] === ';') continue

    // 11.6.
    if (position >= input.length) break

    // 11.7.
    position++

    // 11.8.
    let parameterValue

    // 11.9.
    if (position < input.length && input[position] === '"') {
      // 11.9.1.
      parameterValue = collectHTTPQuotedString(input, position)
      position = parameterValue.position
      parameterValue = parameterValue.value

      // 11.9.2.
      while (position < input.length && input[position] !== ';') {
        position++
      }
    } else {
      // 11.10.
      parameterValue = ''

      while (position < input.length && input[position] !== ';') {
        parameterValue += input[position++]
      }

      // 11.10.1.
      parameterValue = parameterValue.replace(httpWhitespaceTrailing, '')

      // 11.10.2.
      if (parameterValue === '') continue
    }

    // 11.11.
    if (
      parameterName !== '' &&
      isHTTPTokenCodePoints(parameterName) &&
      isHTTPQuotedStringTokenCodePoints(parameterValue) &&
      !mimeType._parameters.has(parameterName)
    ) {
      mimeType._parameters.set(parameterName, parameterValue)
    }
  }

  // 12.
  return mimeType
}

// https://fetch.spec.whatwg.org/#http-whitespace
const httpWhitespace = /[\t\n\r ]/
const httpWhitespaceLeadingAndTrailing = /^[\t\n\r ]+|[\t\n\r ]+$/g
const httpWhitespaceTrailing = /[\t\n\r ]+$/

// https://mimesniff.spec.whatwg.org/#http-token-code-point
const httpTokenCodePoints = /^[!#$%&'*+\-.^_`|~A-Za-z0-9]+$/

// https://mimesniff.spec.whatwg.org/#http-quoted-string-token-code-point
const httpQuotedStringTokenCodePoints = /^[\t\x20-\x7e\x80-\xff]*$/

function isHTTPTokenCodePoints(s) {
  return httpTokenCodePoints.test(s)
}

function isHTTPQuotedStringTokenCodePoints(s) {
  return httpQuotedStringTokenCodePoints.test(s)
}

// https://fetch.spec.whatwg.org/#collect-an-http-quoted-string
function collectHTTPQuotedString(input, position) {
  let value = ''

  position++

  while (true) {
    while (position < input.length && input[position] !== '"' && input[position] !== '\\') {
      value += input[position++]
    }

    if (position >= input.length) break

    const quoteOrBackslash = input[position++]

    if (quoteOrBackslash === '\\') {
      if (position >= input.length) {
        value += '\\'
        break
      }
      value += input[position++]
    } else {
      break
    }
  }

  return { value, position }
}
