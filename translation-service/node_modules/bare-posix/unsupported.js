exports.getgid = function getgid() {
  return -1
}

exports.setgid = function setgid() {
  throw new Error('Platform not supported')
}

exports.getegid = function getegid() {
  return -1
}

exports.setegid = function setgid() {
  throw new Error('Platform not supported')
}

exports.getuid = function getuid() {
  return -1
}

exports.setuid = function setgid() {
  throw new Error('Platform not supported')
}

exports.geteuid = function geteuid() {
  return -1
}

exports.seteuid = function setgid() {
  throw new Error('Platform not supported')
}

exports.getgroups = function getgroups() {
  return []
}

exports.getgrnam = function getgrnam() {
  return null
}

exports.getpwnam = function getpwnam() {
  return null
}
