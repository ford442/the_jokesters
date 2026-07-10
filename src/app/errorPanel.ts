import { GroupChatManager, type ErrorCategory } from '../GroupChatManager'
import { setInputsEnabled } from './loadingUi'

export function renderInitErrorPanel(error: unknown, onRetry: () => void): void {
  const errorCategory: ErrorCategory = GroupChatManager.getErrorCategory(error)
  const rawError = error instanceof Error ? error.message : String(error)

  const isBufferLimit = rawError.toLowerCase().includes('buffer size') &&
                        rawError.toLowerCase().includes('exceeds')

  const errorMessages: Record<ErrorCategory, { title: string; suggestion: string }> = {
    webgpu: {
      title: 'WebGPU Not Supported',
      suggestion: 'Use Chrome 113+ or Edge 113+ with hardware acceleration enabled.',
    },
    oom: {
      title: isBufferLimit ? 'GPU Buffer Limit Too Small' : 'GPU Out of Memory',
      suggestion: isBufferLimit
        ? 'Your GPU only allows very small buffers (likely 256MB). Try enabling hardware acceleration, updating GPU drivers, or using a browser with better WebGPU support.'
        : 'Close other GPU-heavy tabs and reload, or try a lower-VRAM model.',
    },
    network: {
      title: 'Network Error',
      suggestion: 'Check your connection and reload. Models download from storage.1ink.us.',
    },
    unknown: {
      title: 'Initialization Failed',
      suggestion: 'Check the browser console for more details.',
    },
  }

  const { title, suggestion } = errorMessages[errorCategory]

  const errorPanel = document.createElement('div')
  errorPanel.className = 'error-panel'
  errorPanel.innerHTML = `
    <h3>${title}</h3>
    <div class="error-category">Category: ${errorCategory}</div>
    <div class="error-suggestion">${suggestion}</div>
    <div class="error-raw">${rawError}</div>
    <div class="error-buttons">
      <button class="retry-btn">Retry</button>
      <button class="copy-btn">Copy Error</button>
    </div>
  `

  const progressSection = document.getElementById('progress-section')!
  progressSection.style.display = 'none'
  const loadingDiv = document.getElementById('loading')!
  loadingDiv.innerHTML = ''
  loadingDiv.appendChild(errorPanel)

  const retryBtn = errorPanel.querySelector('.retry-btn') as HTMLButtonElement
  retryBtn.addEventListener('click', () => {
    loadingDiv.innerHTML = ''
    const newProgressSection = document.createElement('div')
    newProgressSection.id = 'progress-section'
    newProgressSection.style.display = 'block'
    newProgressSection.innerHTML = `
      <div class="progress-bar">
        <div id="progress" class="progress-fill"></div>
      </div>
      <p id="status">Initializing WebLLM...</p>
    `
    loadingDiv.appendChild(newProgressSection)
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
