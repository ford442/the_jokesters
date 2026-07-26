import type { GroupChatManager } from '../GroupChatManager'
import type { Agent } from '../GroupChatManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Stage } from '../visuals/Stage'
import type { ChatLogApi } from './chatLog'
import { createAudioHelpers } from './chatController'
import type { TtsEngine } from '../audio/AudioEngine'
import {
  buildEpisodeFromHistory,
  downloadEpisodeJson,
  downloadEpisodeMarkdown,
  episodeToPlainText,
  getLastEpisode,
  parseAndValidateEpisode,
  setLastEpisode,
  replayEpisode,
  type EpisodeReplayHandle,
  type EpisodeSceneState,
  type JokestersEpisode,
} from '../episode'
import { getSharedSfxManager } from '../audio/SfxManager'

export interface EpisodeUiDeps {
  agents: Agent[]
  groupChatManager: GroupChatManager
  audioEngine: TtsEngine
  speechQueue: SpeechQueue
  stage: Stage
  chatLog: ChatLogApi
}

let activeReplay: EpisodeReplayHandle | null = null

/**
 * Capture current conversation as a portable episode and show the export bar.
 */
export function captureEpisodeFromManager(
  groupChatManager: GroupChatManager,
  agents: Agent[],
  sceneState?: EpisodeSceneState,
): JokestersEpisode | null {
  const history = groupChatManager.getHistory()
  if (history.length === 0) return null

  const episode = buildEpisodeFromHistory({
    history,
    agents,
    modelId: groupChatManager.getLoadedModelId(),
    sceneState,
  })

  // Require at least one spoken (assistant) turn
  if (episode.turns.length === 0) return null

  setLastEpisode(episode)
  return episode
}

/** Show one-click export panel after a scene stops. */
export function showEpisodeExportBar(episode?: JokestersEpisode | null): void {
  const ep = episode ?? getLastEpisode()
  const bar = document.getElementById('episode-export-bar')
  if (!bar) return

  if (!ep || ep.turns.length === 0) {
    bar.style.display = 'none'
    return
  }

  bar.style.display = 'flex'
  const meta = bar.querySelector('.episode-export-meta')
  if (meta) {
    const title = ep.sceneState?.title ?? 'Episode'
    meta.textContent = `💾 ${title} · ${ep.turns.length} turns — export or replay`
  }
}

export function hideEpisodeExportBar(): void {
  const bar = document.getElementById('episode-export-bar')
  if (bar) bar.style.display = 'none'
}

export function wireEpisodeUi(deps: EpisodeUiDeps): void {
  const { agents, groupChatManager, audioEngine, speechQueue, stage, chatLog } = deps
  const { speakAndVisualize } = createAudioHelpers(audioEngine, speechQueue, stage)

  const bar = document.getElementById('episode-export-bar')
  const exportJsonBtn = document.getElementById('export-episode-json-btn') as HTMLButtonElement | null
  const exportMdBtn = document.getElementById('export-episode-md-btn') as HTMLButtonElement | null
  const copyTxtBtn = document.getElementById('export-episode-copy-btn') as HTMLButtonElement | null
  const replayBtn = document.getElementById('replay-episode-btn') as HTMLButtonElement | null
  const stopReplayBtn = document.getElementById('stop-replay-btn') as HTMLButtonElement | null
  const importBtn = document.getElementById('import-episode-btn') as HTMLButtonElement | null
  const importInput = document.getElementById('import-episode-input') as HTMLInputElement | null
  const dismissBtn = document.getElementById('dismiss-episode-bar-btn') as HTMLButtonElement | null

  const getEpisode = (): JokestersEpisode | null => getLastEpisode()

  exportJsonBtn?.addEventListener('click', () => {
    const ep = getEpisode()
    if (!ep) {
      chatLog.addMessage('System', 'Nothing to export yet — run a scene first.', '#ff6b6b')
      return
    }
    downloadEpisodeJson(ep)
    chatLog.addMessage('System', `⬇️ Downloaded ${ep.episodeId ?? 'episode'}.jokesters.json`, '#4ecdc4')
  })

  exportMdBtn?.addEventListener('click', () => {
    const ep = getEpisode()
    if (!ep) {
      chatLog.addMessage('System', 'Nothing to export yet — run a scene first.', '#ff6b6b')
      return
    }
    downloadEpisodeMarkdown(ep)
    chatLog.addMessage('System', '⬇️ Downloaded Markdown transcript', '#4ecdc4')
  })

  copyTxtBtn?.addEventListener('click', async () => {
    const ep = getEpisode()
    if (!ep) return
    const text = episodeToPlainText(ep)
    try {
      await navigator.clipboard.writeText(text)
      chatLog.addMessage('System', '📋 Transcript copied to clipboard', '#4ecdc4')
    } catch {
      chatLog.addMessage('System', 'Could not copy — try Export MD instead.', '#ff6b6b')
    }
  })

  const setReplayUi = (playing: boolean) => {
    if (replayBtn) replayBtn.style.display = playing ? 'none' : 'inline-block'
    if (stopReplayBtn) stopReplayBtn.style.display = playing ? 'inline-block' : 'none'
  }

  replayBtn?.addEventListener('click', () => {
    const ep = getEpisode()
    if (!ep) {
      chatLog.addMessage('System', 'No episode loaded to replay.', '#ff6b6b')
      return
    }
    startReplay(ep)
  })

  stopReplayBtn?.addEventListener('click', () => {
    activeReplay?.stop()
    activeReplay = null
    setReplayUi(false)
  })

  importBtn?.addEventListener('click', () => {
    importInput?.click()
  })

  importInput?.addEventListener('change', async () => {
    const file = importInput.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const result = parseAndValidateEpisode(text)
      if (!result.ok || !result.episode) {
        const msg = result.errors.map((e) => e.message).join(' ')
        chatLog.addMessage('System', `⚠️ Import failed: ${msg}`, '#ff6b6b')
        return
      }
      setLastEpisode(result.episode)
      showEpisodeExportBar(result.episode)
      chatLog.addMessage(
        'System',
        `📥 Imported "${result.episode.sceneState?.title ?? file.name}" · ${result.episode.turns.length} turns (validated)`,
        '#4ecdc4',
      )
    } catch (e) {
      console.error(e)
      chatLog.addMessage('System', 'Import failed — invalid file.', '#ff6b6b')
    } finally {
      importInput.value = ''
    }
  })

  dismissBtn?.addEventListener('click', () => {
    hideEpisodeExportBar()
  })

  function startReplay(episode: JokestersEpisode): void {
    if (activeReplay?.isRunning()) {
      activeReplay.stop()
    }

    // TTS-only: never calls GroupChatManager / LLM
    setReplayUi(true)
    showEpisodeExportBar(episode)

    activeReplay = replayEpisode(episode, {
      onMessage: (sender, message, color) => chatLog.addMessage(sender, message, color),
      onSpeak: async (text, agentId, options) => {
        await speakAndVisualize(text, agentId, options)
      },
      onTurnStart: (agentId) => {
        stage.setActiveActor(agentId === 'user' ? agents[0]?.id ?? agentId : agentId)
      },
      onThinking: (agentId, thinking) => {
        stage.setThinking(agentId, thinking)
      },
      onReactToText: (agentId, text) => {
        stage.reactToText(agentId, text)
      },
      onSfx: (name, agentId) => {
        void getSharedSfxManager()?.play(name, agentId)
      },
      waitUntilFinished: () => speechQueue.waitUntilFinished(),
      getTtsSteps: () => {
        const el = document.getElementById('tts-steps') as HTMLInputElement | null
        return el ? parseInt(el.value || '10', 10) : 10
      },
      onComplete: () => {
        activeReplay = null
        setReplayUi(false)
      },
      onStop: () => {
        activeReplay = null
        setReplayUi(false)
      },
    })
  }

  // Keep a tiny always-visible import affordance outside the bar
  const alwaysImport = document.getElementById('import-episode-always-btn')
  alwaysImport?.addEventListener('click', () => importInput?.click())

  // Expose for improvController / Director
  ;(window as any).__jokestersEpisode = {
    capture: (sceneState?: EpisodeSceneState) =>
      captureEpisodeFromManager(groupChatManager, agents, sceneState),
    showBar: showEpisodeExportBar,
    hideBar: hideEpisodeExportBar,
    setEpisode: (ep: JokestersEpisode) => {
      setLastEpisode(ep)
      showEpisodeExportBar(ep)
    },
    replay: startReplay,
  }
}
