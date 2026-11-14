/**
 * The single place that constructs an AudioContext, including the legacy
 * `webkitAudioContext` fallback (older Safari). Callers own the returned
 * context and must `close()` it on teardown.
 */
type AudioContextCtor = new (options?: AudioContextOptions) => AudioContext

export function createAudioContext(options?: AudioContextOptions): AudioContext {
  const Ctor: AudioContextCtor | undefined =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : (globalThis as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  if (!Ctor) throw new Error('Web Audio is not supported in this browser.')
  return new Ctor(options)
}
