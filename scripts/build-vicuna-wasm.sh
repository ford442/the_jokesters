#!/usr/bin/env bash
#
# build-vicuna-wasm.sh
#
# Purpose:
#   Reproducibly compile custom Vicuna-7B WebLLM model_lib (.wasm) artifacts with
#   baked-in small context windows (512, 1024) to reduce peak VRAM allocation
#   during CreateMLCEngine for users with ~4 GB GPUs.
#
#   This is the *model artifact* companion to scripts/build-webllm.sh which builds
#   the JS runtime side of our ford442/web-llm fork.
#
# Background:
#   The current VPS_VICUNA_7B_ULTRA_LOW preset loads the generic 4K-context
#   Llama-2-7B .wasm and relies on JS-side overrides (context_window_size: 512,
#   sliding_window_size, etc.) plus OOM-retry logic in dynamicContext.ts.
#   A custom-compiled .wasm bakes the tighter memory plan into the TVM module
#   itself, reducing peak allocation before any chat begins.
#
# Prerequisites (heavy — see below for setup options):
#   - Python 3.10+ with mlc-llm-nightly (cu128 or cpu wheel)
#   - Emscripten SDK (emsdk) activated, tot or >=3.1.56
#   - Rust + wasm32-unknown-emscripten target
#   - git-lfs, cmake, ninja/make
#   - MLC-LLM source checkout (recursive, with TVM submodule)
#   - HuggingFace token with write access (for upload fallback)
#
# Usage:
#   # Option A: Run inside a pre-built Docker image (recommended)
#   docker run --rm -it -v $(pwd):/workspace \
#     mlcaicommunity/mlc-llm-ci:latest \
#     /workspace/scripts/build-vicuna-wasm.sh
#
#   # Option B: Run on Google Colab (see public/Github_ConvertVicuna.ipynb)
#   # The notebook is the source of truth for the manual/Colab path.
#
#   # Option C: Run locally if you have the full MLC build env
#   CONTEXT_SIZE=512 ./scripts/build-vicuna-wasm.sh
#   CONTEXT_SIZE=1024 ./scripts/build-vicuna-wasm.sh
#
# Output:
#   .vps-staging/wasm-libs/vicuna-7b-q4f32_1-ctx{512,1024}_cs1k-webgpu.wasm
#   These are ready for upload to the VPS wasm-libs/ directory.
#
# Environment Variables:
#   CONTEXT_SIZE        Target context window (default: 512)
#   QUANTIZATION        MLC quant scheme (default: q4f32_1)
#   MODEL_ID            HF model ID (default: lmsys/vicuna-7b-v1.5)
#   OUTPUT_DIR          Where to stage outputs (default: .vps-staging/wasm-libs)
#   MLC_LLM_SRC         Path to mlc-llm source (default: auto-clone to /tmp)
#   EMSDK_ROOT          Path to emsdk (default: $EMSDK or /content/emsdk)
#   SKIP_WEIGHT_CONV    Set to 1 if weights are already converted (default: 0)
#   WEIGHT_DIR          Path to pre-converted MLC weights (used if SKIP_WEIGHT_CONV=1)
#   HF_UPLOAD           Set to 1 to upload result to HuggingFace (default: 0)
#   HF_TOKEN            HuggingFace write token (required if HF_UPLOAD=1)
#   HF_REPO_ID          Target HF repo (default: ford442/vicuna-7b-q4f32-webllm)
#
# Safety:
#   - Fast-failing: set -euo pipefail
#   - Idempotent: safe to re-run with different CONTEXT_SIZE
#   - Never mutates source working tree except OUTPUT_DIR
#

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration & Defaults
# ---------------------------------------------------------------------------
CONTEXT_SIZE="${CONTEXT_SIZE:-512}"
QUANTIZATION="${QUANTIZATION:-q4f32_1}"
MODEL_ID="${MODEL_ID:-lmsys/vicuna-7b-v1.5}"
OUTPUT_DIR="${OUTPUT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.vps-staging/wasm-libs}"
MLC_LLM_SRC="${MLC_LLM_SRC:-}"
EMSDK_ROOT="${EMSDK_ROOT:-${EMSDK:-}}"
SKIP_WEIGHT_CONV="${SKIP_WEIGHT_CONV:-0}"
WEIGHT_DIR="${WEIGHT_DIR:-}"
HF_UPLOAD="${HF_UPLOAD:-0}"
HF_TOKEN="${HF_TOKEN:-}"
HF_REPO_ID="${HF_REPO_ID:-ford442/vicuna-7b-q4f32-webllm}"

SCRIPT_NAME="$(basename "$0")"

# Colors
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; CYAN=''; NC=''
fi

log()  { echo -e "${BLUE}[vicuna-wasm]${NC} $*"; }
warn() { echo -e "${YELLOW}[vicuna-wasm] WARNING:${NC} $*" >&2; }
ok()   { echo -e "${GREEN}[vicuna-wasm] ✓${NC} $*"; }
die()  { echo -e "${RED}[vicuna-wasm] ERROR:${NC} $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Sanity Checks
# ---------------------------------------------------------------------------
log "Starting Vicuna-7B custom WASM build"
log "  CONTEXT_SIZE: ${CONTEXT_SIZE}"
log "  QUANTIZATION: ${QUANTIZATION}"
log "  MODEL_ID:     ${MODEL_ID}"

# Validate context size
if [[ "$CONTEXT_SIZE" != "512" && "$CONTEXT_SIZE" != "1024" ]]; then
  die "CONTEXT_SIZE must be 512 or 1024 (got: $CONTEXT_SIZE)"
fi

# Python + mlc_llm
if ! command -v python3 >/dev/null 2>&1; then
  die "python3 is required. Install Python 3.10+."
fi

if ! python3 -c "import mlc_llm" 2>/dev/null; then
  warn "mlc_llm Python package not found."
  warn "  Install with: python3 -m pip install --pre -U -f https://mlc.ai/wheels mlc-llm-nightly-cu128 mlc-ai-nightly-cu128"
  die "Cannot proceed without mlc_llm."
fi

# Emscripten
if [[ -z "$EMSDK_ROOT" ]]; then
  if [[ -d "/content/emsdk" ]]; then
    EMSDK_ROOT="/content/emsdk"
  elif [[ -d "$HOME/emsdk" ]]; then
    EMSDK_ROOT="$HOME/emsdk"
  else
    die "Emscripten SDK not found. Set EMSDK_ROOT or install emsdk."
  fi
fi

if [[ ! -f "$EMSDK_ROOT/emsdk_env.sh" ]]; then
  die "emsdk_env.sh not found in $EMSDK_ROOT"
fi

# Rust + target
if ! command -v rustc >/dev/null 2>&1; then
  die "Rust not found. Install from https://rustup.rs and add wasm32-unknown-emscripten target."
fi

if ! rustup target list --installed 2>/dev/null | grep -q "wasm32-unknown-emscripten"; then
  die "Rust target wasm32-unknown-emscripten not installed. Run: rustup target add wasm32-unknown-emscripten"
fi

# git-lfs
if ! command -v git-lfs >/dev/null 2>&1; then
  warn "git-lfs not found. Model cloning may fail for large files."
fi

# ---------------------------------------------------------------------------
# Resolve / clone MLC-LLM source
# ---------------------------------------------------------------------------
if [[ -z "$MLC_LLM_SRC" ]]; then
  MLC_LLM_SRC="/tmp/mlc-llm-vicuna-build"
  if [[ ! -d "$MLC_LLM_SRC/.git" ]]; then
    log "Cloning mlc-llm source (recursive) to $MLC_LLM_SRC ..."
    git clone --recursive https://github.com/mlc-ai/mlc-llm.git "$MLC_LLM_SRC"
  else
    log "Using existing mlc-llm source at $MLC_LLM_SRC"
  fi
else
  log "Using provided MLC_LLM_SRC: $MLC_LLM_SRC"
fi

if [[ ! -f "$MLC_LLM_SRC/web/prep_emcc_deps.sh" ]]; then
  die "MLC-LLM source at $MLC_LLM_SRC is missing web/prep_emcc_deps.sh (wrong checkout?)"
fi

# ---------------------------------------------------------------------------
# Prepare build environment
# ---------------------------------------------------------------------------
log "Activating Emscripten environment..."
# shellcheck source=/dev/null
source "$EMSDK_ROOT/emsdk_env.sh"

export TVM_HOME="${MLC_LLM_SRC}/3rdparty/tvm"
export TVM_LIBRARY_PATH="${MLC_LLM_SRC}/web/dist/wasm"

log "Building MLC Web Runtime (one-time per source checkout)..."
pushd "$MLC_LLM_SRC" >/dev/null

# Symlink required by some MLC versions
if [[ -f "web/dist/wasm/mlc_wasm_runtime.bc" && ! -f "web/dist/wasm/wasm_runtime.bc" ]]; then
  ln -sf mlc_wasm_runtime.bc web/dist/wasm/wasm_runtime.bc
fi

./web/prep_emcc_deps.sh || warn "prep_emcc_deps.sh had issues (may be harmless if deps already present)"

mkdir -p build/wasm
cd build/wasm

if [[ ! -f "Makefile" && ! -f "build.ninja" ]]; then
  log "Configuring cmake with emcmake..."
  emcmake cmake ../.. \
    -DCMAKE_BUILD_TYPE=Release \
    -DUSE_WEBGPU=ON \
    -DUSE_WASM=ON \
    -DCMAKE_CXX_FLAGS="-O3" || die "cmake configuration failed"
fi

log "Compiling MLC Web Runtime (this may take several minutes)..."
make -j"$(nproc)" || die "MLC Web Runtime build failed"
ok "MLC Web Runtime build complete"

popd >/dev/null

# ---------------------------------------------------------------------------
# Weight conversion (unless skipped)
# ---------------------------------------------------------------------------
BUILD_ROOT="/tmp/vicuna-wasm-build-$$"
mkdir -p "$BUILD_ROOT"

if [[ "$SKIP_WEIGHT_CONV" == "1" && -n "$WEIGHT_DIR" && -d "$WEIGHT_DIR" ]]; then
  log "Skipping weight conversion, using: $WEIGHT_DIR"
  CONV_OUTPUT="$WEIGHT_DIR"
else
  MODEL_NAME="$(basename "$MODEL_ID")"
  HF_CACHE="$BUILD_ROOT/hf_models/$MODEL_NAME"
  CONV_OUTPUT="$BUILD_ROOT/${MODEL_NAME}-${QUANTIZATION}-MLC"

  log "Downloading model from HuggingFace: $MODEL_ID"
  if [[ ! -d "$HF_CACHE" ]]; then
    mkdir -p "$HF_CACHE"
    git lfs install 2>/dev/null || true
    git clone "https://huggingface.co/$MODEL_ID" "$HF_CACHE" || die "Model clone failed"
  fi

  log "Converting weights to $QUANTIZATION..."
  python3 -m mlc_llm convert_weight "$HF_CACHE/" \
    --quantization "$QUANTIZATION" \
    -o "$CONV_OUTPUT" || die "Weight conversion failed"

  log "Generating mlc-chat-config.json..."
  python3 -m mlc_llm gen_config "$HF_CACHE/" \
    --quantization "$QUANTIZATION" \
    --conv-template vicuna_v1.1 \
    -o "$CONV_OUTPUT" || die "Config generation failed"
fi

# ---------------------------------------------------------------------------
# Patch config for target context size
# ---------------------------------------------------------------------------
CONFIG_PATH="$CONV_OUTPUT/mlc-chat-config.json"
if [[ ! -f "$CONFIG_PATH" ]]; then
  die "mlc-chat-config.json not found at $CONFIG_PATH"
fi

log "Patching config for context_window_size=$CONTEXT_SIZE..."

# Create a Python snippet to safely patch the JSON
python3 <<PYEOF
import json
import sys

config_path = "${CONFIG_PATH}"
ctx = ${CONTEXT_SIZE}

with open(config_path, "r") as f:
    cfg = json.load(f)

# Patch both top-level and model_config nested keys
for key in ["context_window_size", "prefill_chunk_size"]:
    if key in cfg:
        old = cfg[key]
        cfg[key] = ctx
        print(f"  {key}: {old} -> {ctx}")
    if "model_config" in cfg and key in cfg["model_config"]:
        old = cfg["model_config"][key]
        cfg["model_config"][key] = ctx
        print(f"  model_config.{key}: {old} -> {ctx}")

# Ensure conv_template is present (Vicuna needs this)
if "conv_template" not in cfg:
    cfg["conv_template"] = {
        "name": "vicuna_v1.1",
        "system_template": "{system_message}",
        "system_message": "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.",
        "roles": {"user": "USER", "assistant": "ASSISTANT"},
        "role_msg_sep": " ",
        "role_empty_sep": " ",
        "seps": [" ", "</s>"],
        "stop_str": ["</s>"],
        "stop_token_ids": [2],
        "add_bos": True
    }
    print("  Added vicuna_v1.1 conv_template")

with open(config_path, "w") as f:
    json.dump(cfg, f, indent=2)

print(f"Updated config written to {config_path}")
PYEOF

ok "Config patched for ${CONTEXT_SIZE}-token context"

# ---------------------------------------------------------------------------
# Compile to WASM
# ---------------------------------------------------------------------------
OUTPUT_WASM_NAME="vicuna-7b-q4f32_1-ctx${CONTEXT_SIZE}_cs1k-webgpu.wasm"
OUTPUT_WASM_PATH="$BUILD_ROOT/$OUTPUT_WASM_NAME"

log "Compiling model_lib to WASM (this is the slow step)..."
log "  Input:  $CONFIG_PATH"
log "  Output: $OUTPUT_WASM_PATH"

python3 -m mlc_llm compile "$CONFIG_PATH" \
  --device webgpu \
  -o "$OUTPUT_WASM_PATH" || die "WASM compilation failed"

if [[ ! -f "$OUTPUT_WASM_PATH" ]]; then
  die "Expected output $OUTPUT_WASM_PATH not found after compile"
fi

ok "WASM compiled: $(du -h "$OUTPUT_WASM_PATH" | cut -f1)"

# ---------------------------------------------------------------------------
# Stage to output directory
# ---------------------------------------------------------------------------
mkdir -p "$OUTPUT_DIR"
FINAL_WASM_PATH="$OUTPUT_DIR/$OUTPUT_WASM_NAME"
cp "$OUTPUT_WASM_PATH" "$FINAL_WASM_PATH"

# Write provenance file
PROV_PATH="$OUTPUT_DIR/${OUTPUT_WASM_NAME}.BUILD_INFO.txt"
{
  echo "vicuna-7b custom WASM build for the_jokesters"
  echo "Build time:     $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "Context size:   ${CONTEXT_SIZE}"
  echo "Quantization:   ${QUANTIZATION}"
  echo "Model ID:       ${MODEL_ID}"
  echo "mlc-llm commit: $(cd "$MLC_LLM_SRC" && git rev-parse HEAD 2>/dev/null || echo 'unknown')"
  echo "Builder:        ${SCRIPT_NAME}"
  echo "WASM size:      $(stat -c%s "$FINAL_WASM_PATH" 2>/dev/null || stat -f%z "$FINAL_WASM_PATH" 2>/dev/null || echo 'unknown') bytes"
} > "$PROV_PATH"

ok "Artifacts staged to $OUTPUT_DIR"
echo ""
ls -lh "$FINAL_WASM_PATH" "$PROV_PATH"

# ---------------------------------------------------------------------------
# Optional: HuggingFace upload
# ---------------------------------------------------------------------------
if [[ "$HF_UPLOAD" == "1" ]]; then
  if [[ -z "$HF_TOKEN" ]]; then
    die "HF_UPLOAD=1 but HF_TOKEN is not set"
  fi

  log "Uploading WASM to HuggingFace: $HF_REPO_ID"
  python3 <<PYEOF
import os
from huggingface_hub import HfApi, login

token = "${HF_TOKEN}"
repo_id = "${HF_REPO_ID}"
wasm_path = "${FINAL_WASM_PATH}"
prov_path = "${PROV_PATH}"

login(token=token)
api = HfApi()
api.create_repo(repo_id=repo_id, repo_type="model", exist_ok=True)

for path in [wasm_path, prov_path]:
    print(f"Uploading {os.path.basename(path)}...")
    api.upload_file(
        path_or_fileobj=path,
        path_in_repo=os.path.basename(path),
        repo_id=repo_id,
        repo_type="model"
    )

print(f"Done: https://huggingface.co/{repo_id}")
PYEOF
  ok "HuggingFace upload complete"
fi

# ---------------------------------------------------------------------------
# Cleanup & Next Steps
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}✓ Build complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify the .wasm loads in a browser:"
echo "       $(basename "$FINAL_WASM_PATH")"
echo ""
echo "  2. Upload to VPS:"
echo "       python scripts/upload_staged_to_vps.py"
echo "     (Ensure .vps-staging/wasm-libs/ is included in the upload)"
echo ""
echo "  3. Register in src/config/models.ts (see docs for new entry pattern)"
echo ""
echo "  4. To build the 1024-ctx variant, run:"
echo "       CONTEXT_SIZE=1024 $0"
echo ""

# Keep build root for inspection unless in CI
if [[ "${CI:-false}" == "true" ]]; then
  rm -rf "$BUILD_ROOT"
else
  log "Build temp directory preserved for inspection: $BUILD_ROOT"
fi
