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
#   - Python 3.10+ with the pinned mlc-llm-nightly / mlc-ai-nightly wheels
#   - Emscripten SDK (emsdk) at the pinned version, activated
#   - Rust + wasm32-unknown-emscripten target
#   - git-lfs, cmake, ninja/make
#   - MLC-LLM source checkout (recursive, with TVM submodule) at the pinned commit
#   - HuggingFace token with write access (for upload fallback)
#
#   All versions are pinned in scripts/wasm-toolchain.env; context/prefill parameter sets
#   live in scripts/wasm-presets.json.
#
# Usage:
#   # Option A: Run inside a pre-built Docker image (recommended)
#   docker run --rm -it -v $(pwd):/workspace \
#     mlcaicommunity/mlc-llm-ci:latest \
#     /workspace/scripts/build-vicuna-wasm.sh
#
#   # Option B: Run on Google Colab (see public/Jokesters_WebLLM_Compile.ipynb)
#   # The notebook is the source of truth for the manual/Colab path.
#
#   # Option C: Run locally if you have the full MLC build env
#   CONTEXT_SIZE=512 ./scripts/build-vicuna-wasm.sh
#   CONTEXT_SIZE=1024 ./scripts/build-vicuna-wasm.sh
#
# Output:
#   .vps-staging/wasm-libs/vicuna-7b-q4f32_1-ctx{512_cs512,1024_cs1024}-webgpu.wasm
#   These are ready for upload to the VPS wasm-libs/ directory.
#
# Environment Variables:
#   CONTEXT_SIZE        Target context window (default: 512)
#   QUANTIZATION        MLC quant scheme (default: q4f32_1)
#   MODEL_ID            HF model ID (default: lmsys/vicuna-7b-v1.5)
#   OUTPUT_DIR          Where to stage outputs (default: .vps-staging/wasm-libs)
#   MLC_LLM_SRC         Path to mlc-llm source (default: auto-clone to /tmp at MLC_LLM_COMMIT)
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
#   - Context/prefill sizes are passed to `mlc_llm compile --overrides`, never by editing JSON
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
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Pinned toolchain (EMSDK_VERSION, MLC_LLM_COMMIT, wheel versions, ...).
# shellcheck source=scripts/wasm-toolchain.env
source "$REPO_ROOT/scripts/wasm-toolchain.env"

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

# Resolve the parameter set for this context size (single source: scripts/wasm-presets.json)
PRESET_JSON="$REPO_ROOT/scripts/wasm-presets.json"
if ! PRESET_ENV="$(python3 - "$PRESET_JSON" "$CONTEXT_SIZE" <<'PYEOF'
import json, sys
path, ctx = sys.argv[1], sys.argv[2]
cfg = json.load(open(path))
preset = cfg["presets"].get(ctx)
if preset is None:
    sys.exit("CONTEXT_SIZE must be one of: " + ", ".join(cfg["presets"]) + f" (got: {ctx})")
print(f"PREFILL_CHUNK_SIZE={preset['prefill_chunk_size']}")
print(f"MODEL_PREFIX={cfg['model_prefix']}")
PYEOF
)"; then
  die "Invalid CONTEXT_SIZE '$CONTEXT_SIZE' (see scripts/wasm-presets.json)"
fi
eval "$PRESET_ENV"
log "  PREFILL_CHUNK_SIZE: ${PREFILL_CHUNK_SIZE}"

# Python + mlc_llm
if ! command -v python3 >/dev/null 2>&1; then
  die "python3 is required. Install Python 3.10+."
fi

if ! python3 -c "import mlc_llm" 2>/dev/null; then
  warn "mlc_llm Python package not found."
  warn "  Install with: python3 -m pip install --pre -f https://mlc.ai/wheels \\"
  warn "    mlc-llm-nightly-${MLC_WHEEL_FLAVOR}==${MLC_LLM_NIGHTLY_VERSION} mlc-ai-nightly-${MLC_WHEEL_FLAVOR}==${MLC_AI_NIGHTLY_VERSION}"
  die "Cannot proceed without mlc_llm."
fi

# The installed wheels must be the pinned ones, otherwise the runtime and compiler can disagree.
INSTALLED_WHEELS="$(python3 -m pip list --format=freeze 2>/dev/null | grep -i -E '^mlc[-_](llm|ai)-nightly' || true)"
for want in "mlc-llm-nightly-${MLC_WHEEL_FLAVOR}==${MLC_LLM_NIGHTLY_VERSION}" "mlc-ai-nightly-${MLC_WHEEL_FLAVOR}==${MLC_AI_NIGHTLY_VERSION}"; do
  norm="$(echo "$want" | tr '_' '-' | tr '[:upper:]' '[:lower:]')"
  if ! echo "$INSTALLED_WHEELS" | tr '_' '-' | tr '[:upper:]' '[:lower:]' | grep -q -x -F "$norm"; then
    die "Expected pinned wheel $want (see scripts/wasm-toolchain.env). Installed: ${INSTALLED_WHEELS:-none}"
  fi
done

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
    log "Cloning mlc-llm source to $MLC_LLM_SRC ..."
    git clone https://github.com/mlc-ai/mlc-llm.git "$MLC_LLM_SRC"
  else
    log "Using existing mlc-llm source at $MLC_LLM_SRC"
  fi
  git -C "$MLC_LLM_SRC" checkout --quiet "$MLC_LLM_COMMIT"
  git -C "$MLC_LLM_SRC" submodule update --init --recursive
else
  log "Using provided MLC_LLM_SRC: $MLC_LLM_SRC"
  if [[ "$(git -C "$MLC_LLM_SRC" rev-parse HEAD 2>/dev/null || true)" != "$MLC_LLM_COMMIT" ]]; then
    die "MLC_LLM_SRC is not at the pinned commit $MLC_LLM_COMMIT (scripts/wasm-toolchain.env)"
  fi
fi
# mlc_llm locates its source tree (and the wasm runtime built from it) through this variable.
export MLC_LLM_SOURCE_DIR="$MLC_LLM_SRC"

if [[ ! -f "$MLC_LLM_SRC/web/prep_emcc_deps.sh" ]]; then
  die "MLC-LLM source at $MLC_LLM_SRC is missing web/prep_emcc_deps.sh (wrong checkout?)"
fi

# ---------------------------------------------------------------------------
# Prepare build environment
# ---------------------------------------------------------------------------
log "Activating Emscripten environment..."
# shellcheck source=/dev/null
source "$EMSDK_ROOT/emsdk_env.sh"

if ! emcc --version 2>/dev/null | head -n1 | grep -q -F "$EMSDK_VERSION"; then
  die "emcc $(emcc --version 2>/dev/null | head -n1) is not the pinned Emscripten ${EMSDK_VERSION} (scripts/wasm-toolchain.env)"
fi

export TVM_HOME="${MLC_LLM_SRC}/3rdparty/tvm"
export TVM_LIBRARY_PATH="${MLC_LLM_SRC}/web/dist/wasm"

log "Building MLC Web Runtime (one-time per source checkout)..."
pushd "$MLC_LLM_SRC" >/dev/null

./web/prep_emcc_deps.sh || warn "prep_emcc_deps.sh had issues (may be harmless if deps already present)"

# Symlink required by some MLC versions. Must run AFTER prep_emcc_deps.sh, which is what
# produces web/dist/wasm/mlc_wasm_runtime.bc.
if [[ -f "web/dist/wasm/mlc_wasm_runtime.bc" && ! -f "web/dist/wasm/wasm_runtime.bc" ]]; then
  ln -sf mlc_wasm_runtime.bc web/dist/wasm/wasm_runtime.bc
fi

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
# Locate config
# ---------------------------------------------------------------------------
CONFIG_PATH="$CONV_OUTPUT/mlc-chat-config.json"
if [[ ! -f "$CONFIG_PATH" ]]; then
  die "mlc-chat-config.json not found at $CONFIG_PATH"
fi

# ---------------------------------------------------------------------------
# Compile to WASM
# ---------------------------------------------------------------------------
OUTPUT_WASM_NAME="${MODEL_PREFIX}-${QUANTIZATION}-ctx${CONTEXT_SIZE}_cs${PREFILL_CHUNK_SIZE}-webgpu.wasm"
OUTPUT_WASM_PATH="$BUILD_ROOT/$OUTPUT_WASM_NAME"

log "Compiling model_lib to WASM (this is the slow step)..."
log "  Input:  $CONFIG_PATH"
log "  Output: $OUTPUT_WASM_PATH"

python3 -m mlc_llm compile "$CONFIG_PATH" \
  --device webgpu \
  --overrides "context_window_size=${CONTEXT_SIZE};prefill_chunk_size=${PREFILL_CHUNK_SIZE}" \
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
  echo "Prefill chunk:  ${PREFILL_CHUNK_SIZE}"
  echo "web-llm target: ${WEB_LLM_VERSION} (${MLC_LIB_ABI})"
  echo "Emscripten:     ${EMSDK_VERSION}"
  echo "mlc-llm wheels: ${MLC_LLM_NIGHTLY_VERSION} / mlc-ai ${MLC_AI_NIGHTLY_VERSION} (${MLC_WHEEL_FLAVOR})"
  echo "Quantization:   ${QUANTIZATION}"
  echo "Model ID:       ${MODEL_ID}"
  echo "mlc-llm commit: $(git -C "$MLC_LLM_SRC" rev-parse HEAD 2>/dev/null || echo 'unknown')"
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
