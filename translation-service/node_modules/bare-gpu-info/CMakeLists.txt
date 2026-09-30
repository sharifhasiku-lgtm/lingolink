cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(bare_gpu_info C)

fetch_package("github:holepunchto/libgpuinfo#78c1f90")

add_bare_module(bare_gpu_info)

target_sources(
  ${bare_gpu_info}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${bare_gpu_info}
  PRIVATE
    $<TARGET_OBJECTS:gpuinfo>
  PUBLIC
    gpuinfo
)
