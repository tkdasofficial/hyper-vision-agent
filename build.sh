#!/usr/bin/env bash
set -e

echo "=== Building Hyper Vision Agent (C++17 Engine) ==="

BUILD_DIR="build"
mkdir -p "${BUILD_DIR}"
cd "${BUILD_DIR}"

cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . -j"$(nproc)"

echo "=== Hyper Vision Agent Build Complete! ==="
echo "Executable: ${BUILD_DIR}/hyper_vision_agent_engine"
