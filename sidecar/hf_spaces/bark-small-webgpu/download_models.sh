#!/bin/sh
# Download quantized Bark-small ONNX shards (build-time for HF Docker Space).
# Source: https://github.com/ford442/suno_bark_small_webgpu
set -eu

DIR="${MODEL_DIR:-/app/models/bark-small}"
BASE="${ONNX_CDN:-https://1ink.us/files/barksmall}"

mkdir -p "$DIR"

for file in \
  semantic_model_quantized.onnx \
  coarse_acoustics_model_quantized.onnx \
  fine_acoustics_model_quantized.onnx
do
  dest="$DIR/$file"
  if [ -f "$dest" ]; then
    echo "✓ $file already present"
    continue
  fi
  echo "⬇️  $file"
  wget -q --show-progress -O "$dest" "$BASE/$file"
done

echo "✅ Bark ONNX models ready in $DIR"
ls -lh "$DIR"/*.onnx
