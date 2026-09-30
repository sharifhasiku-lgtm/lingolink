declare const constants: {
  arch: {
    UNKNOWN: 0
    X86: 1
    X86_64: 2
    ARM: 3
    ARM64: 4
  }
  coreType: {
    UNKNOWN: 0
    PERFORMANCE: 1
    EFFICIENCY: 2
  }
  cache: {
    L1D: 0
    L1I: 1
    L2: 2
    L3: 3
  }
}

export = constants
