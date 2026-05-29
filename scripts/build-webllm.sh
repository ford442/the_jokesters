#!/usr/bin/env bash
#
# build-webllm.sh
#
# Purpose:
#   Build a custom @mlc-ai/web-llm artifact from the git submodule at
#   3rd_party/web-llm (our fork: ford442/web-llm) and prepare it for
#   consumption by the main The Jokesters application.
#
#   This is the repeatable entry point for any WebLLM runtime customization
#   (bundle pruning, comedy-specific sampling, streaming hooks, cache/SW
#   integration, new public APIs, etc.).
#
# When to run:
#   - After editing code inside 3rd_party/web-llm/src
#   - When rebasing the fork on upstream releases
#   - Before cutting a release or running a "clean" npm run build
#   - As part of CI if USE_CUSTOM_WEBLLM=1 is set (future)
#
# Output:
#   3rd_party/web-llm-dist/   (gitignored) — contains the built lib/ + metadata
#   This directory can be aliased from vite.config.ts / tsconfig.json or
#   referenced via a file: dependency.
#
# Requirements:
#   - Node.js >= 18 (same as the rest of the project)
#   - The submodule must be initialized (git submodule update --init)
#   - npm (uses the lockfile inside the submodule)
#
# Safety:
#   - Never mutates the main working tree except the generated dist dir.
#   - Idempotent: safe to run multiple times.
#   - Fast-failing on any error.
#
# Future extensions (documented, not yet implemented):
#   - Patch application from patches/web-llm/*.patch
#   - Size report + perf-budget gate
#   - Automatic update of root package.json "overrides" or prepare hook
#
# Usage:
#   ./scripts/build-webllm.sh
#   APPLY_PATCHES=1 ./scripts/build-webllm.sh     # (future)
#   VERBOSE=0 ./scripts/build-webllm.sh           # quieter
#
# Style note:
#   Matches the pragmatic, well-commented shell/python helper style used
#   elsewhere in the project (deploy.py, smoke_test.py, scripts/*.py).
#

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
SUBMODULE_DIR="3rd_party/web-llm"
DIST_DIR="3rd_party/web-llm-dist"
PATCHES_DIR="patches/web-llm"
SCRIPT_NAME="$(basename "$0")"

# Colors for readability (respect NO_COLOR or non-tty)
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m' # No Color
else
  RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

log() {
  echo -e "${BLUE}[webllm-build]${NC} $*"
}

warn() {
  echo -e "${YELLOW}[webllm-build] WARNING:${NC} $*" >&2
}

error() {
  echo -e "${RED}[webllm-build] ERROR:${NC} $*" >&2
  exit 1
}

# -----------------------------------------------------------------------------
# Preconditions
# -----------------------------------------------------------------------------
log "Starting custom web-llm build from submodule"

if [[ ! -d "$SUBMODULE_DIR" ]]; then
  error "Submodule directory '$SUBMODULE_DIR' not found. Run: git submodule update --init --recursive"
fi

if [[ ! -f "$SUBMODULE_DIR/package.json" ]]; then
  error "$SUBMODULE_DIR/package.json missing. Submodule may be empty or corrupt."
fi

if ! command -v node >/dev/null 2>&1; then
  error "node is required but not in PATH. Install Node.js 18+."
fi

NODE_VERSION=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if (( NODE_MAJOR < 18 )); then
  error "Node.js 18+ required (found $NODE_VERSION)"
fi

log "Node $(node --version), npm $(npm --version)"

# Ensure we are in repo root (script can be called from anywhere)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# -----------------------------------------------------------------------------
# Submodule build
# -----------------------------------------------------------------------------
pushd "$SUBMODULE_DIR" >/dev/null

log "Working directory: $(pwd)"

# Clean previous build output inside submodule (keeps things reproducible)
if [[ -d "lib" ]]; then
  log "Removing previous lib/ build inside submodule"
  rm -rf lib
fi

# Install dependencies (use ci when lockfile exists for reproducibility)
if [[ -f "package-lock.json" ]]; then
  log "Running npm ci (lockfile present)..."
  npm ci --no-audit --no-fund
else
  warn "No package-lock.json in submodule — falling back to npm install"
  npm install --no-audit --no-fund
fi

# Apply patches (future-proof hook — currently a no-op if dir empty)
if [[ "${APPLY_PATCHES:-0}" == "1" && -d "../../$PATCHES_DIR" ]]; then
  log "Applying patches from $PATCHES_DIR (if any)..."
  shopt -s nullglob
  for patch in "../../$PATCHES_DIR"/*.patch; do
    if [[ -f "$patch" ]]; then
      log "  Applying $(basename "$patch")"
      # Use git apply when possible (better whitespace handling)
      if git apply --check "$patch" 2>/dev/null; then
        git apply "$patch"
      else
        # Fallback to patch(1)
        patch -p1 < "$patch" || warn "Patch $(basename "$patch") did not apply cleanly"
      fi
    fi
  done
  shopt -u nullglob
else
  log "Skipping patch application (APPLY_PATCHES != 1 or no patches dir)"
fi

# The actual build (rollup + cleanup script)
log "Running npm run build (rollup + cleanup)..."
npm run build

popd >/dev/null

# -----------------------------------------------------------------------------
# Stage artifacts into the generated dist directory
# -----------------------------------------------------------------------------
log "Staging build artifacts to $DIST_DIR"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy the compiled library (this is what consumers import)
if [[ ! -d "$SUBMODULE_DIR/lib" ]]; then
  error "Build appeared to succeed but $SUBMODULE_DIR/lib does not exist"
fi

cp -r "$SUBMODULE_DIR/lib" "$DIST_DIR/"

# Copy package.json for version / metadata (useful for debugging)
cp "$SUBMODULE_DIR/package.json" "$DIST_DIR/"

# Record build provenance (critical for reproducibility & bug reports)
{
  echo "web-llm custom build for the_jokesters"
  echo "Build time:     $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "Git commit:     $(cd "$SUBMODULE_DIR" && git rev-parse HEAD)"
  echo "Git describe:   $(cd "$SUBMODULE_DIR" && git describe --tags --always 2>/dev/null || echo 'no-tag')"
  echo "Node version:   $(node --version)"
  echo "npm version:    $(npm --version)"
  echo "Builder:        $SCRIPT_NAME"
  echo "Patches applied: ${APPLY_PATCHES:-0}"
  echo ""
  echo "Submodule status:"
  (cd "$SUBMODULE_DIR" && git status --short --branch) || true
} > "$DIST_DIR/BUILD_INFO.txt"

# -----------------------------------------------------------------------------
# Size report (helps with perf-budget tracking)
# -----------------------------------------------------------------------------
log "Build artifacts:"
du -sh "$DIST_DIR"
echo ""
log "Breakdown:"
find "$DIST_DIR/lib" -type f \( -name "*.js" -o -name "*.d.ts" -o -name "*.map" \) -exec du -h {} + | sort -h | tail -20

TOTAL_JS_BYTES=$(find "$DIST_DIR/lib" -name "*.js" -exec cat {} + | wc -c | tr -d ' ')
log "Total JS (unminified): $(( TOTAL_JS_BYTES / 1024 )) KiB"

# -----------------------------------------------------------------------------
# Success + next steps
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}✓ Custom web-llm build complete.${NC}"
echo ""
echo "Artifacts ready in: $DIST_DIR"
echo ""
echo "Next steps (choose one consumption pattern):"
echo ""
echo "  A) Fast dev iteration (source alias — no rebuild needed while hacking):"
echo "     Add to vite.config.ts resolve.alias and tsconfig.json paths:"
echo "       '@mlc-ai/web-llm' -> '3rd_party/web-llm/src/index.ts'"
echo ""
echo "  B) Reproducible / CI builds (use the vendored dist):"
echo "       '@mlc-ai/web-llm' -> '3rd_party/web-llm-dist/lib/index.js'"
echo "     Then run the main project build as usual."
echo ""
echo "  C) Update root package.json temporarily for file: linking:"
echo "       \"@mlc-ai/web-llm\": \"file:./3rd_party/web-llm\""
echo "     Followed by npm install (use sparingly — sharp edges)."
echo ""
echo "  D) Local machine only:"
echo "       cd 3rd_party/web-llm && npm link"
echo "       cd ../.. && npm link @mlc-ai/web-llm"
echo ""
echo "See docs/webllm-customization-plan.md for the full integration architecture,"
echo "high-value customization opportunities for the comedy use-case, and open questions."
echo ""
echo "To iterate quickly on the fork, prefer pattern A during active development."
echo ""

# Optional: remind about the main build
if [[ "${CI:-false}" != "true" ]]; then
  echo "You can now run: npm run build   (or npm run dev)"
fi

exit 0