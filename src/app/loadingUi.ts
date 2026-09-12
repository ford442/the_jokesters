export function setProgress(status: string, percentage: number): void {
  const progressBar = document.getElementById('progress') as HTMLDivElement
  const statusText = document.getElementById('status')!
  if (progressBar) progressBar.style.width = `${percentage}%`
  if (statusText) statusText.textContent = status
}

/** Non-fatal notice shown when TTS init fails on all storage hosts — the show still boots (text + stage), just silently. */
export function showVoiceOfflineBanner(): void {
  showChatBanner(
    'voice-offline-banner',
    '🔇',
    'Voice offline — text-to-speech could not connect. The show continues without narration.',
    '#4a1a1a',
    '#ffb3b3',
    '#ff6b6b',
  )
}

/** Custom ctx WASM was missing; generic 4K lib is in use (higher peak VRAM). */
export function showWasmFallbackBanner(message: string): void {
  showChatBanner(
    'wasm-fallback-banner',
    '⚠️',
    message,
    '#3d3416',
    '#ffe9a8',
    '#e6c15a',
  )
}

function showChatBanner(
  id: string,
  icon: string,
  message: string,
  background: string,
  color: string,
  border: string,
): void {
  const chatContainer = document.getElementById('chat-container')
  if (!chatContainer || document.getElementById(id)) return

  const banner = document.createElement('div')
  banner.id = id
  banner.setAttribute('role', 'status')
  banner.style.cssText =
    `background:${background};color:${color};border:1px solid ${border};border-radius:6px;` +
    'padding:8px 12px;margin-bottom:10px;font-size:0.85em;display:flex;align-items:center;gap:8px;'
  banner.innerHTML = `<span>${icon}</span><span>${message}</span>`
  chatContainer.insertBefore(banner, chatContainer.firstChild)
}

export function setInputsEnabled(enabled: boolean): void {
  const ids = [
    'user-input', 'send-btn', 'start-improv-btn', 'stop-improv-btn',
    'scene-title', 'scene-description', 'tts-steps', 'director-chaos',
    'global-seed', 'profanity-level', 'chat-mode-btn', 'improv-mode-btn',
  ]
  ids.forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement | null
    if (el) {
      el.disabled = !enabled
      if (enabled) {
        el.style.opacity = '1'
        el.style.pointerEvents = 'auto'
      } else {
        el.style.opacity = '0.5'
        el.style.pointerEvents = 'none'
      }
    }
  })
}
