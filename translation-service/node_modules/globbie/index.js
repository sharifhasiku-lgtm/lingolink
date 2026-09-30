const fs = require('fs')
const path = require('path')
const picomatch = require('picomatch')
const process = require('process')

class Globbie {
  constructor(pattern, { sync = false } = {}) {
    this._isMatch = picomatch(pattern, {
      windows: process.platform === 'win32'
    })
    this._sync = sync
  }

  match(dir = '.') {
    return this._sync ? this.#matchSync(dir) : this.#matchAsync(dir)
  }

  #matchSync(dir = '.') {
    let files
    try {
      files = fs.readdirSync(dir)
    } catch (err) {
      if (err.code === 'ENOENT') return [] // removed underneath us
      throw err
    }

    const matches = []
    for (const file of files) {
      const filePath = path.join(dir, file)
      let stat = null
      try {
        stat = fs.lstatSync(filePath)
      } catch (err) {
        if (err.code === 'ENOENT') continue // removed underneath us
        throw err
      }
      if (stat.isDirectory()) matches.push(...this.match(filePath))
      else if (this._isMatch(filePath)) matches.push(filePath)
    }

    return matches
  }

  async #matchAsync(dir = '.') {
    let files
    try {
      files = await fs.promises.readdir(dir)
    } catch (err) {
      if (err.code === 'ENOENT') return [] // removed underneath us
      throw err
    }

    const matches = []
    const promises = files.map(async (file) => {
      const filePath = path.join(dir, file)
      let stat = null
      try {
        stat = await fs.promises.lstat(filePath)
      } catch (err) {
        if (err.code === 'ENOENT') return // removed underneath us
        throw err
      }
      if (stat.isDirectory()) matches.push(...(await this.#matchAsync(filePath)))
      else if (this._isMatch(filePath)) matches.push(filePath)
    })

    for (const promise of promises) promise.catch(() => {})

    const results = await Promise.allSettled(promises)
    const error = results.find(({ status }) => status === 'rejected')?.reason
    if (error) throw error

    return matches
  }
}

module.exports = Globbie
