import type { Agent } from '../GroupChatManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import { CHARACTER_SPEEDS } from './chatLog'

/** Short, character-flavored lines so a preview is instantly recognizable by ear. */
const PREVIEW_TEXT: Record<string, string> = {
  comedian: "Hi hi hi, I'm the Comedian, keep up!",
  philosopher: 'I... am... the... Philosopher.',
  scientist: 'Hypothesis: I am the Scientist.',
  techBro: "What's up, Chad Vanderblock here, let's disrupt comedy.",
  robot: 'GREETINGS. I AM UNIT SEVEN THREE FOUR.',
}

/** Wire per-agent voice preview buttons in the settings panel (mirrors sfxUi's preview row). */
export function wireVoiceUi(speechQueue: SpeechQueue, agents: Agent[]): void {
  const previewRow = document.getElementById('voice-preview-row')
  if (!previewRow) {
    console.warn('[voiceUi] #voice-preview-row not found')
    return
  }

  previewRow.innerHTML = ''
  for (const agent of agents) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'voice-preview-btn'
    btn.textContent = agent.name
    btn.title = `Preview ${agent.name}'s voice`
    btn.style.cssText =
      'padding:2px 6px;font-size:0.7em;background:#0f3460;border:1px solid #444;border-radius:4px;color:#ccc;cursor:pointer;'
    btn.addEventListener('click', () => {
      const text = PREVIEW_TEXT[agent.id] ?? `This is ${agent.name}.`
      const speed = CHARACTER_SPEEDS[agent.id] ?? 1.0
      speechQueue
        .synthesizeOrTakeCached(text, agent.id, { speed })
        .then((pcm) => speechQueue.add(pcm))
        .catch((e) => console.warn(`[voiceUi] Preview failed for ${agent.id}:`, e))
    })
    previewRow.appendChild(btn)
  }
}
