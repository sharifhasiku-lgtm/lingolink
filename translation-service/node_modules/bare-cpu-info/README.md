# bare-cpu-info

<https://github.com/holepunchto/libcpuinfo> bindings for Bare. Reports static properties of the installed CPU, such as core counts, installed memory, and supported instruction set extensions, as well as its runtime utilization.

```
npm i bare-cpu-info
```

## Usage

```js
const CPUInfo = require('bare-cpu-info')

const info = new CPUInfo()

const cpu = info.query()

console.log(cpu.name, cpu.arch, cpu.logicalCores)

// Sample once to prime the utilization state, then again to measure the delta.
info.sample()

const usage = info.sample()

console.log(usage.compute)

info.destroy()
```

## API

#### `const info = new CPUInfo()`

Create a query context. The context detects the static properties of the CPU up front and retains the state needed to compute utilization as a delta between successive samples.

The context holds a native resource. It is released automatically when the object is garbage collected, but prefer calling `info.destroy()` when done.

#### `info.destroy()`

Destroy the context and release its native resource. Idempotent; calling it more than once has no effect. Do not call any other method after destroying the context.

The class also implements `Symbol.dispose`, so it can be scoped to a `using` declaration and destroyed automatically:

```js
using info = new CPUInfo()

console.log(info.query())
```

#### `const cpu = info.query()`

Get static information about the CPU installed in the system. The values are constant for the lifetime of the process. Returns an object:

```js
cpu = {
  name, // Human-readable model name, or `null` if unknown
  vendor, // Human-readable vendor name, or `null` if unknown
  arch, // The architecture, as a value of `constants.arch`
  features, // The features object, as returned by `info.features()`
  physicalCores, // The number of physical cores
  logicalCores, // The number of logical cores, i.e. hardware threads
  performanceCores, // The number of physical performance ('P') cores, or 0
  efficiencyCores, // The number of physical efficiency ('E') cores, or 0
  frequency, // The nominal frequency in hertz, or `undefined` if unknown
  cacheLine, // The size of a cache line in bytes, or `undefined` if unknown
  memory // The total installed physical memory in bytes, or `undefined` if unknown
}
```

On a homogeneous CPU, or when the split cannot be determined, both `performanceCores` and `efficiencyCores` are `0`; in that case treat all `physicalCores` as equivalent.

#### `const features = info.features()`

Get the optional instruction set extensions, or "features", supported by the CPU. Returns an object with a boolean property per feature, keyed as in libcpuinfo. Each key is prefixed with the architecture it belongs to and is only ever set on that architecture, so a portable caller that only cares whether a capability is present should test both the `arm_` and `x86_` variants.

```js
features = {
  // Arm
  arm_neon,
  arm_aes,
  arm_pmull,
  arm_sha1,
  arm_sha2,
  arm_sha512,
  arm_sha3,
  arm_crc32,
  arm_atomics,
  arm_dotprod,
  arm_fp16,
  arm_sve,
  arm_sve2,

  // x86
  x86_sse2,
  x86_sse3,
  x86_ssse3,
  x86_sse4_1,
  x86_sse4_2,
  x86_avx,
  x86_avx2,
  x86_fma,
  x86_bmi,
  x86_bmi2,
  x86_avx512f,
  x86_avx512cd,
  x86_avx512vl,
  x86_avx512bitalg,
  x86_avx512vpopcntdq,
  x86_aes,
  x86_pclmulqdq,
  x86_sha,
  x86_popcnt,
  x86_rdrand,
  x86_rdseed,
  x86_adx,
  x86_f16c,
  x86_vaes,
  x86_vpclmulqdq
}
```

#### `const usage = info.sample()`

Sample the runtime utilization of the CPU. This is the only call that advances the sampling state; it also refreshes the per-core snapshot read by `info.coreUsage()`. Returns an object:

```js
usage = {
  // Fraction of compute capacity in use, in [0, 1], averaged across all
  // logical cores since the previous sample, or `undefined` if compute
  // utilization could not be determined.
  compute,
  memoryUsed, // Physical memory currently in use, in bytes, or `undefined` if unknown
  memoryTotal // Total installed physical memory, in bytes, or `undefined` if unknown
}
```

The `compute` figure is the average load since the previous call to `info.sample()`, or since the context was created for the first call. The first sample reports a real reading; a zero-length interval reads as `0`. It is `undefined` only when compute utilization cannot be measured on the current platform.

#### `const count = info.coreCount()`

Get the number of logical cores that can be sampled individually with `info.coreUsage()`. This is usually equal to `logicalCores`, but may be smaller; on Windows only the first processor group is sampled, so a system with more than 64 logical processors reports at most 64 here.

#### `const usage = info.coreUsage(index)`

Read the runtime utilization of the logical core at `index`, in the range `[0, info.coreCount())`. Returns a `usage` object of the same shape as `info.sample()`.

Unlike `info.sample()`, this does not sample the CPU itself; it reports the per-core figures captured by the most recent `info.sample()` call. Call `info.sample()` first to refresh the snapshot. The memory fields carry the system-wide values, which are not partitioned per core. Throws a `RangeError` if `index` is out of range.

#### `const type = info.coreType(index)`

Get the role the logical core at `index` plays on a hybrid CPU, in the range `[0, info.coreCount())`, as a value of `constants.coreType`. Returns `constants.coreType.UNKNOWN` for a homogeneous CPU or a platform that does not expose the distinction. Throws a `RangeError` if `index` is out of range.

#### `const frequency = info.coreFrequency(index)`

Get the nominal maximum frequency, in hertz, of the logical core at `index`, in the range `[0, info.coreCount())`. On a hybrid CPU the performance and efficiency cores typically differ. Returns `undefined` when the per-core frequency is not reported, such as on Apple silicon. Throws a `RangeError` if `index` is out of range.

#### `const size = info.coreCache(index, level)`

Get the size, in bytes, of the given cache `level` for the logical core at `index`, in the range `[0, info.coreCount())`. `level` is a value of `constants.cache`. The two level 1 caches are distinguished as the data and instruction caches; the level 2 and level 3 caches are unified. Returns `undefined` when the cache is absent or could not be determined. Throws a `RangeError` if `index` is out of range.

#### `CPUInfo.constants`

```js
constants = {
  arch: { UNKNOWN, X86, X86_64, ARM, ARM64 },
  coreType: { UNKNOWN, PERFORMANCE, EFFICIENCY },
  cache: { L1D, L1I, L2, L3 }
}
```

## License

Apache-2.0
