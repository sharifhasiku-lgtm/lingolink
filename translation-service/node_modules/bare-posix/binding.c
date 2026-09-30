#include <bare.h>
#include <grp.h>
#include <js.h>
#include <pwd.h>
#include <unistd.h>

static js_value_t *
bare_posix_getgid(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *result;
  err = js_create_uint32(env, getgid(), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_posix_setgid(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t gid;
  err = js_get_value_uint32(env, argv[0], &gid);
  assert(err == 0);

  err = setgid(gid);
  if (err == -1) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_posix_getegid(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *result;
  err = js_create_uint32(env, getegid(), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_posix_setegid(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t gid;
  err = js_get_value_uint32(env, argv[0], &gid);
  assert(err == 0);

  err = setegid(gid);
  if (err == -1) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_posix_getuid(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *result;
  err = js_create_uint32(env, getuid(), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_posix_setuid(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t uid;
  err = js_get_value_uint32(env, argv[0], &uid);
  assert(err == 0);

  err = setuid(uid);
  if (err == -1) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_posix_geteuid(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *result;
  err = js_create_uint32(env, geteuid(), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_posix_seteuid(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t uid;
  err = js_get_value_uint32(env, argv[0], &uid);
  assert(err == 0);

  err = seteuid(uid);
  if (err == -1) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_posix_getgroups(js_env_t *env, js_callback_info_t *info) {
  int err;

  int len = getgroups(0, NULL);
  if (len == -1) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  gid_t gids[len];
  len = getgroups(len, gids);
  if (len == -1) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  js_value_t *result;
  err = js_create_array_with_length(env, len, &result);
  assert(err == 0);

  for (size_t i = 0; i < len; i++) {
    js_value_t *gid;
    err = js_create_uint32(env, gids[i], &gid);
    assert(err == 0);

    err = js_set_element(env, result, i, gid);
    assert(err == 0);
  }

  return result;
}

static js_value_t *
bare_posix_getgrnam(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  size_t name_len;
  err = js_get_value_string_utf8(env, argv[0], NULL, 0, &name_len);
  assert(err == 0);

  utf8_t *name = malloc(++name_len);
  err = js_get_value_string_utf8(env, argv[0], name, name_len, &name_len);
  assert(err == 0);

  errno = 0;

  struct group *grp = getgrnam((char *) name);

  if (errno != 0) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    free(name);

    return NULL;
  }

  js_value_t *result;

  if (grp == NULL) {
    err = js_get_null(env, &result);
    assert(err == 0);

    free(name);

    return result;
  }

  err = js_create_object(env, &result);
  assert(err == 0);

  js_value_t *groupname;
  err = js_create_string_utf8(env, (utf8_t *) grp->gr_name, strlen(grp->gr_name), &groupname);
  assert(err == 0);

  err = js_set_named_property(env, result, "groupname", groupname);
  assert(err == 0);

  js_value_t *passwd;
  err = js_create_string_utf8(env, (utf8_t *) grp->gr_passwd, strlen(grp->gr_passwd), &passwd);
  assert(err == 0);

  err = js_set_named_property(env, result, "passwd", passwd);
  assert(err == 0);

  js_value_t *gid;
  err = js_create_int32(env, grp->gr_gid, &gid);
  assert(err == 0);

  err = js_set_named_property(env, result, "gid", gid);
  assert(err == 0);

  js_value_t *members;
  err = js_create_array(env, &members);
  assert(err == 0);

  for (uint32_t i = 0; grp->gr_mem[i] != NULL; i++) {
    js_value_t *member;
    err = js_create_string_utf8(env, (utf8_t *) grp->gr_mem[i], strlen(grp->gr_mem[i]), &member);
    assert(err == 0);

    err = js_set_element(env, members, i, member);
    assert(err == 0);
  }

  err = js_set_named_property(env, result, "members", members);
  assert(err == 0);

  free(name);

  return result;
}

static js_value_t *
bare_posix_getpwnam(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  size_t name_len;
  err = js_get_value_string_utf8(env, argv[0], NULL, 0, &name_len);
  assert(err == 0);

  utf8_t *name = malloc(++name_len);
  err = js_get_value_string_utf8(env, argv[0], name, name_len, &name_len);
  assert(err == 0);

  errno = 0;

  struct passwd *pwd = getpwnam((char *) name);

  if (errno != 0) {
    err = uv_translate_sys_error(errno);

    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    free(name);

    return NULL;
  }

  js_value_t *result;

  if (pwd == NULL) {
    err = js_get_null(env, &result);
    assert(err == 0);

    free(name);

    return result;
  }

  err = js_create_object(env, &result);
  assert(err == 0);

  js_value_t *username;
  err = js_create_string_utf8(env, (utf8_t *) pwd->pw_name, strlen(pwd->pw_name), &username);
  assert(err == 0);

  err = js_set_named_property(env, result, "username", username);
  assert(err == 0);

  js_value_t *passwd;
  err = js_create_string_utf8(env, (utf8_t *) pwd->pw_passwd, strlen(pwd->pw_passwd), &passwd);
  assert(err == 0);

  err = js_set_named_property(env, result, "passwd", passwd);
  assert(err == 0);

  js_value_t *uid;
  err = js_create_int32(env, pwd->pw_uid, &uid);
  assert(err == 0);

  err = js_set_named_property(env, result, "uid", uid);
  assert(err == 0);

  js_value_t *gid;
  err = js_create_int32(env, pwd->pw_gid, &gid);
  assert(err == 0);

  err = js_set_named_property(env, result, "gid", gid);
  assert(err == 0);

  js_value_t *gecos;
  err = js_create_string_utf8(env, (utf8_t *) pwd->pw_gecos, strlen(pwd->pw_gecos), &gecos);
  assert(err == 0);

  err = js_set_named_property(env, result, "gecos", gecos);
  assert(err == 0);

  js_value_t *homedir;
  err = js_create_string_utf8(env, (utf8_t *) pwd->pw_dir, strlen(pwd->pw_dir), &homedir);
  assert(err == 0);

  err = js_set_named_property(env, result, "homedir", homedir);
  assert(err == 0);

  js_value_t *shell;
  err = js_create_string_utf8(env, (utf8_t *) pwd->pw_shell, strlen(pwd->pw_shell), &shell);
  assert(err == 0);

  err = js_set_named_property(env, result, "shell", shell);
  assert(err == 0);

  free(name);

  return result;
}

static js_value_t *
bare_posix_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("getgid", bare_posix_getgid)
  V("setgid", bare_posix_setgid)

  V("getegid", bare_posix_getegid)
  V("setegid", bare_posix_setegid)

  V("getuid", bare_posix_getuid)
  V("setuid", bare_posix_setuid)

  V("geteuid", bare_posix_geteuid)
  V("seteuid", bare_posix_seteuid)

  V("getgroups", bare_posix_getgroups)

  V("getgrnam", bare_posix_getgrnam)
  V("getpwnam", bare_posix_getpwnam)
#undef V

  return exports;
}

BARE_MODULE(bare_posix, bare_posix_exports)
