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

### Note on deploy.py
The current `deploy.py` script contains hardcoded credentials. **Move these to environment variables:**
```python
# BEFORE (hardcoded - SECURITY RISK)
SFTP_HOST = 'example.com'
SFTP_USER = 'username'
SFTP_PASS = 'password'

# AFTER (environment variables)
import os
SFTP_HOST = os.environ.get('JOKESTERS_SFTP_HOST')
SFTP_USER = os.environ.get('JOKESTERS_SFTP_USER')
SFTP_PASS = os.environ.get('JOKESTERS_SFTP_PASS')
```

---

## Server Headers (COOP/COEP)

### Current Configuration
The application uses `base: './'` in `vite.config.ts` for flexible deployment. COOP/COEP headers are currently **commented out** but may be needed for certain WebGPU scenarios.

### Optional Headers (Enable if needed)
If you encounter WebGPU cross-origin issues, add these headers:

```nginx
# Nginx
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "credentialless" always;
```

```apache
# Apache
Header always set Cross-Origin-Opener-Policy "same-origin"
Header always set Cross-Origin-Embedder-Policy "credentialless"
```

```javascript
// Vite dev server (vite.config.ts)
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'credentialless',
  },
}
```

### When to Enable COOP/COEP
- Enable if using SharedArrayBuffer features
- Enable if models fail to load due to CORS issues
- Not required for standard WebGPU operation

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
   python deploy.py
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

- [ ] Move SFTP credentials from `deploy.py` to environment variables
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
