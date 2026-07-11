import type { EpisodeAgent, EpisodeTurn, JokestersEpisode } from './types'

export interface EpisodeReplayCallbacks {
  onMessage: (sender: string, message: string, color: string) => void
  onSpeak: (
    text: string,
    agentId: string,
    options?: { steps?: number; seed?: number; speed?: number },
  ) => Promise<void>
  onTurnStart?: (agentId: string) => void | Promise<void>
  onTurnEnd?: () => void | Promise<void>
  /** Optional: thinking pose while "preparing" a turn (no LLM). */
  onThinking?: (agentId: string, thinking: boolean) => void
  /** Optional: map text → reaction clip on the avatar. */
  onReactToText?: (agentId: string, text: string) => void
  /** Optional: play episode turn.sfx or inline [sfx:] tokens */
  onSfx?: (name: string, agentId?: string) => void
  onComplete?: () => void
  onStop?: () => void
  /** Wait until TTS queue is idle between turns. */
  waitUntilFinished?: () => Promise<void>
  getTtsSteps?: () => number
}

export interface EpisodeReplayHandle {
  stop: () => void
  isRunning: () => boolean
}

/**
 * Replay an episode with TTS + lip-sync only — no LLM required.
 * Speaks each turn in order; avatars can re-render via onTurnStart/onSpeak.
 */
export function replayEpisode(
  episode: JokestersEpisode,
  callbacks: EpisodeReplayCallbacks,
): EpisodeReplayHandle {
  let running = true
  let stopped = false

  const nameById = new Map(episode.agents.map((a: EpisodeAgent) => [a.id, a]))
  nameById.set('user', { id: 'user', name: 'Audience', color: '#ffffff' })
  nameById.set('system', { id: 'system', name: 'System', color: '#888888' })

  const run = async () => {
    const title = episode.sceneState?.title ?? 'Episode Replay'
    const mode = episode.sceneState?.mode ?? 'replay'
    callbacks.onMessage(
      'System',
      `▶️ Replay: "${title}" (${mode}) · ${episode.turns.length} turns · TTS only`,
      '#4ecdc4',
    )

    if (episode.sceneState?.description) {
      callbacks.onMessage('System', episode.sceneState.description, '#888')
    }

    const steps = callbacks.getTtsSteps?.() ?? 10

    for (let i = 0; i < episode.turns.length; i++) {
      if (!running) break
      const turn = episode.turns[i]
      await playTurn(turn, nameById, callbacks, steps)
      if (callbacks.waitUntilFinished) {
        await callbacks.waitUntilFinished()
      }
      // Brief beat between speakers
      if (running && i < episode.turns.length - 1) {
        await sleep(350)
      }
    }

    if (running && !stopped) {
      callbacks.onMessage('System', '🎬 End of replay', '#4ecdc4')
      callbacks.onComplete?.()
    } else if (stopped) {
      callbacks.onMessage('System', '⏹ Replay stopped', '#ff6b6b')
      callbacks.onStop?.()
    }
    running = false
  }

  void run().catch((err) => {
    console.error('[EpisodeReplay] failed:', err)
    callbacks.onMessage('System', 'Replay error — see console', '#ff0000')
    running = false
  })

  return {
    stop: () => {
      stopped = true
      running = false
    },
    isRunning: () => running,
  }
}

async function playTurn(
  turn: EpisodeTurn,
  nameById: Map<string, EpisodeAgent>,
  callbacks: EpisodeReplayCallbacks,
  steps: number,
): Promise<void> {
  const agent = nameById.get(turn.agentId) ?? {
    id: turn.agentId,
    name: turn.agentId,
    color: '#aaaaaa',
  }

  await callbacks.onTurnStart?.(agent.id)

  const speakId = agent.id === 'user' ? 'comedian' : agent.id
  callbacks.onThinking?.(speakId, true)
  await sleep(200)
  callbacks.onThinking?.(speakId, false)
  callbacks.onReactToText?.(speakId, turn.text)
  if (turn.sfx) {
    callbacks.onSfx?.(turn.sfx, speakId)
  }

  const sfxNote = turn.sfx ? ` 🔊${turn.sfx}` : ''
  callbacks.onMessage(agent.name, turn.text + sfxNote, agent.color ?? '#aaaaaa')

  // Skip TTS for pure system / user text if agent is "user" — still optional speak
  if (turn.agentId !== 'system' && turn.text.trim()) {
    // Split into rough sentences for more natural TTS pacing
    const sentences = splitSentences(turn.text)
    for (const sentence of sentences) {
      if (!sentence.trim()) continue
      await callbacks.onSpeak(sentence.trim(), speakId, {
        steps,
      })
    }
  }

  await callbacks.onTurnEnd?.()
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  if (!parts || parts.length === 0) return [text]
  return parts.map((p) => p.trim()).filter(Boolean)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
