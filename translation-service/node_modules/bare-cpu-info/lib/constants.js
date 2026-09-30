// The instruction set architecture of the CPU, as reported by `query().arch`.
exports.arch = {
  UNKNOWN: 0,
  X86: 1,
  X86_64: 2,
  ARM: 3,
  ARM64: 4
}

// The role a logical core plays on a hybrid CPU, as reported by `coreType()`.
exports.coreType = {
  UNKNOWN: 0,
  PERFORMANCE: 1,
  EFFICIENCY: 2
}

// The cache level selected when calling `coreCache()`. The two level 1 caches
// are distinguished as the data and instruction caches; the level 2 and level 3
// caches are unified.
exports.cache = {
  L1D: 0,
  L1I: 1,
  L2: 2,
  L3: 3
}
