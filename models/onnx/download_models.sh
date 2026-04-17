#!/bin/bash
# Download TTS ONNX models from self-hosted VPS
set -e

BASE_URL="https://storage.noahcohn.com/models/tts/onnx"

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
