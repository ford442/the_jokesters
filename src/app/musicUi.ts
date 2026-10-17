import { getSharedShowMusic } from '../audio/ShowMusic'
import { SHOW_CUES, type ShowCue } from '../audio/showCues'

const CUE_LABELS: Record<ShowCue, string> = {
  cold_open: 'cold open',
  act_break: 'act break',
  tag: 'tag',
  bit_died: 'bit died',
}

/** Wire the show-music toggle, volume and per-cue preview buttons in the settings panel. */
export function wireMusicUi(): void {
  const music = getSharedShowMusic()
  if (!music) {
    console.warn('[musicUi] ShowMusic not ready')
    return
  }

  const enabledEl = document.getElementById('music-enabled') as HTMLInputElement | null
  const volumeEl = document.getElementById('music-volume') as HTMLInputElement | null
  const volumeVal = document.getElementById('music-volume-val')
  const previewRow = document.getElementById('music-preview-row')

  if (enabledEl) {
    enabledEl.checked = music.isEnabled()
    enabledEl.addEventListener('change', () => music.setEnabled(enabledEl.checked))
  }

  if (volumeEl) {
    volumeEl.value = String(Math.round(music.getVolume() * 100))
    if (volumeVal) volumeVal.textContent = `${volumeEl.value}%`
    volumeEl.addEventListener('input', () => {
      music.setVolume(parseInt(volumeEl.value, 10) / 100)
      if (volumeVal) volumeVal.textContent = `${volumeEl.value}%`
    })
  }

  if (previewRow) {
    previewRow.innerHTML = ''
    for (const cue of SHOW_CUES) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sfx-preview-btn'
      btn.textContent = CUE_LABELS[cue]
      btn.title = `Preview the ${CUE_LABELS[cue]} cue (current stage palette)`
      btn.style.cssText =
        'padding:2px 6px;font-size:0.7em;background:#0f3460;border:1px solid #444;border-radius:4px;color:#ccc;cursor:pointer;'
      btn.addEventListener('click', () => music.preview(cue))
      previewRow.appendChild(btn)
    }
  }
}
