export function setProgress(status: string, percentage: number): void {
  const progressBar = document.getElementById('progress') as HTMLDivElement
  const statusText = document.getElementById('status')!
  if (progressBar) progressBar.style.width = `${percentage}%`
  if (statusText) statusText.textContent = status
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
