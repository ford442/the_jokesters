# The Jokesters - Deployment Checklist

## Pre-Deployment Verification

### 1. Build Verification
- [ ] Run `npm run build` successfully (no TypeScript errors)
- [ ] Run `npm run verify:wllama` (WASM hashes match pinned `@wllama/wllama` version)
- [ ] Verify `dist/` directory contains:
  - [ ] `index.html` (entry point)
  - [ ] `assets/` directory with:
    - [ ] `index-*.js` (main application bundle)
    - [ ] `index-*.css` (styles)
    - [ ] `ort-*.js` (ONNX runtime bundle)
    - [ ] `ort/` subdirectory with WASM files:
      - [ ] `ort.wasm.mjs`, `ort.webgpu.mjs`, etc.
      - [ ] `ort-wasm-simd-threaded.jsep.wasm` (main WASM)
  - [ ] `vite.svg` (favicon)
  - [ ] `scenarios/` directory (if using scenario files)

### 2. External Assets (Host Separately)
The following assets are NOT included in the build and must be hosted separately:

#### TTS Models (Required for Text-to-Speech)
Location: `./tts/onnx/` (relative to deployment root)
```
tts/onnx/
├── tts.json                    # TTS configuration
├── unicode_indexer.json        # Text processing index
├── duration_predictor.onnx     # Duration prediction model
├── text_encoder.onnx           # Text encoder model
├── vector_estimator.onnx       # Vector estimation model
└── vocoder.onnx                # Vocoder model
```

#### Voice Styles (Required for TTS)
Location: `./tts/voice_styles/` (relative to deployment root)
```
tts/voice_styles/
├── M1.json                     # Male voice 1 (Scientist)
├── M2.json                     # Male voice 2 (Philosopher)
├── F1.json                     # Female voice 1 (Comedian)
└── F2.json                     # Female voice 2
```

#### LLM Models (Downloaded at Runtime)
- Models are downloaded from HuggingFace/CDN on first run
- Cached in browser IndexedDB
- No server hosting required

---

## Environment Variables

The following environment variables should be configured on the deployment server:

### Optional: HuggingFace Cloud Sync
| Variable | Description | Required |
|----------|-------------|----------|
| `HF_TOKEN` | HuggingFace API token for cloud episode sync | No |

### Deploy scripts (env-only credentials)

**Preferred (Contabo zip):** root `deploy.py` — no SFTP secrets in the client:

```bash
export DEPLOY_TOKEN="..."    # when VPS has_token=true
# export DEPLOY_TARGET=go    # default: test
npm run build && python deploy.py
```

**Direct SFTP:** `scripts/deploy_dist.py` / `npm run deploy` — **no secrets in the repo**:

```bash
export DEPLOY_HOST=1ink.us
export DEPLOY_USER=deploy
export DEPLOY_KEY=~/.ssh/id_ed25519           # preferred over password
# export DEPLOY_PASS=...                     # fallback only
export DEPLOY_REMOTE_DIR=/var/www/the-jokesters

npm run deploy:dry        # build + dry-run (no remote writes)
npm run deploy            # build + SFTP upload
npm run deploy:verify     # build + upload + checksum sample
# Destructive clean (default off):
# DEPLOY_CLEAN=1 npm run deploy
```

Guards (SFTP): refuses `CHANGEME` placeholders; supports `--dry-run`, key auth, optional `--verify`.  
CI: GitHub Actions **Deploy dist** workflow (`workflow_dispatch`) with secrets `DEPLOY_USER` + `DEPLOY_KEY`.  
See `scripts/README.md`. **Never commit keys or passwords; rotate anything that was ever committed.**

---

## Server Headers (COOP/COEP)

Cross-origin isolation is **on** (#400): `Cross-Origin-Opener-Policy: same-origin` +
`Cross-Origin-Embedder-Policy: credentialless` make `crossOriginIsolated === true`, which enables
SharedArrayBuffer → multithreaded llama.cpp (wllama) and ONNX Runtime (Supertonic TTS). The guided
launch shows an **Isolated (N threads)** / **Not isolated** badge next to the WebGPU status.

Where the headers come from (keep in sync with `src/utils/crossOriginIsolation.ts`):

| Context | Source |
|---------|--------|
| `npm run dev` / `npm run preview` | `server.headers` / `preview.headers` in `vite.config.ts` |
| Apache hosts (DreamHost, `test.1ink.us` / `go.1ink.us`) | `public/.htaccess` → `dist/.htaccess` (needs `mod_headers`) |
| Hosts that cannot set headers | `src/service-worker.ts` adds them to documents / worker scripts; the page reloads once when the SW first takes control (`src/app/isolationReload.ts`, opt out with `?noCoiReload`) |

nginx equivalent:

```nginx
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "credentialless" always;
```

`credentialless` (not `require-corp`) keeps cross-origin no-cors loads working without CORP
headers. All model / TTS fetches are CORS requests; verified hosts sending
`Access-Control-Allow-Origin`: `storage.1ink.us`, `storage.noahcohn.com`, `huggingface.co`,
`raw.githubusercontent.com`. Browsers without `credentialless` (Safari) ignore it: no isolation,
single-threaded WASM, nothing breaks.

Related flags: `?ttsWebgpu` tries ORT's WebGPU execution provider for TTS (falls back to wasm);
`?legacyPrompt` restores per-speaker system prompts (disables the shared-prefix KV reuse).

---

## WebGPU Requirements

### Browser Support
| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 113+ | Recommended |
| Edge | 113+ | Full support |
| Opera | 99+ | Full support |
| Chrome Android | 121+ | Mobile support |
| Safari | - | WebGPU coming soon |
| Firefox | - | In development |

### GPU Requirements
- **Minimum**: Any GPU with WebGPU support
- **Recommended**: 4GB+ VRAM for larger models
- **Integrated GPUs**: Supported but slower

### Feature Detection
The application includes automatic WebGPU detection in `index.html`:
- Displays graceful error message if WebGPU unavailable
- Shows browser compatibility information
- Provides troubleshooting guidance

### Testing WebGPU Support
Open browser console and run:
```javascript
// Check if WebGPU is available
if (navigator.gpu) {
  navigator.gpu.requestAdapter().then(adapter => {
    console.log('WebGPU supported:', adapter);
  });
} else {
  console.log('WebGPU not supported');
}
```

---

## Deployment Steps

1. **Build Application**
   ```bash
   npm ci
   npm run build
   ```

2. **Verify Build**
   ```bash
   ls -la dist/
   # Check all required files present
   ```

3. **Upload TTS Assets** (if using TTS)
   - Upload `./tts/onnx/` to server
   - Upload `./tts/voice_styles/` to server

4. **Deploy Application**
   ```bash
   python scripts/deploy_dist.py
   # OR manually upload dist/ contents to web server
   ```

5. **Verify Deployment**
   - [ ] Site loads without 404 errors
   - [ ] WebGPU detection works (test in unsupported browser)
   - [ ] Model loads successfully
   - [ ] TTS works (if assets uploaded)
   - [ ] 3D visualization renders

---

## Post-Deployment Troubleshooting

### "Cache.add() encountered a network error"
- Clear browser cache
- Check model URLs end with `/resolve/main/`
- Verify CORS headers on model hosting

### Model stuck at 0%
- Verify WebGPU at `chrome://gpu`
- Check console for CSP errors
- Ensure HTTPS (WebGPU requires secure context)

### TTS not working
- Verify `tts/onnx/` files are accessible
- Check browser console for 404 errors
- Ensure voice style JSON files load successfully

### Out of memory
- Close other GPU-intensive tabs
- Use smaller model (e.g., SmolLM2-360M)
- Refresh to clear GPU memory

---

## Security Checklist

- [x] SFTP credentials via env only (`scripts/deploy_dist.py` — never commit secrets)
- [ ] Use HTTPS in production (required for WebGPU)
- [ ] Set appropriate CORS headers for model hosting
- [ ] Review Content Security Policy if implementing
- [ ] Verify no API keys in client-side code (except optional HF token)

---

## Rollback Plan

1. Keep previous deployment backup
2. Document current working version
3. Test deployment on staging environment first
4. Monitor error rates post-deployment
