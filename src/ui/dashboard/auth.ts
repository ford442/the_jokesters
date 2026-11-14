import { HFStorageManager } from '../../Director/HFStorageManager'
import type { MemoryManager } from '../../Director/MemoryManager'
import type { Scope } from '../../utils/lifecycle'
import { byId } from './dom'

export interface HfAuthFormIds {
  token: string
  repo: string
  save: string
  status: string
  /** Status text on success. */
  successText?: string
}

/** The modal's HF credentials form (index.html, page-lifetime). */
export const MODAL_AUTH_FORM: HfAuthFormIds = {
  token: 'hf-token-input',
  repo: 'hf-repo-input',
  save: 'hf-auth-save-btn',
  status: 'hf-auth-status',
  successText: 'Success! Credentials saved.',
}

/** The settings panel's HF credentials form (inside #app, re-rendered each app run). */
export const MAIN_PANEL_AUTH_FORM: HfAuthFormIds = {
  token: 'hf-token-input-main',
  repo: 'hf-repo-input-main',
  save: 'hf-auth-save-btn-main',
  status: 'hf-auth-status-main',
  successText: 'Success!',
}

/**
 * Wire one "Save & Validate" HF credentials form and prefill it from the current
 * MemoryManager. Returns a `prefill()` to re-run later (e.g. when the modal opens
 * after the MemoryManager exists).
 */
export function wireHfAuthForm(scope: Scope, ids: HfAuthFormIds, getMemoryManager: () => MemoryManager | null): () => void {
  const tokenInput = byId<HTMLInputElement>(ids.token)
  const repoInput = byId<HTMLInputElement>(ids.repo)
  const saveBtn = byId<HTMLButtonElement>(ids.save)
  const status = byId(ids.status)
  if (!tokenInput || !repoInput || !saveBtn || !status) return () => undefined

  const setStatus = (text: string, color: string) => {
    status.textContent = text
    status.style.color = color
  }

  scope.listen(saveBtn, 'click', () => {
    void (async () => {
      const token = tokenInput.value.trim()
      const repo = repoInput.value.trim()
      if (!token || !repo) {
        setStatus('Token and Repo ID required.', '#ff6b6b')
        return
      }
      setStatus('Validating...', '#ffd700')
      saveBtn.disabled = true
      try {
        const isValid = await new HFStorageManager().validateToken(token)
        if (isValid) {
          setStatus(ids.successText ?? 'Success!', '#4ecdc4')
          getMemoryManager()?.setCloudCredentials(token, repo)
        } else {
          setStatus('Invalid Token.', '#ff6b6b')
        }
      } finally {
        saveBtn.disabled = false
      }
    })()
  })

  const prefill = () => {
    const creds = getMemoryManager()?.getCloudCredentials()
    if (creds?.token && !tokenInput.value) tokenInput.value = creds.token
    if (creds?.repoId && !repoInput.value) repoInput.value = creds.repoId
  }
  prefill()
  return prefill
}
