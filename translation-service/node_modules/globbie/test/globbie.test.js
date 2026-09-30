const Globbie = require('../index')
const fs = require('fs')
const path = require('path')
const test = require('brittle')
const process = require('process')

process.chdir(path.join(__dirname, 'fixtures'))

function toPlatformPaths(paths) {
  return process.platform === 'win32' ? paths.map((p) => p.replace(/\//g, path.sep)) : paths
}

test('match all js files', async (t) => {
  const g = new Globbie('**.js', { sync: true })
  const matches = g.match()

  t.alike(
    matches.sort(),
    toPlatformPaths([
      'rootfile-1.js',
      'rootfile-2.js',
      'rootfile-3.js',
      'subpath/subpathfile-1.js',
      'subpath/subpathfile-2.js',
      'subpath/subpathfile-3.js',
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js'
    ])
  )
})

test('match all js and ts files', async (t) => {
  const g = new Globbie('**/*.{js,ts}', { sync: true })
  const matches = g.match()

  t.alike(
    matches.sort(),
    toPlatformPaths([
      'rootfile-1.js',
      'rootfile-2.js',
      'rootfile-3.js',
      'rootfile-invalid.ts',
      'subpath/subpathfile-1.js',
      'subpath/subpathfile-2.js',
      'subpath/subpathfile-3.js',
      'subpath/subpathfile-invalid.ts',
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js',
      'subpath/subsubpath/subsubpathfile-invalid.ts'
    ])
  )
})

test('match only subpath js files', async (t) => {
  const g = new Globbie('subpath/**/*.js', { sync: true })
  const matches = g.match()

  t.alike(
    matches.sort(),
    toPlatformPaths([
      'subpath/subpathfile-1.js',
      'subpath/subpathfile-2.js',
      'subpath/subpathfile-3.js',
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js'
    ])
  )
})

test('match only subpath js files - dir set to subsubpath', async (t) => {
  const g = new Globbie('subpath/**/*.js', { sync: true })
  const matches = g.match('subpath/subsubpath')

  t.alike(
    matches.sort(),
    toPlatformPaths([
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js'
    ])
  )
})

test('async match all js files', async (t) => {
  const g = new Globbie('**.js')
  const matches = await g.match()
  t.alike(
    matches.sort(),
    toPlatformPaths([
      'rootfile-1.js',
      'rootfile-2.js',
      'rootfile-3.js',
      'subpath/subpathfile-1.js',
      'subpath/subpathfile-2.js',
      'subpath/subpathfile-3.js',
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js'
    ])
  )
})

test('async match all js and ts files', async (t) => {
  const g = new Globbie('**/*.{js,ts}')
  const matches = await g.match()

  t.alike(
    matches.sort(),
    toPlatformPaths([
      'rootfile-1.js',
      'rootfile-2.js',
      'rootfile-3.js',
      'rootfile-invalid.ts',
      'subpath/subpathfile-1.js',
      'subpath/subpathfile-2.js',
      'subpath/subpathfile-3.js',
      'subpath/subpathfile-invalid.ts',
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js',
      'subpath/subsubpath/subsubpathfile-invalid.ts'
    ])
  )
})

test('async match only subpath', async (t) => {
  const g = new Globbie('subpath/**/*.js')
  const matches = await g.match()

  t.alike(
    matches.sort(),
    toPlatformPaths([
      'subpath/subpathfile-1.js',
      'subpath/subpathfile-2.js',
      'subpath/subpathfile-3.js',
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js'
    ])
  )
})

test('async match only subpath js files - dir set to subsubpath', async (t) => {
  const g = new Globbie('subpath/**/*.js')
  const matches = await g.match('subpath/subsubpath')

  t.alike(
    matches.sort(),
    toPlatformPaths([
      'subpath/subsubpath/subsubpathfile-1.js',
      'subpath/subsubpath/subsubpathfile-2.js',
      'subpath/subsubpath/subsubpathfile-3.js'
    ])
  )
})

test('sync match tolerates a directory removed between readdir and lstat', async (t) => {
  // simulates ENOENT race: readdirSync lists a directory, but by the time
  // lstatSync gets to it, a concurrent process has deleted it
  const baseDir = await t.tmp()
  const dirName = 'vanishing-dir'
  const dirPath = path.join(baseDir, dirName)
  fs.mkdirSync(dirPath)
  fs.writeFileSync(path.join(dirPath, 'ghost.js'), '')

  const originalLstatSync = fs.lstatSync
  let removed = false
  fs.lstatSync = function (target, ...args) {
    if (!removed && target === dirPath) {
      removed = true
      fs.rmSync(dirPath, { recursive: true })
    }
    return originalLstatSync.call(fs, target, ...args)
  }
  t.teardown(() => {
    fs.lstatSync = originalLstatSync
  })

  const g = new Globbie('**.js', { sync: true })

  let matches = []
  t.execution(() => {
    matches = g.match(baseDir)
  })
  t.ok(removed, 'the directory was actually removed mid-walk')
  t.absent(
    matches.includes(path.join(dirPath, 'ghost.js')),
    'the vanished directory contributes no matches'
  )
})

test('async match tolerates a directory removed between readdir and lstat', async (t) => {
  const baseDir = await t.tmp()
  const dirName = 'vanishing-dir'
  const dirPath = path.join(baseDir, dirName)
  fs.mkdirSync(dirPath)
  fs.writeFileSync(path.join(dirPath, 'ghost.js'), '')

  const originalLstat = fs.promises.lstat
  let removed = false
  fs.promises.lstat = function (target, ...args) {
    if (!removed && target === dirPath) {
      removed = true
      fs.rmSync(dirPath, { recursive: true })
    }
    return originalLstat.call(fs.promises, target, ...args)
  }
  t.teardown(() => {
    fs.promises.lstat = originalLstat
  })

  const g = new Globbie('**.js', { sync: false })

  let matches = []
  await t.execution(async () => {
    matches = await g.match(baseDir)
  })
  t.ok(removed, 'the directory was actually removed mid-walk')
  t.absent(
    matches.includes(path.join(dirPath, 'ghost.js')),
    'the vanished directory contributes no matches'
  )
})

test('sync match tolerates a directory removed between lstat and readdir', async (t) => {
  // simulates ENOENT race: lstatSync reports a directory, but by the time we
  // recurse into it and readdirSync it, a concurrent process has deleted it
  const baseDir = await t.tmp()
  const dirName = 'vanishing-dir'
  const dirPath = path.join(baseDir, dirName)
  fs.mkdirSync(dirPath)
  fs.writeFileSync(path.join(dirPath, 'ghost.js'), '')

  const originalLstatSync = fs.lstatSync
  let removed = false
  fs.lstatSync = function (target, ...args) {
    const stat = originalLstatSync.call(fs, target, ...args)
    if (!removed && target === dirPath) {
      // let lstat still report a directory, then delete it so the recursive
      // readdirSync(dirPath) is what hits ENOENT
      removed = true
      fs.rmSync(dirPath, { recursive: true })
    }
    return stat
  }
  t.teardown(() => {
    fs.lstatSync = originalLstatSync
  })

  const g = new Globbie('**.js', { sync: true })

  let matches = []
  t.execution(() => {
    matches = g.match(baseDir)
  })
  t.ok(removed, 'the directory was actually removed mid-walk')
  t.absent(
    matches.includes(path.join(dirPath, 'ghost.js')),
    'the vanished directory contributes no matches'
  )
})

test('async match tolerates a directory removed between lstat and readdir', async (t) => {
  const baseDir = await t.tmp()
  const dirName = 'vanishing-dir'
  const dirPath = path.join(baseDir, dirName)
  fs.mkdirSync(dirPath)
  fs.writeFileSync(path.join(dirPath, 'ghost.js'), '')

  const originalLstat = fs.promises.lstat
  let removed = false
  fs.promises.lstat = async function (target, ...args) {
    const stat = await originalLstat.call(fs.promises, target, ...args)
    if (!removed && target === dirPath) {
      removed = true
      fs.rmSync(dirPath, { recursive: true })
    }
    return stat
  }
  t.teardown(() => {
    fs.promises.lstat = originalLstat
  })

  const g = new Globbie('**.js', { sync: false })

  let matches = []
  await t.execution(async () => {
    matches = await g.match(baseDir)
  })
  t.ok(removed, 'the directory was actually removed mid-walk')
  t.absent(
    matches.includes(path.join(dirPath, 'ghost.js')),
    'the vanished directory contributes no matches'
  )
})
