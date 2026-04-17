#!/usr/bin/env python3
"""
Migrate all Jokesters models from HuggingFace/CDNs to the VPS (storage.noahcohn.com).

This script:
1. Downloads all required models from HuggingFace to .vps-staging/
2. Organizes them into the correct directory structure
3. Stages small assets (WASM libs, TTS models, wllama WASM)
4. Creates a companion upload script (upload_staged_to_vps.py)

Run this first, then run upload_staged_to_vps.py from a machine with SSH access.
"""

import os
import sys
import shutil
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from huggingface_hub import snapshot_download, hf_hub_download
except ImportError:
    print("❌ huggingface_hub is required. Install with: pip install huggingface_hub")
    sys.exit(1)

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
STAGING_DIR = PROJECT_ROOT / ".vps-staging"
VPS_HOST = os.environ.get("VPS_HOST", "storage.noahcohn.com")
VPS_USER = os.environ.get("VPS_USER", "root")
VPS_MODELS_DIR = "/data/files/models"

# Models to download from HuggingFace
# Format: (local_dir_name, repo_id, allow_patterns)
MLC_MODELS = [
    ("Llama-2-7b-chat-hf-q4f32_1-MLC", "mlc-ai/Llama-2-7b-chat-hf-q4f32_1-MLC", None),
    ("Hermes-3-Llama-3.2-3B-q4f32_1-MLC", "mlc-ai/Hermes-3-Llama-3.2-3B-q4f32_1-MLC", None),
    ("Llama-3.2-3B-Instruct-q4f32_1-MLC", "mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC", None),
    ("vicuna-7b-q4f32-webllm", "ford442/vicuna-7b-q4f32-webllm", None),
    ("Llama-3.1-8B-Instruct-q4f16_1-MLC", "mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC", None),
    ("Llama-3.2-3B-Instruct-q4f16_1-MLC", "mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC", None),
    ("Hermes-3-Llama-3.1-8B-q4f16_1-MLC", "mlc-ai/Hermes-3-Llama-3.1-8B-q4f16_1-MLC", None),
    ("Hermes-3-Llama-3.2-3B-q4f16_1-MLC", "mlc-ai/Hermes-3-Llama-3.2-3B-q4f16_1-MLC", None),
]

TRANSFORMERS_MODELS = [
    # Only download ONNX and config files to save VPS storage
    ("onnx-community/Qwen2.5-0.5B-Instruct", "onnx-community/Qwen2.5-0.5B-Instruct", ["*.json", "*.txt", "*.onnx", "*.onnx_data", "tokenizer*", "preprocessor*", "vocab*", "merges*"]),
    ("onnx-community/Qwen2.5-1.5B-Instruct", "onnx-community/Qwen2.5-1.5B-Instruct", ["*.json", "*.txt", "*.onnx", "*.onnx_data", "tokenizer*", "preprocessor*", "vocab*", "merges*"]),
    ("onnx-community/Phi-3-mini-4k-instruct-onnx-web", "onnx-community/Phi-3-mini-4k-instruct-onnx-web", ["*.json", "*.txt", "*.onnx", "*.onnx_data", "tokenizer*", "preprocessor*", "vocab*", "merges*"]),
    ("onnx-community/Llama-3.2-1B-Instruct", "onnx-community/Llama-3.2-1B-Instruct", ["*.json", "*.txt", "*.onnx", "*.onnx_data", "tokenizer*", "preprocessor*", "vocab*", "merges*"]),
]

GGUF_FILES = [
    ("Hermes-3-Llama-3.1-8B.Q4_K_M.gguf", "NousResearch/Hermes-3-Llama-3.1-8B-GGUF", "Hermes-3-Llama-3.1-8B.Q4_K_M.gguf"),
    ("vicuna-7b-v1.5.Q4_K_M.gguf", "TheBloke/vicuna-7B-v1.5-GGUF", "vicuna-7b-v1.5.Q4_K_M.gguf"),
    ("Hermes-3-Llama-3.2-3B.Q4_K_M.gguf", "NousResearch/Hermes-3-Llama-3.2-3B-GGUF", "Hermes-3-Llama-3.2-3B.Q4_K_M.gguf"),
]


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def download_mlc_models():
    print("\n📦 Downloading MLC WebLLM models...")
    for local_name, repo_id, patterns in MLC_MODELS:
        dest = STAGING_DIR / local_name
        if dest.exists() and any(dest.iterdir()):
            print(f"  ⏭️  {local_name} already staged, skipping")
            continue
        print(f"  ⬇️  {repo_id} -> {local_name}")
        snapshot_download(repo_id=repo_id, local_dir=str(dest), local_dir_use_symlinks=False)


def download_transformers_models():
    print("\n🤖 Downloading Transformers.js models (ONNX only)...")
    transformers_base = STAGING_DIR / "transformers"
    for local_name, repo_id, patterns in TRANSFORMERS_MODELS:
        dest = transformers_base / local_name
        if dest.exists() and any(dest.iterdir()):
            print(f"  ⏭️  {local_name} already staged, skipping")
            continue
        print(f"  ⬇️  {repo_id} -> transformers/{local_name}")
        kwargs = {"repo_id": repo_id, "local_dir": str(dest), "local_dir_use_symlinks": False}
        if patterns:
            kwargs["allow_patterns"] = patterns
        snapshot_download(**kwargs)


def download_gguf_models():
    print("\n🦙 Downloading GGUF models...")
    gguf_dir = STAGING_DIR / "gguf"
    ensure_dir(gguf_dir)
    for filename, repo_id, hf_file in GGUF_FILES:
        dest = gguf_dir / filename
        if dest.exists():
            print(f"  ⏭️  {filename} already staged, skipping")
            continue
        print(f"  ⬇️  {repo_id}/{hf_file} -> gguf/{filename}")
        downloaded = hf_hub_download(repo_id=repo_id, filename=hf_file, local_dir=str(gguf_dir))
        # hf_hub_download may rename the file if cache is used, ensure it's in gguf_dir
        downloaded_path = Path(downloaded)
        if downloaded_path.parent != gguf_dir:
            shutil.copy2(downloaded_path, dest)


def stage_small_assets():
    """Verify small assets (WASM, TTS, wllama) are already in staging."""
    print("\n📋 Checking small assets...")
    
    required = {
        STAGING_DIR / "wasm-libs" / "Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm": "WASM lib (Llama-2)",
        STAGING_DIR / "wasm-libs" / "Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm": "WASM lib (Llama-3.2 q4f32)",
        STAGING_DIR / "wasm-libs" / "Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm": "WASM lib (Llama-3.1 q4f16)",
        STAGING_DIR / "wllama-wasm" / "single-thread.wasm": "wllama single-thread",
        STAGING_DIR / "wllama-wasm" / "multi-thread.wasm": "wllama multi-thread",
        STAGING_DIR / "tts" / "onnx" / "tts.json": "TTS config",
        STAGING_DIR / "tts" / "onnx" / "duration_predictor.onnx": "TTS duration predictor",
        STAGING_DIR / "tts" / "onnx" / "text_encoder.onnx": "TTS text encoder",
        STAGING_DIR / "tts" / "onnx" / "vector_estimator.onnx": "TTS vector estimator",
        STAGING_DIR / "tts" / "onnx" / "vocoder.onnx": "TTS vocoder",
        STAGING_DIR / "tts" / "voice_styles" / "M1.json": "Voice style M1",
        STAGING_DIR / "tts" / "voice_styles" / "M2.json": "Voice style M2",
        STAGING_DIR / "tts" / "voice_styles" / "F1.json": "Voice style F1",
        STAGING_DIR / "tts" / "voice_styles" / "F2.json": "Voice style F2",
    }
    
    missing = []
    for path, desc in required.items():
        if path.exists():
            print(f"  ✅ {desc}")
        else:
            print(f"  ❌ {desc} MISSING: {path}")
            missing.append(str(path))
    
    if missing:
        print("\n⚠️  Some small assets are missing. Run the following to fetch them:")
        print("  cd .vps-staging/wasm-libs && curl -O <wasm-urls>")
        print("  cd .vps-staging/tts && ./download_tts_assets.sh")
        return False
    return True


def generate_upload_script():
    """Generate upload_staged_to_vps.py for the user to run with SSH access."""
    script_path = PROJECT_ROOT / "scripts" / "upload_staged_to_vps.py"
    script_content = f'''#!/usr/bin/env python3
"""
Upload all staged models from .vps-staging/ to the VPS.

Run this from a machine with SSH key access to {VPS_HOST}.
"""

import os
import sys
import paramiko
from pathlib import Path

VPS_HOST = os.environ.get("VPS_HOST", "{VPS_HOST}")
VPS_USER = os.environ.get("VPS_USER", "{VPS_USER}")
VPS_KEY_PATH = os.environ.get("VPS_KEY_PATH", os.path.expanduser("~/.ssh/id_rsa"))
VPS_MODELS_DIR = "{VPS_MODELS_DIR}"
STAGING_DIR = Path(__file__).parent.parent / ".vps-staging"

def upload_directory(sftp, local_path: Path, remote_path: str):
    try:
        sftp.mkdir(remote_path)
    except IOError:
        pass  # Already exists
    
    for item in local_path.iterdir():
        remote_item = f"{{remote_path}}/{{item.name}}"
        if item.is_dir():
            upload_directory(sftp, item, remote_item)
        else:
            print(f"  ⬆️  {{remote_item}}")
            sftp.put(str(item), remote_item)

def main():
    if not STAGING_DIR.exists():
        print(f"❌ Staging directory not found: {{STAGING_DIR}}")
        print("   Run: python scripts/migrate_all_models.py")
        sys.exit(1)

    key_path = Path(VPS_KEY_PATH)
    if not key_path.exists():
        print(f"❌ SSH key not found: {{key_path}}")
        print("   Set VPS_KEY_PATH env var or place key at ~/.ssh/id_rsa")
        sys.exit(1)

    print(f"🔌 Connecting to {{VPS_USER}}@{{VPS_HOST}}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=VPS_HOST, username=VPS_USER, key_filename=str(key_path))
    sftp = client.open_sftp()

    # Ensure base models directory exists
    try:
        sftp.stat(VPS_MODELS_DIR)
    except IOError:
        print(f"📁 Creating {{VPS_MODELS_DIR}}")
        stdin, stdout, stderr = client.exec_command(f"sudo mkdir -p {{VPS_MODELS_DIR}} && sudo chown {{VPS_USER}}:{{VPS_USER}} {{VPS_MODELS_DIR}}")
        stdout.channel.recv_exit_status()

    for subdir in STAGING_DIR.iterdir():
        if not subdir.is_dir():
            continue
        remote_subdir = f"{{VPS_MODELS_DIR}}/{{subdir.name}}"
        print(f"\n📂 Uploading {{subdir.name}}/ -> {{remote_subdir}}/")
        upload_directory(sftp, subdir, remote_subdir)

    sftp.close()
    client.close()
    print("\\n✅ All models uploaded to VPS!")
    print("   Next: run scripts/verify_model_urls.py")

if __name__ == "__main__":
    main()
'''
    script_path.write_text(script_content)
    script_path.chmod(0o755)
    print(f"\n📝 Generated upload script: {script_path}")


def print_summary():
    print("\n" + "=" * 60)
    print("STAGING SUMMARY")
    print("=" * 60)
    
    total_size = 0
    for root, dirs, files in os.walk(STAGING_DIR):
        for f in files:
            total_size += os.path.getsize(os.path.join(root, f))
    
    print(f"Total staged size: {total_size / 1e9:.2f} GB")
    print(f"Staging directory: {STAGING_DIR}")
    print("\nDirectory structure:")
    
    for item in sorted(STAGING_DIR.iterdir()):
        if item.is_dir():
            size = sum(f.stat().st_size for f in item.rglob("*") if f.is_file())
            print(f"  📁 {item.name}/  ({size / 1e9:.2f} GB)")
        else:
            print(f"  📄 {item.name}  ({item.stat().st_size / 1e6:.2f} MB)")
    
    print("\nNext steps:")
    print("  1. Review staged files above")
    print("  2. From a machine with SSH access to the VPS, run:")
    print("     python scripts/upload_staged_to_vps.py")
    print("  3. After upload, verify with:")
    print("     python scripts/verify_model_urls.py")
    print("=" * 60)


def main():
    ensure_dir(STAGING_DIR)
    
    download_mlc_models()
    # Note: Transformers.js models are skipped by default.
    # Mirroring full HF repos for Transformers.js is storage-intensive.
    # To enable, uncomment the line below and ensure VPS has ~20GB extra.
    # download_transformers_models()
    download_gguf_models()
    
    ok = stage_small_assets()
    generate_upload_script()
    print_summary()
    
    if not ok:
        print("\n⚠️  Warning: Some small assets were missing. Upload may be incomplete.")
        sys.exit(1)


if __name__ == "__main__":
    main()
