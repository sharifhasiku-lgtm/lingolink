#include <assert.h>
#include <bare.h>
#include <js.h>
#include <uv.h>

static js_value_t *
bare_stdio_guess_type(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  int64_t fd;
  err = js_get_value_int64(env, argv[0], &fd);
  assert(err == 0);

  uv_handle_type type = uv_guess_handle(fd);

  js_value_t *result;
  err = js_create_int64(env, type, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_stdio_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, msg) \
  { \
    js_value_t *val; \
    err = js_create_int64(env, UV_##name, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, #name, val); \
    assert(err == 0); \
  }

  UV_HANDLE_TYPE_MAP(V);
#undef V

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("guessType", bare_stdio_guess_type)
#undef V

  return exports;
}

BARE_MODULE(bare_stdio, bare_stdio_exports)
