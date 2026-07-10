#!/usr/bin/env bash
# Verify @wllama/wllama package version and WASM hashes match scripts/wllama-wasm.manifest.json.
# Run after npm ci and whenever @wllama/wllama is bumped (update the manifest hashes).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/scripts/wllama-wasm.manifest.json"
PKG_DIR="$ROOT/node_modules/@wllama/wllama/esm"

if [[ ! -f "$MANIFEST" ]]; then
  echo "ERROR: Missing manifest: $MANIFEST"
  exit 1
fi

if [[ ! -d "$PKG_DIR" ]]; then
  echo "ERROR: @wllama/wllama not installed. Run: npm ci"
  exit 1
fi

read_manifest() {
  node -e "
    const m = require('$MANIFEST');
    console.log(m.version);
    for (const [path, hash] of Object.entries(m.hashes)) {
      console.log(path + '\t' + hash);
    }
  "
}

mapfile -t lines < <(read_manifest)
EXPECTED_VERSION="${lines[0]}"

INSTALLED_VERSION="$(node -e "
  const lock = require('$ROOT/package-lock.json');
  const pkg = lock.packages['node_modules/@wllama/wllama'];
  if (!pkg) { process.exit(1); }
  console.log(pkg.version);
")"

if [[ "$EXPECTED_VERSION" != "$INSTALLED_VERSION" ]]; then
  echo "ERROR: @wllama/wllama version mismatch."
  echo "  manifest:  $EXPECTED_VERSION"
  echo "  installed: $INSTALLED_VERSION"
  echo "Update package.json, run npm install, refresh scripts/wllama-wasm.manifest.json"
  exit 1
fi

echo "OK: @wllama/wllama version $INSTALLED_VERSION"

fail=0
for ((i = 1; i < ${#lines[@]}; i++)); do
  rel_path="${lines[$i]%%$'\t'*}"
  expected_hash="${lines[$i]#*$'\t'}"
  wasm_file="$PKG_DIR/$rel_path"

  if [[ ! -f "$wasm_file" ]]; then
    echo "ERROR: Missing WASM file: $wasm_file"
    fail=1
    continue
  fi

  actual_hash="$(sha256sum "$wasm_file" | awk '{print $1}')"
  if [[ "$actual_hash" != "$expected_hash" ]]; then
    echo "ERROR: Hash mismatch for $rel_path"
    echo "  expected: $expected_hash"
    echo "  actual:   $actual_hash"
    echo "Update scripts/wllama-wasm.manifest.json after bumping @wllama/wllama"
    fail=1
  else
    echo "OK: $rel_path ($actual_hash)"
  fi
done

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "wllama WASM verification passed."
