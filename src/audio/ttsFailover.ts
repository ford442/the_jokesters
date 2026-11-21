import type { TtsEngine } from './AudioEngine'
import { VPS_STORAGE_URL, VPS_STORAGE_ORIGIN, VPS_STORAGE_MIRROR_ORIGIN } from '../utils/vpsStorageUrl'

/**
 * TTS init hits the VPS storage host directly (not proxied through app-server
 * CORS), so a misconfigured or down origin (e.g. duplicate ACAO headers) fails
 * the whole `fetch`. Try primary, then fall back to the mirror host — never
 * both at once, since the engines hold mutable init state (worker, caches)
 * that a concurrent second `init()` call would clobber. A TTS failure on both
 * hosts must never block the LLM/stage from booting — voice degrades gracefully.
 */
export async function initAudioEngineWithFailover(audioEngine: TtsEngine): Promise<boolean> {
  const primaryPath = `${VPS_STORAGE_URL}/tts/onnx`
  try {
    await audioEngine.init(primaryPath)
    return true
  } catch (primaryError) {
    console.warn('[Audio] TTS init failed on primary storage host:', primaryError)
  }

  if (VPS_STORAGE_MIRROR_ORIGIN !== VPS_STORAGE_ORIGIN) {
    const mirrorPath = `${VPS_STORAGE_MIRROR_ORIGIN}/models/tts/onnx`
    try {
      await audioEngine.init(mirrorPath)
      console.log('[Audio] TTS init succeeded on mirror storage host')
      return true
    } catch (mirrorError) {
      console.warn('[Audio] TTS init failed on mirror storage host:', mirrorError)
    }
  }

  console.warn('[Audio] TTS unavailable on all storage hosts — continuing without voice.')
  return false
}

