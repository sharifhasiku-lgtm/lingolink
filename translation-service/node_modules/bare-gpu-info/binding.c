#include <assert.h>
#include <bare.h>
#include <gpuinfo.h>
#include <js.h>
#include <stdint.h>
#include <stdlib.h>
#include <utf.h>

typedef struct {
  gpuinfo_t *handle;
} bare_gpu_info_t;

static js_value_t *
bare_gpu_info__drivers(js_env_t *env, const gpuinfo_drivers_t *drivers) {
  int err;

  js_value_t *result;
  err = js_create_object(env, &result);
  assert(err == 0);

#define V(name, property) \
  { \
    js_value_t *val; \
    err = js_get_boolean(env, drivers->property, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, result, name, val); \
    assert(err == 0); \
  }

  V("vulkan", vulkan)
  V("opencl", opencl)
  V("opengl", opengl)
  V("webgpu", webgpu)
  V("metal", metal)
  V("direct3d11", direct3d11)
  V("direct3d12", direct3d12)
  V("cuda", cuda)
  V("levelZero", level_zero)
  V("rocm", rocm)
#undef V

  return result;
}

static void
bare_gpu_info__on_finalize(js_env_t *env, void *data, void *finalize_hint) {
  bare_gpu_info_t *self = data;

  if (self->handle != NULL) gpuinfo_destroy(self->handle);

  free(self);
}

static js_value_t *
bare_gpu_info_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_gpu_info_t *self = malloc(sizeof(bare_gpu_info_t));
  self->handle = NULL;

  err = gpuinfo_init(&self->handle);
  if (err < 0) {
    free(self);

    err = js_throw_error(env, NULL, "Could not initialize GPU information");
    assert(err == 0);

    return NULL;
  }

  err = js_wrap(env, argv[0], self, bare_gpu_info__on_finalize, NULL, NULL);
  assert(err == 0);

  return NULL;
}

static js_value_t *
bare_gpu_info_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_gpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  if (self->handle != NULL) {
    gpuinfo_destroy(self->handle);

    self->handle = NULL;
  }

  return NULL;
}

static js_value_t *
bare_gpu_info_drivers(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_gpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  gpuinfo_drivers_t drivers;
  err = gpuinfo_drivers(self->handle, &drivers);
  if (err < 0) {
    err = js_throw_error(env, NULL, "Could not query GPU drivers");
    assert(err == 0);

    return NULL;
  }

  return bare_gpu_info__drivers(env, &drivers);
}

static js_value_t *
bare_gpu_info_count(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_gpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  js_value_t *result;
  err = js_create_uint32(env, gpuinfo_gpu_count(self->handle), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_gpu_info_query(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_gpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[1], &index);
  assert(err == 0);

  gpuinfo_gpu_t gpu;
  err = gpuinfo_gpu_query(self->handle, index, &gpu);
  if (err < 0) {
    err = js_throw_range_error(env, NULL, "GPU index out of range");
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

  V("name", js_create_string_utf8, (const utf8_t *) gpu.name, -1)
  V("vendor", js_create_string_utf8, (const utf8_t *) gpu.vendor, -1)
  V("driverName", js_create_string_utf8, (const utf8_t *) gpu.driver_name, -1)
  V("driverVersion", js_create_string_utf8, (const utf8_t *) gpu.driver_version, -1)
  V("type", js_create_uint32, gpu.type)
  V("vendorId", js_create_uint32, gpu.vendor_id)
  V("deviceId", js_create_uint32, gpu.device_id)
  V("subsystemId", js_create_uint32, gpu.subsystem_id)
  V("revision", js_create_uint32, gpu.revision)
  V("unifiedMemory", js_get_boolean, gpu.unified_memory)
  V("memory", js_create_int64, (int64_t) gpu.memory)
#undef V

  js_value_t *drivers = bare_gpu_info__drivers(env, &gpu.drivers);

  err = js_set_named_property(env, result, "drivers", drivers);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_gpu_info_sample(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_gpu_info_t *self;
  err = js_unwrap(env, argv[0], (void **) &self);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[1], &index);
  assert(err == 0);

  gpuinfo_usage_t usage;
  err = gpuinfo_gpu_sample(self->handle, index, &usage);
  if (err < 0) {
    err = js_throw_range_error(env, NULL, "GPU index out of range");
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

  V("compute", js_create_double, usage.compute)
  V("encode", js_create_double, usage.encode)
  V("decode", js_create_double, usage.decode)
  V("power", js_create_double, usage.power)
  V("temperature", js_create_double, usage.temperature)
  V("memoryUsed", js_create_int64, (int64_t) usage.memory_used)
  V("memoryTotal", js_create_int64, (int64_t) usage.memory_total)
#undef V

  return result;
}

static js_value_t *
bare_gpu_info_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("init", bare_gpu_info_init)
  V("destroy", bare_gpu_info_destroy)
  V("drivers", bare_gpu_info_drivers)
  V("count", bare_gpu_info_count)
  V("query", bare_gpu_info_query)
  V("sample", bare_gpu_info_sample)
#undef V

  return exports;
}

BARE_MODULE(bare_gpu_info, bare_gpu_info_exports)
