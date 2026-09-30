import constants from './lib/constants'

type Arch = (typeof constants.arch)[keyof typeof constants.arch]

type CoreType = (typeof constants.coreType)[keyof typeof constants.coreType]

type CacheLevel = (typeof constants.cache)[keyof typeof constants.cache]

interface Features {
  // Arm
  arm_neon: boolean
  arm_aes: boolean
  arm_pmull: boolean
  arm_sha1: boolean
  arm_sha2: boolean
  arm_sha512: boolean
  arm_sha3: boolean
  arm_crc32: boolean
  arm_atomics: boolean
  arm_dotprod: boolean
  arm_fp16: boolean
  arm_sve: boolean
  arm_sve2: boolean

  // x86
  x86_sse2: boolean
  x86_sse3: boolean
  x86_ssse3: boolean
  x86_sse4_1: boolean
  x86_sse4_2: boolean
  x86_avx: boolean
  x86_avx2: boolean
  x86_fma: boolean
  x86_bmi: boolean
  x86_bmi2: boolean
  x86_avx512f: boolean
  x86_avx512cd: boolean
  x86_avx512vl: boolean
  x86_avx512bitalg: boolean
  x86_avx512vpopcntdq: boolean
  x86_aes: boolean
  x86_pclmulqdq: boolean
  x86_sha: boolean
  x86_popcnt: boolean
  x86_rdrand: boolean
  x86_rdseed: boolean
  x86_adx: boolean
  x86_f16c: boolean
  x86_vaes: boolean
  x86_vpclmulqdq: boolean
}

interface CPU {
  name: string | null
  vendor: string | null
  arch: Arch
  features: Features
  physicalCores: number
  logicalCores: number
  performanceCores: number
  efficiencyCores: number
  frequency: number | undefined
  cacheLine: number | undefined
  memory: number | undefined
}

interface Usage {
  compute: number | undefined
  memoryUsed: number | undefined
  memoryTotal: number | undefined
}

declare class CPUInfo {
  constructor()

  query(): CPU

  features(): Features

  sample(): Usage

  coreCount(): number

  coreUsage(index: number): Usage

  coreType(index: number): CoreType

  coreFrequency(index: number): number | undefined

  coreCache(index: number, level: CacheLevel): number | undefined

  destroy(): void

  [Symbol.dispose](): void

  static readonly constants: typeof constants
}

export = CPUInfo
