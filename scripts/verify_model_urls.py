#!/usr/bin/env python3
"""
Verify that all self-hosted model URLs on the VPS are reachable
and support HTTP Range requests (required for WebLLM).
"""

import asyncio
import sys
from urllib.parse import urljoin
import aiohttp

VPS_BASE = "https://storage.noahcohn.com/models/"

# Models and representative files to check
CHECKS = [
    # MLC FP32
    ("MLC FP32: Llama-2-7b", "/Llama-2-7b-chat-hf-q4f32_1-MLC/mlc-chat-config.json"),
    ("MLC FP32: Hermes-3-3B", "/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/mlc-chat-config.json"),
    ("MLC FP32: Llama-3.2-3B", "/Llama-3.2-3B-Instruct-q4f32_1-MLC/mlc-chat-config.json"),
    ("MLC FP32: Vicuna-7B", "/vicuna-7b-q4f32-webllm/mlc-chat-config.json"),
    # MLC FP16
    ("MLC FP16: Llama-3.1-8B", "/Llama-3.1-8B-Instruct-q4f16_1-MLC/mlc-chat-config.json"),
    ("MLC FP16: Hermes-3-8B", "/Hermes-3-Llama-3.1-8B-q4f16_1-MLC/mlc-chat-config.json"),
    # WASM libs
    ("WASM: Llama-2", "/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm"),
    ("WASM: Llama-3.2 q4f32", "/wasm-libs/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm"),
    ("WASM: Llama-3.1 q4f16", "/wasm-libs/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm"),
    # GGUF
    ("GGUF: Hermes-3-8B", "/gguf/Hermes-3-Llama-3.1-8B.Q4_K_M.gguf"),
    ("GGUF: Vicuna-7B", "/gguf/vicuna-7b-v1.5.Q4_K_M.gguf"),
    ("GGUF: Hermes-3-3B", "/gguf/Hermes-3-Llama-3.2-3B.Q4_K_M.gguf"),
    # Transformers.js (check config.json for one model)
    ("Transformers: Qwen-0.5B", "/transformers/onnx-community/Qwen2.5-0.5B-Instruct/config.json"),
    # TTS
    ("TTS: tts.json", "/tts/onnx/tts.json"),
    ("TTS: duration_predictor", "/tts/onnx/duration_predictor.onnx"),
    ("TTS: vector_estimator", "/tts/onnx/vector_estimator.onnx"),
    # Voice styles
    ("Voice: M1", "/tts/voice_styles/M1.json"),
    ("Voice: F1", "/tts/voice_styles/F1.json"),
    # wllama
    ("wllama: single-thread", "/wllama-wasm/single-thread.wasm"),
    ("wllama: multi-thread", "/wllama-wasm/multi-thread.wasm"),
]


async def check_url(session: aiohttp.ClientSession, name: str, path: str):
    # Strip leading slash to ensure proper relative joining with VPS_BASE
    url = VPS_BASE + path.lstrip('/')
    try:
        # HEAD request with Range header
        async with session.head(url, headers={"Range": "bytes=0-1023"}, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            ok = resp.status in (200, 206)
            ranges_ok = resp.headers.get("Accept-Ranges") == "bytes"
            cors_ok = resp.headers.get("Access-Control-Allow-Origin") is not None
            size = resp.headers.get("Content-Length") or resp.headers.get("content-length") or "?"
            return {
                "name": name,
                "url": url,
                "ok": ok,
                "ranges": ranges_ok,
                "cors": cors_ok,
                "status": resp.status,
                "size": size,
            }
    except Exception as e:
        return {
            "name": name,
            "url": url,
            "ok": False,
            "ranges": False,
            "cors": False,
            "status": f"ERROR: {e}",
            "size": "?",
        }


async def main():
    print(f"Verifying model URLs on {VPS_BASE}\n")
    
    async with aiohttp.ClientSession() as session:
        tasks = [check_url(session, name, path) for name, path in CHECKS]
        results = await asyncio.gather(*tasks)
    
    all_ok = True
    for r in results:
        status_icon = "✅" if r["ok"] else "❌"
        range_icon = "R" if r["ranges"] else "r"
        cors_icon = "C" if r["cors"] else "c"
        print(f"{status_icon} [{range_icon}{cors_icon}] {r['name']:<35} HTTP {r['status']} (size={r['size']})")
        if not r["ok"]:
            all_ok = False
            print(f"   URL: {r['url']}")
    
    print()
    if all_ok:
        print("All checks passed! Models are ready.")
        sys.exit(0)
    else:
        print("Some checks failed. Verify the upload and nginx configuration.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
