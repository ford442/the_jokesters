#!/usr/bin/env bash
#
# build-llama-wasm-webgpu.sh
#
# Purpose:
#   Reproducibly compile ggml-org llama.cpp for WebAssembly + WebGPU via
#   Emscripten and Dawn's emdawnwebgpu bindings.
#
#   This is an *experimental ops/research* compile, analogous to
#   scripts/build-vicuna-wasm.sh (MLC model_lib). Artifacts are NOT consumed
#   by the product llama.cpp path (@wllama/wllama + LlamaCppEngineAdapter).
#   Do not copy output WASM into wllama-wasm/ or pass it to Wllama().
#
# Prerequisites:
#   - cmake, ninja (preferred) or make
#   - Emscripten SDK (emsdk) with emcmake on PATH, or EMSDK_ROOT set
#   - curl, git, unzip
#
# Usage:
#   # Local (emsdk already installed)
#   ./scripts/build-llama-wasm-webgpu.sh
#
#   # Pin a different llama.cpp commit / Dawn package
#   LLAMA_CPP_REF=<sha> DAWN_TAG=v20260317.182325 ./scripts/build-llama-wasm-webgpu.sh
#
#   # CI-style: clone emsdk if missing
#   INSTALL_EMSDK=1 ./scripts/build-llama-wasm-webgpu.sh
#
# Output:
#   .vps-staging/llama-wasm-webgpu/
#     BUILDINFO.txt
#     *.js / *.wasm / *.html from build-wasm/bin/ (when produced)
#
# Environment Variables:
#   LLAMA_CPP_GIT     Upstream clone URL (default: https://github.com/ggml-org/llama.cpp.git)
#   LLAMA_CPP_REF     Commit SHA to build (default: pinned; required in CI — do not use floating master)
#   LLAMA_CPP_SRC     Existing checkout (skips clone if set and valid)
#   DAWN_TAG          Dawn release tag for emdawnwebgpu_pkg (default: v20260317.182325)
#   EMSDK_ROOT        Path to emsdk (default: $EMSDK, ~/emsdk, /content/emsdk)
#   INSTALL_EMSDK     Set to 1 to clone+install emsdk latest if missing (default: 0)
#   OUTPUT_DIR        Staging dir (default: <repo>/.vps-staging/llama-wasm-webgpu)
#   BUILD_DIR         CMake build dir under the llama.cpp checkout (default: build-wasm)
#   BUILD_TARGET      Primary cmake target (default: test-backend-ops)
#   EXTRA_TARGETS     Optional space-separated extra targets (e.g. llama-cli)
#   CMAKE_GENERATOR   Override generator (default: Ninja if ninja exists, else Unix Makefiles)
#   CMAKE_EXTRA_FLAGS Extra -D flags appended to emcmake
#   LLAMA_BUILD_EXAMPLES  default OFF
#   LLAMA_BUILD_SERVER    default OFF
#   BUILD_SHARED_LIBS     default OFF
#
# Limitations (honest):
#   - Text GGUF inference via this backend is experimental.
#   - Long context is memory-limited in the browser.
#   - Kimi-VL / libmtmd / Kimi-Audio are not this path.
#   - WebLLM remains the recommended in-browser WebGPU engine for The Jokesters.
#   - See docs/adr/0001-native-cpp-boundary.md — runtime engine still gated on track B.
#
# Safety:
#   - Fast-failing: set -euo pipefail
#   - Never mutates src/ or adds a llama.cpp submodule
#   - Clone lives under /tmp (or LLAMA_CPP_SRC) only
#

set -euo pipefail

# ---------------------------------------------------------------------------
# Pins & defaults
# ---------------------------------------------------------------------------
# ggml-org/llama.cpp master as of 2026-08-22 (DSpark / bailingmoe3). Bump
# deliberately; do not float on origin/master in CI.
DEFAULT_LLAMA_CPP_REF="2115b73d8ebdbd659075cce66c609506863bc826"
# Matches ggml-org/llama.cpp .github/workflows/build-wasm.yml (ubuntu-webgpu).
DEFAULT_DAWN_TAG="v20260317.182325"

LLAMA_CPP_GIT="${LLAMA_CPP_GIT:-https://github.com/ggml-org/llama.cpp.git}"
LLAMA_CPP_REF="${LLAMA_CPP_REF:-$DEFAULT_LLAMA_CPP_REF}"
LLAMA_CPP_SRC="${LLAMA_CPP_SRC:-}"
DAWN_TAG="${DAWN_TAG:-$DEFAULT_DAWN_TAG}"
EMSDK_ROOT="${EMSDK_ROOT:-${EMSDK:-}}"
INSTALL_EMSDK="${INSTALL_EMSDK:-0}"
REQUIRE_PIN="${REQUIRE_PIN:-0}"
OUTPUT_DIR="${OUTPUT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.vps-staging/llama-wasm-webgpu}"
BUILD_DIR_NAME="${BUILD_DIR:-build-wasm}"
BUILD_TARGET="${BUILD_TARGET:-test-backend-ops}"
EXTRA_TARGETS="${EXTRA_TARGETS:-}"
CMAKE_EXTRA_FLAGS="${CMAKE_EXTRA_FLAGS:-}"
LLAMA_BUILD_EXAMPLES="${LLAMA_BUILD_EXAMPLES:-OFF}"
LLAMA_BUILD_SERVER="${LLAMA_BUILD_SERVER:-OFF}"
BUILD_SHARED_LIBS="${BUILD_SHARED_LIBS:-OFF}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
fi

log()  { echo -e "${BLUE}[llama-wasm-webgpu]${NC} $*"; }
warn() { echo -e "${YELLOW}[llama-wasm-webgpu] WARNING:${NC} $*" >&2; }
ok()   { echo -e "${GREEN}[llama-wasm-webgpu]${NC} $*"; }
die()  { echo -e "${RED}[llama-wasm-webgpu] ERROR:${NC} $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Sanity
# ---------------------------------------------------------------------------
if [[ "$REQUIRE_PIN" == "1" && -z "${LLAMA_CPP_REF}" ]]; then
  die "REQUIRE_PIN=1 but LLAMA_CPP_REF is empty. Pass a full commit SHA."
fi

if [[ -z "$LLAMA_CPP_REF" ]]; then
  die "LLAMA_CPP_REF is required (commit SHA). Do not build an unpinned master."
fi

if ! command -v git >/dev/null 2>&1; then
  die "git is required."
fi
if ! command -v cmake >/dev/null 2>&1; then
  die "cmake is required."
fi
if ! command -v curl >/dev/null 2>&1; then
  die "curl is required."
fi
if ! command -v unzip >/dev/null 2>&1; then
  die "unzip is required."
fi

CMAKE_GENERATOR="${CMAKE_GENERATOR:-}"
if [[ -z "$CMAKE_GENERATOR" ]]; then
  if command -v ninja >/dev/null 2>&1; then
    CMAKE_GENERATOR="Ninja"
  else
    CMAKE_GENERATOR="Unix Makefiles"
    warn "ninja not found; using Unix Makefiles (slower)."
  fi
fi

# ---------------------------------------------------------------------------
# Emscripten
# ---------------------------------------------------------------------------
ensure_emsdk() {
  if command -v emcmake >/dev/null 2>&1; then
    return 0
  fi

  if [[ -z "$EMSDK_ROOT" ]]; then
    if [[ -d "/content/emsdk" ]]; then
      EMSDK_ROOT="/content/emsdk"
    elif [[ -d "$HOME/emsdk" ]]; then
      EMSDK_ROOT="$HOME/emsdk"
    elif [[ "$INSTALL_EMSDK" == "1" ]]; then
      EMSDK_ROOT="${HOME}/emsdk"
      log "INSTALL_EMSDK=1 — cloning emsdk to $EMSDK_ROOT"
      if [[ ! -d "$EMSDK_ROOT/.git" ]]; then
        git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_ROOT"
      fi
      (
        cd "$EMSDK_ROOT"
        ./emsdk install latest
        ./emsdk activate latest
      )
    else
      die "Emscripten not found. Install emsdk, set EMSDK_ROOT, or pass INSTALL_EMSDK=1."
    fi
  fi

  if [[ ! -f "$EMSDK_ROOT/emsdk_env.sh" ]]; then
    die "emsdk_env.sh not found in $EMSDK_ROOT"
  fi

  # shellcheck source=/dev/null
  source "$EMSDK_ROOT/emsdk_env.sh"

  if ! command -v emcmake >/dev/null 2>&1; then
    die "emcmake still not on PATH after sourcing $EMSDK_ROOT/emsdk_env.sh"
  fi
}

ensure_emsdk

EMCC_VERSION="$(emcc -dumpversion 2>/dev/null || echo unknown)"
log "Starting llama.cpp WASM + WebGPU build"
log "  LLAMA_CPP_REF:  ${LLAMA_CPP_REF}"
log "  DAWN_TAG:       ${DAWN_TAG}"
log "  BUILD_TARGET:   ${BUILD_TARGET}"
log "  GENERATOR:      ${CMAKE_GENERATOR}"
log "  emcc:           ${EMCC_VERSION}"

# ---------------------------------------------------------------------------
# llama.cpp checkout (out of tree)
# ---------------------------------------------------------------------------
if [[ -n "$LLAMA_CPP_SRC" ]]; then
  log "Using provided LLAMA_CPP_SRC: $LLAMA_CPP_SRC"
  [[ -f "$LLAMA_CPP_SRC/CMakeLists.txt" ]] || die "LLAMA_CPP_SRC has no CMakeLists.txt"
else
  LLAMA_CPP_SRC="/tmp/llama.cpp-wasm-webgpu-${LLAMA_CPP_REF:0:12}"
  if [[ -d "$LLAMA_CPP_SRC/.git" ]]; then
    log "Reusing existing clone at $LLAMA_CPP_SRC"
    git -C "$LLAMA_CPP_SRC" fetch --depth 1 origin "$LLAMA_CPP_REF"
    git -C "$LLAMA_CPP_SRC" checkout --detach FETCH_HEAD
  else
    log "Cloning llama.cpp @ $LLAMA_CPP_REF → $LLAMA_CPP_SRC"
    rm -rf "$LLAMA_CPP_SRC"
    mkdir -p "$LLAMA_CPP_SRC"
    git -C "$LLAMA_CPP_SRC" init
    git -C "$LLAMA_CPP_SRC" remote add origin "$LLAMA_CPP_GIT"
    git -C "$LLAMA_CPP_SRC" fetch --depth 1 origin "$LLAMA_CPP_REF"
    git -C "$LLAMA_CPP_SRC" checkout --detach FETCH_HEAD
  fi
fi

RESOLVED_SHA="$(git -C "$LLAMA_CPP_SRC" rev-parse HEAD)"
log "Resolved llama.cpp SHA: $RESOLVED_SHA"

# ---------------------------------------------------------------------------
# emdawnwebgpu (Dawn WebGPU bindings for Emscripten)
# ---------------------------------------------------------------------------
EMDAWN_PKG="emdawnwebgpu_pkg-${DAWN_TAG}.zip"
EMDAWN_DIR="${LLAMA_CPP_SRC}/emdawnwebgpu_pkg"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/jokesters-llama-wasm"
mkdir -p "$CACHE_DIR"

if [[ ! -f "$EMDAWN_DIR/emdawnwebgpu_config.cmake" && ! -d "$EMDAWN_DIR" ]]; then
  ZIP_PATH="${CACHE_DIR}/${EMDAWN_PKG}"
  if [[ ! -f "$ZIP_PATH" ]]; then
    log "Downloading ${EMDAWN_PKG}"
    curl -fsSL -o "$ZIP_PATH" \
      "https://github.com/google/dawn/releases/download/${DAWN_TAG}/${EMDAWN_PKG}" \
      || die "Failed to download emdawnwebgpu package for DAWN_TAG=${DAWN_TAG}. Check the tag against llama.cpp's build-wasm.yml."
  else
    log "Using cached $ZIP_PATH"
  fi
  log "Unpacking emdawnwebgpu into $EMDAWN_DIR"
  rm -rf "$EMDAWN_DIR"
  unzip -q -o "$ZIP_PATH" -d "$LLAMA_CPP_SRC"
  # Zip may extract as emdawnwebgpu_pkg/ or a nested folder.
  if [[ ! -d "$EMDAWN_DIR" ]]; then
    found="$(find "$LLAMA_CPP_SRC" -maxdepth 2 -type d -name 'emdawnwebgpu_pkg*' | head -n 1 || true)"
    if [[ -n "$found" && "$found" != "$EMDAWN_DIR" ]]; then
      mv "$found" "$EMDAWN_DIR"
    fi
  fi
fi

if [[ ! -d "$EMDAWN_DIR" ]]; then
  die "emdawnwebgpu package directory missing at $EMDAWN_DIR"
fi

# ---------------------------------------------------------------------------
# Configure + build
# ---------------------------------------------------------------------------
BUILD_ABS="${LLAMA_CPP_SRC}/${BUILD_DIR_NAME}"
CMAKE_FLAGS=(
  -DCMAKE_BUILD_TYPE=Release
  -DGGML_WEBGPU=ON
  -DGGML_OPENMP=OFF
  -DLLAMA_OPENSSL=OFF
  -DBUILD_SHARED_LIBS="${BUILD_SHARED_LIBS}"
  -DLLAMA_BUILD_EXAMPLES="${LLAMA_BUILD_EXAMPLES}"
  -DLLAMA_BUILD_SERVER="${LLAMA_BUILD_SERVER}"
  -DEMDAWNWEBGPU_DIR="${EMDAWN_DIR}"
)

if [[ -n "$CMAKE_EXTRA_FLAGS" ]]; then
  # shellcheck disable=SC2206
  CMAKE_FLAGS+=($CMAKE_EXTRA_FLAGS)
fi

log "Configuring with emcmake (GGML_WEBGPU=ON)..."
if ! emcmake cmake -B "$BUILD_ABS" -G "$CMAKE_GENERATOR" "${CMAKE_FLAGS[@]}"; then
  die "cmake configure failed. GGML_WEBGPU often fails on emsdk/Dawn mismatch — pin DAWN_TAG to llama.cpp's build-wasm.yml and use a matching emsdk latest."
fi

JOBS="$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)"
log "Building target ${BUILD_TARGET} (-j${JOBS})..."
if ! cmake --build "$BUILD_ABS" --config Release --target "$BUILD_TARGET" -j"$JOBS"; then
  die "Build failed for target ${BUILD_TARGET}."
fi
ok "Built ${BUILD_TARGET}"

if [[ -n "$EXTRA_TARGETS" ]]; then
  for extra in $EXTRA_TARGETS; do
    log "Building extra target ${extra}..."
    if cmake --build "$BUILD_ABS" --config Release --target "$extra" -j"$JOBS"; then
      ok "Built ${extra}"
    else
      warn "Extra target ${extra} failed (may not exist on this SHA); continuing."
    fi
  done
fi

# ---------------------------------------------------------------------------
# Stage artifacts
# ---------------------------------------------------------------------------
mkdir -p "$OUTPUT_DIR"
BIN_DIR="${BUILD_ABS}/bin"
STAGED=0
if [[ -d "$BIN_DIR" ]]; then
  shopt -s nullglob
  for f in "$BIN_DIR"/*.js "$BIN_DIR"/*.wasm "$BIN_DIR"/*.html; do
    cp -a "$f" "$OUTPUT_DIR/"
    STAGED=$((STAGED + 1))
  done
  shopt -u nullglob
fi

# test-backend-ops may land as a non-suffixed binary depending on generator.
if [[ -f "$BIN_DIR/${BUILD_TARGET}" ]]; then
  cp -a "$BIN_DIR/${BUILD_TARGET}" "$OUTPUT_DIR/"
  STAGED=$((STAGED + 1))
fi

BUILDINFO="${OUTPUT_DIR}/BUILDINFO.txt"
{
  echo "project: the_jokesters"
  echo "script: scripts/build-llama-wasm-webgpu.sh"
  echo "date_utc: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "llama_cpp_git: ${LLAMA_CPP_GIT}"
  echo "llama_cpp_ref_requested: ${LLAMA_CPP_REF}"
  echo "llama_cpp_sha: ${RESOLVED_SHA}"
  echo "dawn_tag: ${DAWN_TAG}"
  echo "emcc_version: ${EMCC_VERSION}"
  echo "cmake_generator: ${CMAKE_GENERATOR}"
  echo "build_target: ${BUILD_TARGET}"
  echo "extra_targets: ${EXTRA_TARGETS:-none}"
  echo "cmake_flags: ${CMAKE_FLAGS[*]}"
  echo "repo_root: ${REPO_ROOT}"
  echo "not_for: LlamaCppEngineAdapter / @wllama/wllama (CPU WASM glue mismatch)"
  echo "product_webgpu_engine: MLC WebLLM"
} > "$BUILDINFO"

ok "Staged ${STAGED} binary artifact(s) + BUILDINFO.txt → $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" || true

if [[ "$STAGED" -eq 0 ]]; then
  warn "No .js/.wasm/.html found under ${BIN_DIR}."
  warn "Configure succeeded and ${BUILD_TARGET} linked; inspect ${BUILD_ABS} if you expected browser glue files."
fi

ok "Done. These artifacts are experimental and are not wired into the app."
