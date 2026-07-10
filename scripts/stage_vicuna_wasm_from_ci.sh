#!/usr/bin/env bash
#
# stage_vicuna_wasm_from_ci.sh
#
# Copy Vicuna custom-ctx .wasm artifacts from a GitHub Actions download
# into .vps-staging/wasm-libs/ for VPS upload.
#
# Usage:
#   1. Run workflow: Actions → "Build Custom Vicuna-7B WASM" (ctx 512 and 1024)
#   2. Download artifacts to ~/Downloads/
#   3. ./scripts/stage_vicuna_wasm_from_ci.sh ~/Downloads/vicuna-7b-wasm-ctx512 ~/Downloads/vicuna-7b-wasm-ctx1024
#
set -euo pipefail

OUTPUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.vps-staging/wasm-libs"
mkdir -p "$OUTPUT_DIR"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <artifact-dir> [artifact-dir ...]"
  echo "  Each dir should contain vicuna-7b-q4f32_1-ctx*_cs1k-webgpu.wasm"
  exit 1
fi

for dir in "$@"; do
  if [[ ! -d "$dir" ]]; then
    echo "Not a directory: $dir" >&2
    exit 1
  fi
  for wasm in "$dir"/vicuna-7b-q4f32_1-ctx*.wasm; do
    [[ -f "$wasm" ]] || continue
    cp -v "$wasm" "$OUTPUT_DIR/"
    info="${wasm}.BUILD_INFO.txt"
    [[ -f "$info" ]] && cp -v "$info" "$OUTPUT_DIR/"
  done
done

echo ""
echo "Staged:"
ls -lh "$OUTPUT_DIR"/vicuna-7b-q4f32_1-ctx*.wasm 2>/dev/null || echo "  (no vicuna wasm found — check artifact paths)"
echo ""
echo "Next: python scripts/upload_staged_to_vps.py && python scripts/verify_model_urls.py"
