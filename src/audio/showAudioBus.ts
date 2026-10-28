/**
 * The show's master bus. Everything audible (TTS, SFX, music) feeds `master`, which feeds the
 * speakers and — lazily — a MediaStream tap so the clip recorder captures exactly what the
 * audience hears (including ducking and SFX volume), with no second mix to keep in sync.
 */
export class ShowAudioBus {
  readonly master: GainNode
  private tap: MediaStreamAudioDestinationNode | null = null

  constructor(readonly ctx: AudioContext) {
    this.master = ctx.createGain()
    this.master.gain.value = 1
    this.master.connect(ctx.destination)
  }

  /**
   * Stream of the master mix for recording. Created on first use; the tap is a plain extra
   * destination so it costs nothing when nobody records.
   */
  getRecordingStream(): MediaStream {
    if (!this.tap) {
      this.tap = this.ctx.createMediaStreamDestination()
      this.master.connect(this.tap)
    }
    return this.tap.stream
  }
}

let sharedBus: ShowAudioBus | null = null

export function setSharedShowAudioBus(bus: ShowAudioBus | null): void {
  sharedBus = bus
}

export function getSharedShowAudioBus(): ShowAudioBus | null {
  return sharedBus
}
