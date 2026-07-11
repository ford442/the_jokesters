import { GroupChatManager, type ErrorCategory } from '../GroupChatManager'
import { setInputsEnabled } from './loadingUi'
import {
  getSmallerFallbackFor,
  queueOomFallback,
  loadLastSuccessfulLaunch,
} from './modelGuide'

export function renderInitErrorPanel(error: unknown, onRetry: () => void): void {
  const errorCategory: ErrorCategory = GroupChatManager.getErrorCategory(error)
  const rawError = error instanceof Error ? error.message : String(error)

  const isBufferLimit =
    rawError.toLowerCase().includes('buffer size') && rawError.toLowerCase().includes('exceeds')

  const errorMessages: Record<ErrorCategory, { title: string; suggestion: string }> = {
    webgpu: {
      title: 'WebGPU Not Supported',
      suggestion: 'Use Chrome 113+ or Edge 113+ with hardware acceleration enabled — or pick the CPU (llama.cpp) preset.',
    },
    oom: {
      title: isBufferLimit ? 'GPU Buffer Limit Too Small' : 'GPU Out of Memory',
      suggestion: isBufferLimit
        ? 'Your GPU only allows very small buffers. Try the ultra-low or CPU preset below.'
        : 'Close other GPU-heavy tabs, or jump to a smaller recommended model.',
    },
    network: {
      title: 'Network Error',
      suggestion: 'Check your connection and reload. Models download from storage.1ink.us.',
    },
    llamacpp_mismatch: {
      title: 'llama.cpp Runtime Mismatch',
      suggestion:
        'The llama.cpp WASM runtime does not match the app bundle. Reload the page, or switch to MLC (WebGPU) in the engine selector.',
    },
    unknown: {
      title: 'Initialization Failed',
      suggestion: 'Check the browser console for more details.',
    },
  }

  const { title, suggestion } = errorMessages[errorCategory]

  // Resolve a smaller blessed model for OOM recovery
  const last = loadLastSuccessfulLaunch()
  const failedId =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jokesters-last-attempt-model')) ||
    last?.selectedModelId ||
    'vicuna-7b-q4f32-webllm-vps'
  const smaller = getSmallerFallbackFor(failedId)

  const errorPanel = document.createElement('div')
  errorPanel.className = 'error-panel'
  errorPanel.innerHTML = `
    <h3>${title}</h3>
    <div class="error-category">Category: ${errorCategory}</div>
    <div class="error-suggestion">${suggestion}</div>
    <div class="error-raw">${escapeHtml(rawError)}</div>
    <div class="error-buttons">
      <button class="retry-btn">Retry</button>
      ${
        errorCategory === 'oom' || errorCategory === 'webgpu'
          ? `<button class="smaller-model-btn" type="button">Try ${escapeHtml(smaller.shortName)}</button>`
          : ''
      }
      <button class="copy-btn">Copy Error</button>
    </div>
  `

  const progressSection = document.getElementById('progress-section')
  if (progressSection) progressSection.style.display = 'none'
  const loadingDiv = document.getElementById('loading')!
  loadingDiv.innerHTML = ''
  loadingDiv.appendChild(errorPanel)

  const retryBtn = errorPanel.querySelector('.retry-btn') as HTMLButtonElement
  retryBtn.addEventListener('click', () => {
    resetLoadingShell(loadingDiv)
    onRetry()
  })

  const smallerBtn = errorPanel.querySelector('.smaller-model-btn') as HTMLButtonElement | null
  smallerBtn?.addEventListener('click', () => {
    queueOomFallback(smaller.id, smaller.engine)
    resetLoadingShell(loadingDiv)
    onRetry()
  })

  const copyBtn = errorPanel.querySelector('.copy-btn') as HTMLButtonElement
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(rawError)
      copyBtn.textContent = 'Copied!'
      setTimeout(() => {
        copyBtn.textContent = 'Copy Error'
      }, 2000)
    } catch {
      console.warn('Could not copy to clipboard')
    }
  })

  setInputsEnabled(false)
}

function resetLoadingShell(loadingDiv: HTMLElement): void {
  loadingDiv.innerHTML = ''
  const newProgressSection = document.createElement('div')
  newProgressSection.id = 'progress-section'
  newProgressSection.style.display = 'block'
  newProgressSection.innerHTML = `
      <div class="progress-bar">
        <div id="progress" class="progress-fill"></div>
      </div>
      <p id="status">Initializing…</p>
    `
  loadingDiv.appendChild(newProgressSection)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
