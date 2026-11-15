#!/bin/bash
# Download TTS ONNX models from self-hosted VPS
set -e

# Canonical host = VPS_STORAGE_ORIGIN in src/utils/vpsStorageUrl.ts; override like the app's
# VITE_VPS_STORAGE_ORIGIN. Do not hardcode the mirror (storage.noahcohn.com) here.
VPS_STORAGE_ORIGIN="${VITE_VPS_STORAGE_ORIGIN:-${VPS_STORAGE_ORIGIN:-https://storage.1ink.us}}"
BASE_URL="${VPS_STORAGE_ORIGIN}/models/tts/onnx"

wget "${BASE_URL}/duration_predictor.onnx"
wget "${BASE_URL}/text_encoder.onnx"
wget "${BASE_URL}/vector_estimator.onnx"
wget "${BASE_URL}/vocoder.onnx"
wget "${BASE_URL}/tts.json"
wget "${BASE_URL}/unicode_indexer.json"
wget "${BASE_URL}/latent_denoiser.onnx"
wget "${BASE_URL}/latent_denoiser.onnx_data"
wget "${BASE_URL}/text_encoder.onnx_data"
wget "${BASE_URL}/voice_decoder.onnx"
wget "${BASE_URL}/voice_decoder.onnx_data"
