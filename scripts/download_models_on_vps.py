#!/usr/bin/env python3
"""
Download all Jokesters models directly on the VPS (storage.noahcohn.com).

Run this script ON the VPS to avoid copying 35GB+ over the network.
It downloads models from HuggingFace, GitHub, and 1ink.us directly to
/data/files/models/ with the correct directory structure.

Usage (on the VPS):
    cd /root/the_jokesters
    pip install huggingface_hub
    python3 scripts/download_models_on_vps.py
"""

import json
import os
import sys
import shutil
from pathlib import Path
from urllib.request import urlretrieve

try:
    from huggingface_hub import snapshot_download, hf_hub_download
except ImportError:
    print("❌ huggingface_hub is required. Install with: pip install huggingface_hub")
    sys.exit(1)

# Base directory on the VPS
BASE_DIR = Path("/data/files/models")
BASE_DIR.mkdir(parents=True, exist_ok=True)

# MLC WebLLM models: (local_dir_name, repo_id)
MLC_MODELS = [
    ("Llama-2-7b-chat-hf-q4f32_1-MLC", "mlc-ai/Llama-2-7b-chat-hf-q4f32_1-MLC"),
    ("Hermes-3-Llama-3.2-3B-q4f32_1-MLC", "mlc-ai/Hermes-3-Llama-3.2-3B-q4f32_1-MLC"),
    ("Llama-3.2-3B-Instruct-q4f32_1-MLC", "mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC"),
    ("vicuna-7b-q4f32-webllm", "ford442/vicuna-7b-q4f32-webllm"),
    ("Llama-3.1-8B-Instruct-q4f16_1-MLC", "mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC"),
    ("Llama-3.2-3B-Instruct-q4f16_1-MLC", "mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC"),
    ("Hermes-3-Llama-3.1-8B-q4f16_1-MLC", "mlc-ai/Hermes-3-Llama-3.1-8B-q4f16_1-MLC"),
    ("Hermes-3-Llama-3.2-3B-q4f16_1-MLC", "mlc-ai/Hermes-3-Llama-3.2-3B-q4f16_1-MLC"),
]

# WASM model libraries from GitHub raw
WASM_LIBS = [
    ("Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
     "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm"),
    ("Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
     "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm"),
    ("Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
     "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm"),
]

# GGUF models: (filename, repo_id, hf_file)
GGUF_FILES = [
    ("Hermes-3-Llama-3.1-8B.Q4_K_M.gguf", "NousResearch/Hermes-3-Llama-3.1-8B-GGUF", "Hermes-3-Llama-3.1-8B.Q4_K_M.gguf"),
    ("vicuna-7b-v1.5.Q4_K_M.gguf", "TheBloke/vicuna-7B-v1.5-GGUF", "vicuna-7b-v1.5.Q4_K_M.gguf"),
    ("Hermes-3-Llama-3.2-3B.Q4_K_M.gguf", "NousResearch/Hermes-3-Llama-3.2-3B-GGUF", "Hermes-3-Llama-3.2-3B.Q4_K_M.gguf"),
]

# wllama WASM binaries — version pinned to package-lock.json (not @latest)
def _wllama_version() -> str:
    lock_path = Path(__file__).resolve().parent.parent / "package-lock.json"
    with open(lock_path, encoding="utf-8") as f:
        lock = json.load(f)
    version = lock.get("packages", {}).get("node_modules/@wllama/wllama", {}).get("version")
    if not version:
        raise RuntimeError("Could not read @wllama/wllama version from package-lock.json")
    return version


WLLAMA_VERSION = _wllama_version()
WLLAMA_WASM = [
    ("single-thread.wasm", f"https://cdn.jsdelivr.net/npm/@wllama/wllama@{WLLAMA_VERSION}/esm/single-thread/wllama.wasm"),
    ("multi-thread.wasm", f"https://cdn.jsdelivr.net/npm/@wllama/wllama@{WLLAMA_VERSION}/esm/multi-thread/wllama.wasm"),
]

# TTS ONNX models required by SupertonicPipeline (src/audio/SupertonicPipeline.ts)
TTS_FILES = [
    "tts.json",
    "unicode_indexer.json",
    "duration_predictor.onnx",
    "text_encoder.onnx",
    "vector_estimator.onnx",
    "vocoder.onnx",
]
TTS_BASE_URL = os.environ.get(
    "TTS_BASE_URL",
    "https://storage.1ink.us/models/tts/onnx",
)

# Voice styles
VOICE_STYLES = ["M1.json", "M2.json", "F1.json", "F2.json"]
VOICE_BASE_URL = os.environ.get(
    "VOICE_BASE_URL",
    "https://storage.1ink.us/models/tts/voice_styles",
)


def download_file(url: str, dest: Path):
    """Download a file with progress."""
    if dest.exists():
        print(f"  ⏭️  {dest.name} already exists, skipping")
        return
    print(f"  ⬇️  {url}")
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    urlretrieve(url, tmp)
    tmp.rename(dest)
    print(f"  ✓ {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")


def download_mlc_models():
    print("\n📦 Downloading MLC WebLLM models...")
    for local_name, repo_id in MLC_MODELS:
        dest = BASE_DIR / local_name
        if dest.exists() and any(dest.iterdir()):
            print(f"  ⏭️  {local_name} already exists, skipping")
            continue
        print(f"  ⬇️  {repo_id}")
        snapshot_download(repo_id=repo_id, local_dir=str(dest), local_dir_use_symlinks=False)
        print(f"  ✓ Done {local_name}")


def download_wasm_libs():
    print("\n📚 Downloading WASM model libraries...")
    wasm_dir = BASE_DIR / "wasm-libs"
    wasm_dir.mkdir(exist_ok=True)
    for filename, url in WASM_LIBS:
        download_file(url, wasm_dir / filename)


def download_gguf_models():
    print("\n🦙 Downloading GGUF models...")
    gguf_dir = BASE_DIR / "gguf"
    gguf_dir.mkdir(exist_ok=True)
    for filename, repo_id, hf_file in GGUF_FILES:
        dest = gguf_dir / filename
        if dest.exists():
            print(f"  ⏭️  {filename} already exists, skipping")
            continue
        print(f"  ⬇️  {repo_id}/{hf_file}")
        downloaded = hf_hub_download(repo_id=repo_id, filename=hf_file, local_dir=str(gguf_dir))
        downloaded_path = Path(downloaded)
        if downloaded_path.parent != gguf_dir:
            shutil.copy2(downloaded_path, dest)
        print(f"  ✓ {filename}")


def download_wllama_wasm():
    print("\n⚙️  Downloading wllama WASM binaries...")
    wllama_dir = BASE_DIR / "wllama-wasm"
    wllama_dir.mkdir(exist_ok=True)
    for filename, url in WLLAMA_WASM:
        download_file(url, wllama_dir / filename)


def download_tts_models():
    print("\n🎙️  Downloading TTS ONNX models...")
    tts_dir = BASE_DIR / "tts" / "onnx"
    tts_dir.mkdir(parents=True, exist_ok=True)
    for filename in TTS_FILES:
        url = f"{TTS_BASE_URL}/{filename}"
        download_file(url, tts_dir / filename)


def download_voice_styles():
    print("\n🗣️  Downloading voice styles...")
    voice_dir = BASE_DIR / "tts" / "voice_styles"
    voice_dir.mkdir(parents=True, exist_ok=True)
    for filename in VOICE_STYLES:
        url = f"{VOICE_BASE_URL}/{filename}"
        download_file(url, voice_dir / filename)


def print_summary():
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print("=" * 60)
    total_size = sum(
        f.stat().st_size for f in BASE_DIR.rglob("*") if f.is_file()
    )
    print(f"Total size in {BASE_DIR}: {total_size / 1e9:.2f} GB")
    print("\nDirectory structure:")
    for item in sorted(BASE_DIR.iterdir()):
        if item.is_dir():
            size = sum(f.stat().st_size for f in item.rglob("*") if f.is_file())
            print(f"  📁 {item.name}/  ({size / 1e9:.2f} GB)")
    print("\nNext steps:")
    print("  1. Verify nginx is serving /data/files/models/")
    print("  2. Test a URL: curl -I https://storage.noahcohn.com/models/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm")
    print("  3. Reload nginx if needed: sudo nginx -t && sudo systemctl reload nginx")
    print("=" * 60)


def main():
    print("Jokesters Model Downloader for VPS")
    print(f"Target directory: {BASE_DIR}")
    print("This will download ~35 GB of models. Press Ctrl+C to abort.")
    print("Starting in 3 seconds...")
    import time
    time.sleep(3)

    download_mlc_models()
    download_wasm_libs()
    download_gguf_models()
    download_wllama_wasm()
    download_tts_models()
    download_voice_styles()

    print_summary()


if __name__ == "__main__":
    main()
