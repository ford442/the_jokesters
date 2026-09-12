import { GroupChatManager, type ErrorCategory } from '../GroupChatManager'
import { setInputsEnabled } from './loadingUi'
import {
  getSmallerFallbackFor,
  queueOomFallback,
  loadLastSuccessfulLaunch,
  recordOomFailure,
} from './modelGuide'
import { selectErrorPanelActions, type ErrorPanelAction } from './errorPanelActions'
import { clearModelWeightCaches } from './modelCache'
import { queuePreferMirror } from '../utils/dualDomainStripe'
import { queueForceHfSource, isVicunaFamilyModelId } from '../config/loadFailover'

export function renderInitErrorPanel(error: unknown, onRetry: () => void): void {
  const errorCategory: ErrorCategory = GroupChatManager.getErrorCategory(error)
  const rawError = error instanceof Error ? error.message : String(error)

  const isBufferLimit =
    rawError.toLowerCase().includes('buffer size') && rawError.toLowerCase().includes('exceeds')

  const last = loadLastSuccessfulLaunch()
  const failedId =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jokesters-last-attempt-model')) ||
    last?.selectedModelId ||
    'vicuna-7b-q4f32-webllm-vps'

  const plan = selectErrorPanelActions({ category: errorCategory, modelId: failedId })
  const smaller = getSmallerFallbackFor(failedId)

  if (errorCategory === 'oom') {
    recordOomFailure(failedId)
  }

  const errorMessages: Record<ErrorCategory, { title: string; suggestion: string }> = {
    webgpu: {
      title: 'WebGPU Not Supported',
      suggestion: 'Use Chrome 113+ or Edge 113+ with hardware acceleration enabled — or pick the CPU (llama.cpp) preset.',
    },
    oom: {
      title: isBufferLimit ? 'GPU Buffer Limit Too Small' : 'GPU Out of Memory',
      suggestion: isBufferLimit
        ? `Your GPU only allows very small buffers. Try ${smaller.shortName} below.`
        : `Close other GPU-heavy tabs, or jump to ${smaller.shortName}.`,
    },
    llamacpp_mismatch: {
      title: 'llama.cpp Runtime Mismatch',
      suggestion:
        'The llama.cpp WASM runtime does not match the app bundle. Reload the page, or switch to MLC (WebGPU) in the engine selector.',
    },
    network: {
      title: 'Download Failed',
      suggestion: isVicunaFamilyModelId(failedId)
        ? `Weights could not be fetched. Retry the Contabo mirror, Hugging Face, or switch to ${smaller.shortName}. This is not a GPU memory problem.`
        : `Weights could not be fetched from storage. Check the connection, clear the model cache, or try ${smaller.shortName}.`,
    },
    config: {
      title: 'Model Config Incomplete',
      suggestion: isVicunaFamilyModelId(failedId)
        ? `Tokenizer or mlc-chat-config.json was missing. Retry Hugging Face, or switch to ${smaller.shortName}.`
        : `Tokenizer or mlc-chat-config.json was missing or invalid. Clear the model cache or try ${smaller.shortName}.`,
    },
    wasm_missing: {
      title: 'Model WASM Missing',
      suggestion: isVicunaFamilyModelId(failedId)
        ? `The custom Vicuna WebGPU library was not on the VPS. Retry Hugging Face, or switch to ${smaller.shortName}.`
        : `The WebGPU model library was missing. Clear the cache or try ${smaller.shortName}.`,
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
    <div class="error-raw">${escapeHtml(rawError)}</div>
    <div class="error-buttons">
      ${plan.actions.map((action) => actionButtonHtml(action, plan.smallerShortName)).join('\n      ')}
      <button class="copy-btn" type="button">Copy Error</button>
    </div>
  `

  const progressSection = document.getElementById('progress-section')
  if (progressSection) progressSection.style.display = 'none'
  const loadingDiv = document.getElementById('loading')!
  loadingDiv.innerHTML = ''
  loadingDiv.appendChild(errorPanel)

  const retryBtn = errorPanel.querySelector('.retry-btn') as HTMLButtonElement | null
  retryBtn?.addEventListener('click', () => {
    resetLoadingShell(loadingDiv)
    onRetry()
  })

  const smallerBtn = errorPanel.querySelector('.smaller-model-btn') as HTMLButtonElement | null
  smallerBtn?.addEventListener('click', () => {
    queueOomFallback(plan.smallerPresetId, smaller.engine)
    resetLoadingShell(loadingDiv)
    onRetry()
  })

  const hfBtn = errorPanel.querySelector('.retry-hf-btn') as HTMLButtonElement | null
  hfBtn?.addEventListener('click', () => {
    queueForceHfSource()
    resetLoadingShell(loadingDiv)
    onRetry()
  })

  const mirrorBtn = errorPanel.querySelector('.retry-mirror-btn') as HTMLButtonElement | null
  mirrorBtn?.addEventListener('click', () => {
    queuePreferMirror()
    resetLoadingShell(loadingDiv)
    onRetry()
  })

  const clearBtn = errorPanel.querySelector('.clear-cache-btn') as HTMLButtonElement | null
  clearBtn?.addEventListener('click', () => {
    void (async () => {
      clearBtn.disabled = true
      clearBtn.textContent = 'Clearing cache…'
      try {
        await clearModelWeightCaches()
      } catch (cacheError) {
        console.warn('[ErrorPanel] Cache clear failed:', cacheError)
      }
      resetLoadingShell(loadingDiv)
      onRetry()
    })()
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

function actionButtonHtml(action: ErrorPanelAction, smallerShortName: string): string {
  switch (action) {
    case 'retry':
      return '<button class="retry-btn" type="button">Retry</button>'
    case 'try_smaller':
      return `<button class="smaller-model-btn" type="button">Try ${escapeHtml(smallerShortName)}</button>`
    case 'clear_cache':
      return '<button class="clear-cache-btn" type="button">Clear model cache</button>'
    case 'retry_hf':
      return '<button class="retry-hf-btn" type="button">Retry from Hugging Face</button>'
    case 'retry_mirror':
      return '<button class="retry-mirror-btn" type="button">Retry mirror</button>'
  }
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
