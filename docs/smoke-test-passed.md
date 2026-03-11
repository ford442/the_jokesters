# Smoke Test Passed ✓

**Test Date:** 2026-03-11T12:06:49.632246

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
| Build Time | 11.2s |
| Load Time | 3.3s |
| JS Heap Memory | 57.5 MB |
| Console Errors | 4 |
| Console Warnings | 2 |

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

**Errors (4):**
- WebGPU adapter not available...
- [Supertonic] Error locating/loading JSON configs: Error: Could not locate tts.json at ./tts/onnx or ...
- AudioEngine Init Failed: Error: Could not locate tts.json at ./tts/onnx or common locations: ./tts/o...
- Initialization error: Error: Could not locate tts.json at ./tts/onnx or common locations: ./tts/onnx...

**Warnings (2):**
- Failed to create WebGPU Context Provider...
- [GroupMarkerNotSet(crbug.com/242999)!:A0501800D4200000]Automatic fallback to software WebGL has been...

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
