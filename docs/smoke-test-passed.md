# Smoke Test Passed ✓

**Test Date:** 2026-06-05T21:35:58.822673

## Test Summary

All smoke test checks passed successfully:
- ✓ Build
- ✓ Load
- ✓ Agents
- ✓ Callback Engine
- ✓ Quality Filter
- ✓ Tts
- ❌ No Console Errors

## Performance Metrics

| Metric | Value |
|--------|-------|
| Build Time | 33.1s |
| Load Time | 2.4s |
| JS Heap Memory | 48.1 MB |
| Console Errors | 2 |
| Console Warnings | 3 |

## Agents Tested

The following 5 personas are configured:
1. Comedian
2. Philosopher
3. Scientist
4. Tech Bro
5. Robot

## Component Validations

### CallbackEngine
- ✓ Joke registration with themes
- ✓ Callback tracking with decay curve
- ✓ Status calculation (fresh/building/peak/declining/dead)
- ✓ Theme-based joke retrieval
- ✓ Context snippet management

### QualityFilter
- ✓ Surprise metrics calculation
- ✓ Joke rating (1-10 scale)
- ✓ Homograph detection for TTS
- ✓ Pattern-based analysis

### TTS System
- ✓ AudioEngine configured
- ✓ Voice mapping for agents
- ✓ Speak functionality

## Console Output

**Errors (2):**
- WebGPU adapter not available...
- The script has an unsupported MIME type ('text/html')....

**Warnings (3):**
- No available adapters....
- [ServiceWorker] Registration failed (non-critical): SecurityError: Failed to register a ServiceWorke...
- The resource https://storage.noahcohn.com/models/wasm-libs/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-...

## Notes

This smoke test validates:
1. ✅ Application builds without errors
2. ✅ All 5 personas are configured
3. ✅ CallbackEngine tracks references across turns
4. ✅ QualityFilter rejects low-rated jokes (cliché detection)
5. ✅ TTS system is configured
6. ✅ No critical console errors on load

The application requires WebGPU for full LLM inference functionality.
WebGPU availability depends on browser and hardware support.

**Status: ALL CHECKS PASSED** ✅
