cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)
find_package(cmake-napi REQUIRED PATHS node_modules/cmake-napi)

project(rabin_native C)

bare_target(target)

fetch_package("github:holepunchto/librabin#2e4f70b")

add_bare_module(rabin_native_bare)

target_sources(
  ${rabin_native_bare}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${rabin_native_bare}
  PRIVATE
    $<TARGET_OBJECTS:rabin>
  PUBLIC
    rabin
)

add_napi_module(rabin_native_node)

target_sources(
  ${rabin_native_node}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${rabin_native_node}
  PRIVATE
    $<TARGET_OBJECTS:rabin>
  PUBLIC
    rabin
)

target_compile_definitions(
  ${rabin_native_node}
  PRIVATE
    NAPI_VERSION=9
)

resolve_node_module(bare-compat-napi compat)

target_include_directories(
  ${rabin_native_node}
  PRIVATE
    "${compat}/include"
)
