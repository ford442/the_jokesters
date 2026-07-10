#!/usr/bin/env bash
# Smoke-test that the custom web-llm dist exports CreateMLCEngine.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/3rd_party/web-llm-dist/lib/index.js"

[[ -f "$DIST" ]] || { echo "Missing $DIST — run ./scripts/build-webllm.sh"; exit 1; }

node --input-type=module -e "
import { CreateMLCEngine, ComedyLogitProcessor, classifyInitError } from 'file://$DIST';
if (typeof CreateMLCEngine !== 'function') throw new Error('CreateMLCEngine missing');
if (typeof ComedyLogitProcessor !== 'function') throw new Error('ComedyLogitProcessor missing');
if (classifyInitError(new Error('fetch failed')) !== 'network') throw new Error('classifyInitError broken');
console.log('web-llm dist smoke import OK');
"
