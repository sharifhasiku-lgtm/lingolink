#include <assert.h>
#include <bare.h>
#include <js.h>
#include <rabin.h>
#include <uv.h>

typedef struct {
  rabin_t context;
} rabin_native_t;

static js_value_t *
rabin_native_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  uint32_t min_size;
  err = js_get_value_uint32(env, argv[0], &min_size);
  assert(err == 0);

  uint32_t max_size;
  err = js_get_value_uint32(env, argv[1], &max_size);
  assert(err == 0);

  js_value_t *handle;

  rabin_native_t *chunker;
  err = js_create_arraybuffer(env, sizeof(rabin_native_t), (void **) &chunker, &handle);
  assert(err == 0);

  rabin_init(&chunker->context);

  chunker->context.chunk_min = min_size;
  chunker->context.chunk_max = max_size;

  return handle;
}

static js_value_t *
rabin_native_push(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  rabin_native_t *chunker;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &chunker, NULL);
  assert(err == 0);

  void *data;
  err = js_get_arraybuffer_info(env, argv[1], &data, NULL);
  assert(err == 0);

  int64_t offset;
  err = js_get_value_int64(env, argv[2], &offset);
  assert(err == 0);

  int64_t len;
  err = js_get_value_int64(env, argv[3], &len);
  assert(err == 0);

  len = rabin_push(&chunker->context, &data[offset], len);

  js_value_t *result;
  err = js_create_int64(env, len, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
rabin_native_end(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  rabin_native_t *chunker;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &chunker, NULL);
  assert(err == 0);

  int64_t len = rabin_end(&chunker->context);

  js_value_t *result;
  err = js_create_int64(env, len, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
rabin_native_last_chunk(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  rabin_native_t *chunker;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &chunker, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_object(env, &result);
  assert(err == 0);

#define V(name, property) \
  { \
    js_value_t *val; \
    err = js_create_int64(env, chunker->context.last_chunk.property, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, result, name, val); \
    assert(err == 0); \
  }

  V("length", length)
  V("offset", offset)
#undef V

  return result;
}

static js_value_t *
rabin_native_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("init", rabin_native_init)
  V("push", rabin_native_push)
  V("end", rabin_native_end)
  V("lastChunk", rabin_native_last_chunk)
#undef V

  return exports;
}

BARE_MODULE(rabin_native, rabin_native_exports)
