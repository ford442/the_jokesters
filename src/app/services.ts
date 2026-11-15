import type { GroupChatManager } from '../GroupChatManager'
import type { MemoryManager } from '../Director/MemoryManager'
import type { SfxManager } from '../audio/SfxManager'
import type { ShowMusic } from '../audio/ShowMusic'
import type { ShowAudioBus } from '../audio/showAudioBus'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { TtsEngine } from '../audio/AudioEngine'
import type { ClipRecorder } from '../recording/ClipRecorder'
import type { AvatarTier } from '../visuals/avatarTier'
import type { Stage } from '../visuals/Stage'

/**
 * Every long-lived service of one app run, built in `initApp()` and owned by
 * that run's `Scope` (which disposes them). Replaces the old per-module
 * `setShared*` / `getShared*` singletons: consumers receive this object
 * explicitly, so tests can hand in fakes and a re-init never leaves a stale
 * instance reachable.
 *
 * Fields set after the core boot (UI-created services) are optional.
 */
export interface AppServices {
  readonly memoryManager: MemoryManager
  readonly groupChatManager: GroupChatManager
  readonly audioEngine: TtsEngine
  readonly speechQueue: SpeechQueue
  readonly audioBus: ShowAudioBus
  readonly sfx: SfxManager
  readonly music: ShowMusic
  readonly stage: Stage
  readonly avatarTier: AvatarTier
  /** Created by `wireClipUi` once the master bus exists; null when recording is unavailable. */
  clipRecorder: ClipRecorder | null
}
