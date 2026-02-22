/**
 * Audio Module Exports
 * 
 * Provides both legacy and optimized TTS implementations.
 * Recommended: Use OptimizedAudioEngine for new code.
 */

// Legacy exports (backward compatibility)
export { AudioEngine } from './AudioEngine';
export type { SynthesisOptions } from './AudioEngine';
export { SpeechQueue } from './SpeechQueue';
export { SupertonicPipeline, Style, UnicodeProcessor } from './SupertonicPipeline';
export { SupertonicTTS } from './Supertonic';
export { LipSync } from '../visuals/LipSync';

// Optimized exports (recommended)
export { OptimizedAudioEngine } from './OptimizedAudioEngine';
export type { 
    SynthesisResult,
    SynthesisCallback,
    VisemeCallback,
    ErrorCallback 
} from './OptimizedAudioEngine';
export { OptimizedSpeechQueue } from './OptimizedSpeechQueue';
export type { QueuedUtterance } from './OptimizedSpeechQueue';
export { VisemePredictor } from './VisemePredictor';
export type { Viseme, VisemeSequence, MouthShape } from './VisemePredictor';
export { PhonemeCache } from './PhonemeCache';
export type { CachedPhoneme } from './PhonemeCache';
export { TTSLatencyProfiler, ttsProfiler } from './TTSLatencyProfiler';
export type { LatencyMetrics } from './TTSLatencyProfiler';
export { TTSBenchmark } from './TTSBenchmark';
export type { BenchmarkResult, BenchmarkSuite } from './TTSBenchmark';

// Music and voice input
export { MusicEngine } from './MusicEngine';
export { VoiceInputManager } from './VoiceInputManager';

// Singleton instances
export { optimizedAudioEngine } from './OptimizedAudioEngine';
