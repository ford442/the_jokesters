#!/usr/bin/env python3
"""
Upload all staged models from .vps-staging/ to the VPS.

This includes:
  - MLC WebLLM weight directories (downloaded by migrate_all_models.py)
  - WASM model libraries (built by build-vicuna-wasm.sh -> .vps-staging/wasm-libs/)
  - GGUF models, Transformers.js ONNX repos, TTS assets, etc.

Run this from a machine with SSH key access to storage.noahcohn.com.
"""

import os
import sys
import paramiko
from pathlib import Path

VPS_HOST = os.environ.get("VPS_HOST", "storage.noahcohn.com")
VPS_USER = os.environ.get("VPS_USER", "root")
VPS_KEY_PATH = os.environ.get("VPS_KEY_PATH", os.path.expanduser("~/.ssh/id_rsa"))
VPS_MODELS_DIR = "/data/files/models"
STAGING_DIR = Path(__file__).parent.parent / ".vps-staging"

def upload_directory(sftp, local_path: Path, remote_path: str):
    try:
        sftp.mkdir(remote_path)
    except IOError:
        pass  # Already exists
    
    for item in local_path.iterdir():
        remote_item = f"{remote_path}/{item.name}"
        if item.is_dir():
            upload_directory(sftp, item, remote_item)
        else:
            print(f"  ⬆️  {remote_item}")
            sftp.put(str(item), remote_item)

def main():
    if not STAGING_DIR.exists():
        print(f"❌ Staging directory not found: {STAGING_DIR}")
        print("   Run: python scripts/migrate_all_models.py")
        sys.exit(1)

    key_path = Path(VPS_KEY_PATH)
    if not key_path.exists():
        print(f"❌ SSH key not found: {key_path}")
        print("   Set VPS_KEY_PATH env var or place key at ~/.ssh/id_rsa")
        sys.exit(1)

    print(f"🔌 Connecting to {VPS_USER}@{VPS_HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=VPS_HOST, username=VPS_USER, key_filename=str(key_path))
    sftp = client.open_sftp()

    # Ensure base models directory exists
    try:
        sftp.stat(VPS_MODELS_DIR)
    except IOError:
        print(f"📁 Creating {VPS_MODELS_DIR}")
        stdin, stdout, stderr = client.exec_command(f"sudo mkdir -p {VPS_MODELS_DIR} && sudo chown {VPS_USER}:{VPS_USER} {VPS_MODELS_DIR}")
        stdout.channel.recv_exit_status()

    for subdir in STAGING_DIR.iterdir():
        if not subdir.is_dir():
            continue
        remote_subdir = f"{VPS_MODELS_DIR}/{subdir.name}"
        print(f"
📂 Uploading {subdir.name}/ -> {remote_subdir}/")
        upload_directory(sftp, subdir, remote_subdir)

    sftp.close()
    client.close()
    print("\n✅ All models uploaded to VPS!")
    print("   Next: run scripts/verify_model_urls.py")

if __name__ == "__main__":
    main()
