#include <assert.h>
#include <bare.h>
#include <cpuinfo.h>
#include <js.h>
#include <stdint.h>
#include <stdlib.h>
#include <utf.h>

typedef struct {
  cpuinfo_t *handle;
} bare_cpu_info_t;

static js_value_t *
bare_cpu_info__features(js_env_t *env, const cpuinfo_features_t *features) {
  int err;

  js_value_t *result;
  err = js_create_object(env, &result);
  assert(err == 0);

#define V(name) \
  { \
    js_value_t *val; \
    err = js_get_boolean(env, features->name, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, result, #name, val); \
    assert(err == 0); \
  }

  // Arm.
  V(arm_neon)
  V(arm_aes)
  V(arm_pmull)
  V(arm_sha1)
  V(arm_sha2)
  V(arm_sha512)
  V(arm_sha3)
  V(arm_crc32)
  V(arm_atomics)
  V(arm_dotprod)
  V(arm_fp16)
  V(arm_sve)
  V(arm_sve2)

  // x86.
  V(x86_sse2)
  V(x86_sse3)
  V(x86_ssse3)
  V(x86_sse4_1)
  V(x86_sse4_2)
  V(x86_avx)
  V(x86_avx2)
  V(x86_fma)
  V(x86_bmi)
  V(x86_bmi2)
  V(x86_avx512f)
  V(x86_avx512cd)
  V(x86_avx512vl)
  V(x86_avx512bitalg)
  V(x86_avx512vpopcntdq)
  V(x86_aes)
  V(x86_pclmulqdq)
  V(x86_sha)
  V(x86_popcnt)
  V(x86_rdrand)
  V(x86_rdseed)
  V(x86_adx)
  V(x86_f16c)
  V(x86_vaes)
  V(x86_vpclmulqdq)
#undef V

  return result;
}

static js_value_t *
bare_cpu_info__usage(js_env_t *env, const cpuinfo_usage_t *usage) {
  int err;

  js_value_t *result;
  err = js_create_object(env, &result);
  assert(err == 0);

#define V(name, type, ...) \
  { \
    js_value_t *val; \
    err = type(env, ##__VA_ARGS__, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, result, name, val); \
    assert(err == 0); \
  }

  V("compute", js_create_double, usage->compute)
  V("memoryUsed", js_create_int64, (int64_t) usage->memory_used)
  V("memoryTotal", js_create_int64, (int64_t) usage->memory_total)
#undef V

  return result;
}

static void
bare_cpu_info__on_finalize(js_env_t *env, void *data, void *finalize_hint) {
  bare_cpu_info_t *self = data;

  if (self->handle != NULL) cpuinfo_destroy(self->handle);

  free(self);
}

static js_value_t *
bare_cpu_info_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_cpu_info_t *self = malloc(sizeof(bare_cpu_info_t));
  self->handle = NULL;

  err = cpuinfo_init(&self->handle);
  if (err < 0) {
    free(self);

    err = js_throw_error(env, NULL, "Could not initialize CPU information");
    assert(err == 0);

    return NULL;
  }

  err = js_wrap(env, argv[0], self, bare_cpu_info__on_finalize, NULL, NULL);
  assert(err == 0);

  return NULL;
}

static js_value_t *
bare_cpu_info_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  if (self->handle != NULL) {
    cpuinfo_destroy(self->handle);

    self->handle = NULL;
  }

  return NULL;
}

static js_value_t *
bare_cpu_info_query(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  cpuinfo_cpu_t cpu;
  err = cpuinfo_query(self->handle, &cpu);
  if (err < 0) {
    err = js_throw_error(env, NULL, "Could not query CPU information");
    assert(err == 0);

    return NULL;
  }

  js_value_t *result;
  err = js_create_object(env, &result);
  assert(err == 0);

#define V(name, type, ...) \
  { \
    js_value_t *val; \
    err = type(env, ##__VA_ARGS__, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, result, name, val); \
    assert(err == 0); \
  }

  V("name", js_create_string_utf8, (const utf8_t *) cpu.name, -1)
  V("vendor", js_create_string_utf8, (const utf8_t *) cpu.vendor, -1)
  V("arch", js_create_uint32, cpu.arch)
  V("physicalCores", js_create_uint32, cpu.physical_cores)
  V("logicalCores", js_create_uint32, cpu.logical_cores)
  V("performanceCores", js_create_uint32, cpu.performance_cores)
  V("efficiencyCores", js_create_uint32, cpu.efficiency_cores)
  V("frequency", js_create_int64, (int64_t) cpu.frequency)
  V("cacheLine", js_create_uint32, cpu.cache_line)
  V("memory", js_create_int64, (int64_t) cpu.memory)
#undef V

  js_value_t *features = bare_cpu_info__features(env, &cpu.features);

  err = js_set_named_property(env, result, "features", features);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_cpu_info_features(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  cpuinfo_features_t features;
  err = cpuinfo_features(self->handle, &features);
  if (err < 0) {
    err = js_throw_error(env, NULL, "Could not query CPU features");
    assert(err == 0);

    return NULL;
  }

  return bare_cpu_info__features(env, &features);
}

static js_value_t *
bare_cpu_info_sample(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  cpuinfo_usage_t usage;
  err = cpuinfo_sample(self->handle, &usage);
  if (err < 0) {
    err = js_throw_error(env, NULL, "Could not sample CPU usage");
    assert(err == 0);

    return NULL;
  }

  return bare_cpu_info__usage(env, &usage);
}

static js_value_t *
bare_cpu_info_core_count(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, (int64_t) cpuinfo_core_count(self->handle), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_cpu_info_core_usage(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[1], &index);
  assert(err == 0);

  cpuinfo_usage_t usage;
  err = cpuinfo_core_usage(self->handle, index, &usage);
  if (err < 0) {
    err = js_throw_range_error(env, NULL, "Core index out of range");
    assert(err == 0);

    return NULL;
  }

  return bare_cpu_info__usage(env, &usage);
}

static js_value_t *
bare_cpu_info_core_type(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[1], &index);
  assert(err == 0);

  js_value_t *result;
  err = js_create_uint32(env, cpuinfo_core_type(self->handle, index), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_cpu_info_core_frequency(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[1], &index);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, (int64_t) cpuinfo_core_frequency(self->handle, index), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_cpu_info_core_cache(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_cpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[1], &index);
  assert(err == 0);

  uint32_t level;
  err = js_get_value_uint32(env, argv[2], &level);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, (int64_t) cpuinfo_core_cache(self->handle, index, level), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_cpu_info_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("init", bare_cpu_info_init)
  V("destroy", bare_cpu_info_destroy)
  V("query", bare_cpu_info_query)
  V("features", bare_cpu_info_features)
  V("sample", bare_cpu_info_sample)
  V("coreCount", bare_cpu_info_core_count)
  V("coreUsage", bare_cpu_info_core_usage)
  V("coreType", bare_cpu_info_core_type)
  V("coreFrequency", bare_cpu_info_core_frequency)
  V("coreCache", bare_cpu_info_core_cache)
#undef V

  return exports;
}

BARE_MODULE(bare_cpu_info, bare_cpu_info_exports)
