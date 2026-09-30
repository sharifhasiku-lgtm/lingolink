const binding = require('./binding')

exports.getgid = binding.getgid

exports.setgid = function setgid(id) {
  if (typeof id === 'string') id = exports.getgrnam(id).gid

  binding.setgid(id)
}

exports.getegid = binding.getegid

exports.setegid = function setegid(id) {
  if (typeof id === 'string') id = exports.getgrnam(id).gid

  binding.setegid(id)
}

exports.getuid = binding.getuid

exports.setuid = function setuid(id) {
  if (typeof id === 'string') id = exports.getpwnam(id).uid

  binding.setuid(id)
}

exports.geteuid = binding.geteuid

exports.seteuid = function seteuid(id) {
  if (typeof id === 'string') id = exports.getpwnam(id).uid

  binding.seteuid(id)
}

exports.getgroups = binding.getgroups

exports.getgrnam = binding.getgrnam

exports.getpwnam = binding.getpwnam
