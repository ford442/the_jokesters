# Scripts

Utility scripts for model hosting, WebLLM builds, and deployment.

## Keepers (use these)

| Script | Purpose |
|--------|---------|
| `build-webllm.sh` | Build custom `@mlc-ai/web-llm` from `3rd_party/` submodule |
| `verify-webllm-dist.sh` | Verify custom web-llm dist output |
| `verify_wllama_wasm.sh` | Ensure wllama WASM matches package version (`npm run verify:wllama`) |
| `verify_model_urls.py` | HEAD-check model URLs on primary + mirror hosts |
| `verify_vps_headers.py` | CORS / cache headers on VPS |
| `verify_vicuna_shards.py` | Vicuna shard integrity |
| `test_model_loading.py` | Smoke model path loading against VPS |
| `download_models_on_vps.py` | Download models onto VPS disk |
| `migrate_all_models.py` | Migrate HF → VPS (SSH/paramiko; uses env credentials) |
| `upload_staged_to_vps.py` | Upload `.vps-staging/` via SSH key |
| `generate-mode-registry.mjs` | Regenerate mode registry entries |
| `stage_vicuna_wasm_from_ci.sh` / `build-vicuna-wasm.sh` | Vicuna WASM pipeline (`mlc_llm compile`; see ADR) |
| `deploy_dist.py` | **Deploy `dist/` over SFTP — credentials via env only** |
| `smoke_test.py` | Playwright-oriented smoke test |

### Native / C++ policy

There is **no first-party C++ tree**. WASM comes from MLC compile, `@wllama/wllama`, and onnxruntime-web.  
**Do not** install full TVM/emsdk for product work unless metrics green-light it.

- **ADR:** [docs/adr/0001-native-cpp-boundary.md](../docs/adr/0001-native-cpp-boundary.md)
- **Official Vicuna `model_lib` path:** `build-vicuna-wasm.sh` + Colab [`public/Jokesters_WebLLM_Compile.ipynb`](../public/Jokesters_WebLLM_Compile.ipynb)
- **Context/VRAM layering:** [docs/WASM_CONTEXT_GUIDE.md](../docs/WASM_CONTEXT_GUIDE.md)
- **wllama pin:** `npm run verify:wllama` (GitHub #119 for deeper llama.cpp work)

See also: `docs/MODEL_HOSTING.md`, `docs/DEPLOY_CHECKLIST.md`.

## Environment — model host

App code reads Vite env (build-time):

```bash
# .env.local (not committed)
VITE_VPS_STORAGE_ORIGIN=https://storage.1ink.us
# optional mirror label for docs/ops
VITE_VPS_STORAGE_MIRROR_ORIGIN=https://storage.noahcohn.com
```

Canonical constant: `src/utils/vpsStorageUrl.ts` → `VPS_STORAGE_ORIGIN` / `VPS_STORAGE_URL`.

## Environment — deploy

`scripts/deploy_dist.py` uploads `dist/` via Paramiko SFTP. **No secrets in the repo.**

```bash
# Preferred: SSH key
export DEPLOY_HOST=1ink.us                 # or JOKESTERS_SFTP_HOST
export DEPLOY_USER=deploy                  # required
export DEPLOY_KEY=~/.ssh/id_ed25519        # preferred over password
export DEPLOY_REMOTE_DIR=/var/www/the-jokesters

# Optional password fallback (or passphrase for encrypted keys)
# export DEPLOY_PASS=...

# Destructive: wipe remote contents before upload (default off)
# export DEPLOY_CLEAN=1

npm run deploy              # build + upload
npm run deploy:dry          # build + dry-run (no remote writes)
npm run deploy:verify       # build + upload + SHA-256 sample verify

python scripts/deploy_dist.py --dry-run
python scripts/deploy_dist.py --clean --verify
```

Legacy aliases: `JOKESTERS_SFTP_*` still work.

**Guards:**
- Refuses to run if credentials contain `CHANGEME` / similar placeholders
- `--dry-run` lists mkdir/put/delete without writing
- Key auth preferred; password optional fallback
- GitHub Actions: `.github/workflows/deploy.yml` (`workflow_dispatch`, secrets `DEPLOY_USER` + `DEPLOY_KEY`)

**Never commit credentials** or paste keys into git history. Rotate any key that was ever committed. Use GitHub Actions secrets or a local env file that is gitignored (`*.local`).

## Archive

One-off historical patches live in `scripts/archive/obsolete/` (do not run).
They were applied during mode/dashboard refactors and are kept only for archaeology.
