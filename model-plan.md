# WebLLM Model Setup and Loading Guide

## Overview

This project uses [@mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) to run Large Language Models (LLMs) entirely in the browser using WebGPU acceleration. This document explains how the model loading system works and what you need to know to configure and troubleshoot it.

## How WebLLM Model Loading Works

### 1. Model Configuration

Models in WebLLM require several components to work:

- **Model Weights**: The actual trained model parameters, typically stored as binary files on Hugging Face
- **Model Library (WASM)**: A WebAssembly runtime compiled specifically for the model's architecture (e.g., Llama-2, Phi-3, etc.)
- **Model Metadata**: Configuration including context window size, VRAM requirements, and quantization format

All models must be registered in `webllm.prebuiltAppConfig.model_list` before they can be loaded.

### 2. Model Configuration Format

Each model in the configuration list must have these fields:

```typescript
{
  model_id: 'unique-model-identifier',           // Used to select the model
  model: 'https://url-to-model-weights/',        // MUST end with /resolve/main/ for HF
  model_lib: 'https://url-to-wasm-runtime.wasm', // Architecture-specific WASM
  vram_required_MB: 2048,                        // Estimated VRAM needed
  low_resource_required: false,                  // Whether model needs special handling
  overrides: { context_window_size: 4096 }       // Optional config overrides
}
```

### 3. Current Model Registry

The project currently supports these models (defined in `src/main.ts`):

1. **Hermes-3-Llama-3.2-3B-q4f32_1-MLC** (default)
   - 3B parameter model, 4-bit quantized
   - ~2.9GB VRAM required
   - Good balance of quality and speed

2. **TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC**
   - Smallest model for testing
   - ~2GB VRAM required

3. **ford442/vicuna-7b-q4f32-webllm** (custom)
   - User's custom 7B model
   - ~4GB VRAM required

4. **Qwen2-0.5B-Instruct-q4f32_1-MLC**
   - 0.5B parameter model
   - Very lightweight

5. **Phi-3.5-vision-instruct** (q4f16 and q4f32 variants)
   - Vision-language model
   - ~4-6GB VRAM required

6. **SmolLM2-360M-Instruct-q4f32_1-MLC**
   - Ultra-lightweight model
   - ~580MB VRAM required

7. **snowflake-arctic-embed-s-q0f32-MLC-b4**
   - Embedding model for vector tasks
   - ~239MB VRAM required

## Model Loading Process

### Step-by-Step Flow

1. **User selects model** from dropdown in UI
2. **Preflight checks** verify model URLs are reachable:
   - HEAD request to model weights URL
   - HEAD/Range GET to WASM runtime URL
   - Validates content-type headers
3. **Terminate existing model** if one is loaded (frees VRAM)
4. **CreateMLCEngine** is called with the model ID:
   - Downloads model weights (cached by browser)
   - Downloads WASM runtime (cached by browser)
   - Initializes WebGPU compute pipeline
5. **Progress callbacks** update UI during download/initialization
6. **Model ready** for inference

### Where Network Errors Occur

The most common error is:
```
Failed to initialize GroupChatManager: NetworkError: Failed to execute 'add' on 'Cache'
```

This happens when:
- **Network timeouts**: Model files are large (2-8GB), slow connections may timeout
- **CORS issues**: Model host blocks cross-origin requests
- **Cache quota exceeded**: Browser storage limit reached
- **Interrupted downloads**: Connection drops during multi-GB download
- **Rate limiting**: CDNs (like raw.githubusercontent.com) may rate-limit requests
- **Invalid URLs**: Model/WASM URLs point to HTML pages instead of binary files

## Safeguards and Fallbacks

### Current Safeguards (as of this document)

1. **URL Validation**: Preflight checks verify model/WASM URLs return binary content
2. **Timeout Handling**: Network requests have 5-8 second timeouts for HEAD checks
3. **Retry Logic**: Exponential backoff retry (3 attempts) for CreateMLCEngine failures
4. **Cache Clearing**: On cache errors, attempts to clear and retry
5. **Graceful Degradation**: Failed loads don't crash the app; UI remains interactive
6. **Detailed Error Messages**: Network errors show actionable troubleshooting steps

### Fallback Strategies

1. **Alternative CDN Sources**: If primary URL fails, tries mirror/alternative CDN
2. **Smaller Models**: User can switch to a smaller model if VRAM/network is insufficient
3. **Local Model Hosting**: Advanced users can host models locally and update URLs
4. **Progressive Loading**: Model downloads use streaming where possible

## Troubleshooting Common Issues

### Issue: "Cache.add() encountered a network error"

**Causes:**
- Network interruption during large file download
- Browser cache quota exceeded
- CORS policy blocking the request

**Solutions:**
1. Check browser console Network tab for specific failed requests
2. Try clearing browser cache (Settings → Privacy → Clear browsing data)
3. Try a different, smaller model
4. Check your network connection and disable VPN/proxy temporarily
5. Verify model URLs point to `/resolve/main/` (not just repo root)

### Issue: Model download stuck at 0%

**Causes:**
- URL points to HTML page instead of binary files
- CDN rate limiting or geo-blocking
- WebGPU not available in browser

**Solutions:**
1. Verify WebGPU support: visit `chrome://gpu` and check for WebGPU
2. Check that model URLs end with `/resolve/main/` for Hugging Face
3. Try a different model that uses `mlc-ai` official URLs
4. Update to latest Chrome/Edge (113+)

### Issue: "Model runtime is not reachable"

**Causes:**
- WASM file URL is invalid or rate-limited
- Content-type headers indicate HTML instead of binary

**Solutions:**
1. Check the `model_lib` URL in browser directly
2. If using GitHub raw URLs, they may be rate-limited; use jsDelivr CDN instead
3. Ensure WASM URL points to `.wasm` file, not a directory

### Issue: Out of memory / VRAM exhausted

**Causes:**
- Model too large for available GPU memory
- Multiple models loaded simultaneously
- Browser didn't release previous model

**Solutions:**
1. Select a smaller model (SmolLM2, TinyLlama)
2. Close other GPU-intensive browser tabs
3. Refresh the page to clear GPU memory
4. Check VRAM requirements in model config

## Adding Custom Models

To add your own model:

1. **Prepare the model** with MLC-LLM tools (quantize and compile)
2. **Host the weights** on Hugging Face or a CDN
3. **Find or compile the WASM runtime** for your model architecture
4. **Register in the config** (see `src/main.ts` lines 14-132):

```typescript
const myCustomModel = {
  model_id: 'my-custom-model-id',
  model: 'https://huggingface.co/user/model-name/resolve/main/',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/...',
  vram_required_MB: 3000,
  low_resource_required: false,
};

// Register it
webllm.prebuiltAppConfig.model_list.push(myCustomModel);
```

5. **Add to dropdown** in `availableModels` array
6. **Test thoroughly** with the Load Model button

## Performance Considerations

- **First load**: Expect 2-10 minute download depending on model size and connection
- **Subsequent loads**: Models are cached; should load in seconds
- **Inference speed**: Depends on GPU; typical 5-20 tokens/second on consumer GPUs
- **VRAM usage**: 4-bit quantized models use ~25% of full model size

## References

- [MLC-AI Web-LLM Documentation](https://llm.mlc.ai/docs/)
- [WebGPU Compatibility](https://caniuse.com/webgpu)
- [Hugging Face Model Hub](https://huggingface.co/models)
- [MLC Binary WASM Libraries](https://github.com/mlc-ai/binary-mlc-llm-libs)

## Best Practices

1. **Start with smaller models** when testing (SmolLM2, TinyLlama)
2. **Use official mlc-ai URLs** when possible for reliability
3. **Monitor browser console** for detailed error messages
4. **Clear cache periodically** if storage is limited
5. **Keep browser updated** for latest WebGPU improvements
6. **Test model URLs** in browser before adding to config
7. **Document custom models** with version and source for reproducibility
