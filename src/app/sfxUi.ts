import { getSharedSfxManager } from '../audio/SfxManager'
import type { SfxPlaybackMode } from '../audio/sfxCatalog'
import { ALLOWED_SFX } from '../audio/sfxCatalog'

/** Wire SFX toggle, volume, mode, and preview buttons in the settings panel. */
export function wireSfxUi(): void {
  const sfx = getSharedSfxManager()
  if (!sfx) {
    console.warn('[sfxUi] SfxManager not ready')
    return
  }

  const enabledEl = document.getElementById('sfx-enabled') as HTMLInputElement | null
  const volumeEl = document.getElementById('sfx-volume') as HTMLInputElement | null
  const volumeVal = document.getElementById('sfx-volume-val')
  const modeEl = document.getElementById('sfx-mode') as HTMLSelectElement | null
  const previewRow = document.getElementById('sfx-preview-row')

  if (enabledEl) {
    enabledEl.checked = sfx.isEnabled()
    enabledEl.addEventListener('change', () => {
      sfx.setEnabled(enabledEl.checked)
    })
  }

  if (volumeEl) {
    volumeEl.value = String(Math.round(sfx.getVolume() * 100))
    if (volumeVal) volumeVal.textContent = `${volumeEl.value}%`
    volumeEl.addEventListener('input', () => {
      const v = parseInt(volumeEl.value, 10) / 100
      sfx.setVolume(v)
      if (volumeVal) volumeVal.textContent = `${volumeEl.value}%`
    })
  }

  if (modeEl) {
    modeEl.value = sfx.getMode()
    modeEl.addEventListener('change', () => {
      sfx.setMode(modeEl.value as SfxPlaybackMode)
    })
  }

  if (previewRow) {
    previewRow.innerHTML = ''
    // Preview core pack only (compact UI)
    const core = ['laugh', 'applause', 'rimshot', 'boo', 'gasp', 'whoosh', 'explosion'] as const
    for (const name of core) {
      if (!ALLOWED_SFX.includes(name as (typeof ALLOWED_SFX)[number])) continue
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sfx-preview-btn'
      btn.textContent = name
      btn.title = `Preview ${name}`
      btn.style.cssText =
        'padding:2px 6px;font-size:0.7em;background:#0f3460;border:1px solid #444;border-radius:4px;color:#ccc;cursor:pointer;'
      btn.addEventListener('click', () => {
        void sfx.play(name)
      })
      previewRow.appendChild(btn)
    }
  }
}
