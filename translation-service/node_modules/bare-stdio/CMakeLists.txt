cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

project(bare_stdio C)

add_bare_module(bare_stdio)

target_sources(
  ${bare_stdio}
  PRIVATE
    binding.c
)
