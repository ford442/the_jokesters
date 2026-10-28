import type { Agent } from '../GroupChatManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import { getSharedShowAudioBus } from '../audio/showAudioBus'
import type { Stage } from '../visuals/Stage'
import { ClipRecorder, downloadClip, CLIP_WINDOW_SEC, type ClipFormat } from '../recording/ClipRecorder'
import { getLastEpisode } from '../episode'
import type { ChatLogApi } from './chatLog'

let shared: ClipRecorder | null = null

export function getSharedClipRecorder(): ClipRecorder | null {
  return shared
}

export interface ClipUiDeps {
  agents: Agent[]
  speechQueue: SpeechQueue
  stage: Stage
  chatLog: ChatLogApi
}

/**
 * Wire the "🎬 Clip last 30 s" buttons (episode bar + always-visible row), the format
 * picker (MP4 only when WebCodecs can encode it) and the buffer status readout.
 */
export function wireClipUi(deps: ClipUiDeps): void {
  const { agents, speechQueue, stage, chatLog } = deps
  const bus = getSharedShowAudioBus()
  if (!bus) {
    console.warn('[clipUi] ShowAudioBus not ready — clip recording unavailable')
    return
  }
  if (typeof MediaStream === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
    console.warn('[clipUi] canvas.captureStream unavailable — clip recording disabled')
    document.querySelectorAll<HTMLElement>('.clip-last-btn').forEach((b) => { b.style.display = 'none' })
    return
  }

  const recorder = new ClipRecorder({
    onAfterRender: (cb) => stage.onAfterRender(cb),
    getAudioStream: () => bus.getRecordingStream(),
    audioSampleRate: bus.ctx.sampleRate,
    speech: {
      onUtteranceStart: (cb) => speechQueue.onUtteranceStart(cb),
      onUtteranceEnd: (cb) => speechQueue.onUtteranceEnd(cb),
    },
    resolveSpeaker: (id) => {
      const a = agents.find((x) => x.id === id)
      return { name: a?.name ?? id, color: a?.color ?? '#ffffff' }
    },
  })
  shared = recorder

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.clip-last-btn'))
  const formatEl = document.getElementById('clip-format') as HTMLSelectElement | null
  const statusEl = document.getElementById('clip-status')

  void recorder.isMp4Supported().then((ok) => {
    if (!formatEl || !ok) return
    formatEl.style.display = ''
    formatEl.value = recorder.getFormat()
  })
  formatEl?.addEventListener('change', () => {
    void recorder.setFormat(formatEl.value as ClipFormat).then((f) => {
      formatEl.value = f
    })
  })

  const refreshStatus = () => {
    if (!statusEl) return
    const buffered = Math.round(recorder.bufferedSeconds())
    statusEl.textContent = recorder.isRecording() ? `● REC · ${Math.min(buffered, 99)}s buffered` : ''
  }
  window.setInterval(refreshStatus, 1000)

  let busy = false
  const onClip = async () => {
    if (busy) return
    busy = true
    buttons.forEach((b) => { b.disabled = true })
    try {
      const clip = await recorder.clip()
      if (!clip) {
        chatLog.addMessage('System', '🎬 Nothing recorded yet — start a scene (or let someone speak) first, then clip.', '#ff6b6b')
        return
      }
      const title = getLastEpisode()?.sceneState?.title ?? 'clip'
      const name = downloadClip(clip, title)
      const mb = (clip.blob.size / 1_048_576).toFixed(1)
      chatLog.addMessage('System', `🎬 Saved ${name} · ~${Math.round(clip.seconds)}s of the last ${CLIP_WINDOW_SEC}s window · ${mb} MB`, '#4ecdc4')
    } catch (err) {
      console.error('[clipUi] clip failed', err)
      chatLog.addMessage('System', '🎬 Could not save the clip — see console.', '#ff6b6b')
    } finally {
      busy = false
      buttons.forEach((b) => { b.disabled = false })
    }
  }
  buttons.forEach((b) => b.addEventListener('click', () => { void onClip() }))
}
