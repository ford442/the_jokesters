export function setProgress(status: string, percentage: number): void {
  const progressBar = document.getElementById('progress') as HTMLDivElement
  const statusText = document.getElementById('status')!
  if (progressBar) progressBar.style.width = `${percentage}%`
  if (statusText) statusText.textContent = status
}

/** Non-fatal notice shown when TTS init fails on all storage hosts — the show still boots (text + stage), just silently. */
export function showVoiceOfflineBanner(): void {
  const chatContainer = document.getElementById('chat-container')
  if (!chatContainer || document.getElementById('voice-offline-banner')) return

  const banner = document.createElement('div')
  banner.id = 'voice-offline-banner'
  banner.setAttribute('role', 'status')
  banner.style.cssText =
    'background:#4a1a1a;color:#ffb3b3;border:1px solid #ff6b6b;border-radius:6px;' +
    'padding:8px 12px;margin-bottom:10px;font-size:0.85em;display:flex;align-items:center;gap:8px;'
  banner.innerHTML =
    '<span>🔇</span><span>Voice offline — text-to-speech could not connect. The show continues without narration.</span>'
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
