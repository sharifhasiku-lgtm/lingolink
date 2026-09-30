if (typeof require.asset === 'function') {
  module.exports = require.asset.bind(require)
} else {
  const url = require('url')
  const fs = require('fs')
  const path = require('path')
  const resolve = require('bare-module-resolve')

  const conditions = ['asset', 'node', process.platform, process.arch]

  if (isAlpine()) conditions.push('musl')

  module.exports = function asset(specifier, parentURL) {
    if (typeof parentURL === 'string') parentURL = url.pathToFileURL(parentURL)

    const candidates = []

    for (const resolution of resolve(
      specifier,
      parentURL,
      { conditions, directories: true },
      readPackage
    )) {
      candidates.push(resolution)

      if (resolution.protocol !== 'file:') continue

      const filename = url.fileURLToPath(resolution)

      try {
        const st = fs.statSync(filename)

        if (st.isDirectory() || (st.isFile() && !isDirectory(resolution))) {
          return path.resolve(filename)
        }
      } catch {
        continue
      }
    }

    let message = `Cannot find asset '${specifier}' imported from '${parentURL.href}'`

    if (candidates.length > 0) {
      message += '\nCandidates:'
      message += '\n' + candidates.map((url) => '- ' + url.href).join('\n')
    }

    const err = new Error(message)

    err.code = 'ASSET_NOT_FOUND'
    err.specifier = specifier
    err.referrer = parentURL
    err.candidates = candidates

    throw err
  }

  function isDirectory(url) {
    return url.pathname[url.pathname.length - 1] === '/'
  }

  function readPackage(packageURL) {
    try {
      return require(url.fileURLToPath(packageURL))
    } catch (err) {
      return null
    }
  }

  function isAlpine() {
    return process.platform === 'linux' && fs.existsSync('/etc/alpine-release')
  }
}
