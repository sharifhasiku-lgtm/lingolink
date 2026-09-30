cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

project(bare_posix C)

add_bare_module(bare_posix)

target_sources(
  ${bare_posix}
  PRIVATE
    binding.c
)
