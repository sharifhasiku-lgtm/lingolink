cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(bare_cpu_info C)

fetch_package("github:holepunchto/libcpuinfo#87b0dd6")

add_bare_module(bare_cpu_info)

target_sources(
  ${bare_cpu_info}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${bare_cpu_info}
  PRIVATE
    $<TARGET_OBJECTS:cpuinfo>
  PUBLIC
    cpuinfo
)
