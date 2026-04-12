import { EngineFactory } from '../../src/llm/EngineFactory'
import { MlcEngineAdapter } from '../../src/llm/MlcEngineAdapter'
import { LlamaCppEngineAdapter } from '../../src/llm/LlamaCppEngineAdapter'
import { TransformersEngineAdapter } from '../../src/llm/TransformersEngineAdapter'
import type { LLMEngine } from '../../src/llm/LLMEngine'
import { UNIFIED_MODELS } from '../../src/config/models'

interface TestResult {
  loadTime: number | null
  tokensPerSec: number | null
  output: string
  status: 'idle' | 'loading' | 'generating' | 'complete' | 'error'
  error?: string
}

// Display capabilities on load
function displayCapabilities() {
  const caps = EngineFactory.detectCapabilities()
  const grid = document.getElementById('capability-grid')!
  
  grid.innerHTML = `
    <div class="capability-item ${caps.webgpu ? 'supported' : 'unsupported'}">
      <strong>WebGPU</strong><br>
      ${caps.webgpu ? '✅ Supported' : '❌ Not Supported'}
    </div>
    <div class="capability-item ${caps.wasm ? 'supported' : 'unsupported'}">
      <strong>WebAssembly</strong><br>
      ${caps.wasm ? '✅ Supported' : '❌ Not Supported'}
    </div>
    <div class="capability-item ${caps.simd ? 'supported' : 'unsupported'}">
      <strong>SIMD</strong><br>
      ${caps.simd ? '✅ Supported' : '❌ Not Supported'}
    </div>
    <div class="capability-item ${caps.threads ? 'supported' : 'unsupported'}">
      <strong>Threads</strong><br>
      ${caps.threads ? '✅ Supported' : '❌ Not Supported'}
    </div>
  `
}

displayCapabilities()

function setStatus(engineType: 'mlc' | 'llamacpp' | 'transformers', status: TestResult['status'], message?: string) {
  const statusEl = document.getElementById(`${engineType}-status`)!
  const card = document.getElementById(`${engineType}-result`)!
  
  // Remove status classes
  card.classList.remove('testing', 'active', 'error')
  
  const statusClass = {
    idle: 'status-idle',
    loading: 'status-loading',
    generating: 'status-generating',
    complete: 'status-complete',
    error: 'status-error'
  }[status]
  
  const statusText = message || {
    idle: 'Not tested',
    loading: 'Loading model...',
    generating: 'Generating...',
    complete: '✅ Complete',
    error: '❌ Error'
  }[status]
  
  statusEl.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`
  
  if (status === 'loading' || status === 'generating') {
    card.classList.add('testing')
  } else if (status === 'complete') {
    card.classList.add('active')
  } else if (status === 'error') {
    card.classList.add('error')
  }
}

async function runComparison() {
  const modelId = (document.getElementById('test-model') as HTMLSelectElement).value
  const prompt = (document.getElementById('test-prompt') as HTMLTextAreaElement).value
  const modelConfig = UNIFIED_MODELS.find(m => m.id === modelId)
  
  if (!modelConfig) {
    alert(`Model ${modelId} not found`)
    return
  }
  
  const btn = document.getElementById('run-test-btn') as HTMLButtonElement
  btn.disabled = true
  btn.textContent = 'Running Tests...'
  
  // Reset results
  document.getElementById('mlc-output')!.textContent = ''
  document.getElementById('llamacpp-output')!.textContent = ''
  document.getElementById('mlc-load')!.textContent = '-'
  document.getElementById('llamacpp-load')!.textContent = '-'
  document.getElementById('mlc-speed')!.textContent = '-'
  document.getElementById('llamacpp-speed')!.textContent = '-'
  setStatus('mlc', 'idle')
  setStatus('llamacpp', 'idle')
  document.getElementById('comparison-summary')!.style.display = 'none'
  
  const results: { mlc?: TestResult; transformers?: TestResult; llamacpp?: TestResult } = {}
  
  // Test MLC if available
  if (modelConfig.mlc) {
    results.mlc = await testEngine('mlc', modelConfig, prompt)
  } else {
    setStatus('mlc', 'idle', 'N/A (no MLC config)')
  }
  
  // Test Transformers.js if available
  if (modelConfig.transformers) {
    results.transformers = await testEngine('transformers', modelConfig, prompt)
  } else {
    setStatus('transformers', 'idle', 'N/A (no Transformers.js config)')
  }
  
  // Test llama.cpp if available
  if (modelConfig.llamaCpp) {
    results.llamacpp = await testEngine('llamacpp', modelConfig, prompt)
  } else {
    setStatus('llamacpp', 'idle', 'N/A (no GGUF config)')
  }
  
  // Show comparison summary
  showComparisonSummary(results)
  
  btn.disabled = false
  btn.textContent = 'Run Comparison Test'
}

async function testEngine(
  engineType: 'mlc' | 'llamacpp' | 'transformers',
  modelConfig: any,
  prompt: string
): Promise<TestResult> {
  const startTime = performance.now()
  
  let engine: LLMEngine
  switch (engineType) {
    case 'mlc':
      engine = new MlcEngineAdapter()
      break
    case 'llamacpp':
      engine = new LlamaCppEngineAdapter()
      break
    case 'transformers':
      engine = new TransformersEngineAdapter()
      break
    default:
      throw new Error(`Unknown engine type: ${engineType}`)
  }
  
  const result: TestResult = {
    loadTime: null,
    tokensPerSec: null,
    output: '',
    status: 'idle'
  }
  
  try {
    // Load model
    setStatus(engineType, 'loading')
    await engine.initialize(modelConfig, (report) => {
      const progress = Math.round(report.progress * 100)
      setStatus(engineType, 'loading', `Loading: ${progress}%`)
    })
    
    result.loadTime = (performance.now() - startTime) / 1000
    document.getElementById(`${engineType}-load`)!.textContent = `${result.loadTime.toFixed(2)}s`
    
    // Generate
    setStatus(engineType, 'generating')
    const genStart = performance.now()
    let tokenCount = 0
    
    const stream = await engine.chat(
      [{ role: 'user', content: prompt }],
      { max_tokens: 100, temperature: 0.7 }
    )
    
    const outputEl = document.getElementById(`${engineType}-output`)!
    let output = ''
    
    for await (const chunk of stream) {
      output += chunk
      // Rough token count approximation
      tokenCount += chunk.split(/\s+/).filter((s: string) => s.length > 0).length
      outputEl.textContent = output
      outputEl.scrollTop = outputEl.scrollHeight
    }
    
    const genTime = (performance.now() - genStart) / 1000
    result.tokensPerSec = genTime > 0 ? tokenCount / genTime : 0
    result.output = output
    result.status = 'complete'
    
    document.getElementById(`${engineType}-speed`)!.textContent = `${result.tokensPerSec.toFixed(1)} tok/s`
    setStatus(engineType, 'complete')
    
    await engine.terminate()
    
  } catch (error: any) {
    result.status = 'error'
    result.error = error.message
    setStatus(engineType, 'error', error.message.substring(0, 50))
    document.getElementById(`${engineType}-output`)!.textContent = `Error: ${error.message}`
    console.error(`${engineType} test failed:`, error)
  }
  
  return result
}

function showComparisonSummary(results: { mlc?: TestResult; transformers?: TestResult; llamacpp?: TestResult }) {
  const summaryEl = document.getElementById('comparison-summary')!
  const contentEl = document.getElementById('summary-content')!
  
  let html = ''
  
  // Collect all successful results for comparison
  const successfulEngines: Array<{ name: string; loadTime: number; tokensPerSec: number; result: TestResult }> = []
  if (results.mlc?.status === 'complete' && results.mlc.loadTime && results.mlc.tokensPerSec) {
    successfulEngines.push({ name: 'MLC WebLLM', loadTime: results.mlc.loadTime, tokensPerSec: results.mlc.tokensPerSec, result: results.mlc })
  }
  if (results.transformers?.status === 'complete' && results.transformers.loadTime && results.transformers.tokensPerSec) {
    successfulEngines.push({ name: 'Transformers.js', loadTime: results.transformers.loadTime, tokensPerSec: results.transformers.tokensPerSec, result: results.transformers })
  }
  if (results.llamacpp?.status === 'complete' && results.llamacpp.loadTime && results.llamacpp.tokensPerSec) {
    successfulEngines.push({ name: 'llama.cpp', loadTime: results.llamacpp.loadTime, tokensPerSec: results.llamacpp.tokensPerSec, result: results.llamacpp })
  }
  
  // Compare load times (if 2+ engines succeeded)
  if (successfulEngines.length >= 2) {
    const fastestLoad = successfulEngines.reduce((a, b) => a.loadTime < b.loadTime ? a : b)
    const slowestLoad = successfulEngines.reduce((a, b) => a.loadTime > b.loadTime ? a : b)
    const loadDiff = (slowestLoad.loadTime - fastestLoad.loadTime).toFixed(2)
    html += `<p><span class="winner-badge">${fastestLoad.name}</span> loaded ${loadDiff}s faster than ${slowestLoad.name}</p>`
  }
  
  // Compare generation speed (if 2+ engines succeeded)
  if (successfulEngines.length >= 2) {
    const fastestGen = successfulEngines.reduce((a, b) => a.tokensPerSec > b.tokensPerSec ? a : b)
    const slowestGen = successfulEngines.reduce((a, b) => a.tokensPerSec < b.tokensPerSec ? a : b)
    const speedDiff = (fastestGen.tokensPerSec - slowestGen.tokensPerSec).toFixed(1)
    html += `<p><span class="winner-badge">${fastestGen.name}</span> generated ${speedDiff} tok/s faster than ${slowestGen.name} (${fastestGen.tokensPerSec.toFixed(1)} vs ${slowestGen.tokensPerSec.toFixed(1)} tok/s)</p>`
  }
  
  // Show which engines had errors
  if (results.mlc?.status === 'error') {
    html += `<p>❌ MLC WebLLM failed: ${results.mlc.error?.substring(0, 100)}...</p>`
  }
  if (results.transformers?.status === 'error') {
    html += `<p>❌ Transformers.js failed: ${results.transformers.error?.substring(0, 100)}...</p>`
  }
  if (results.llamacpp?.status === 'error') {
    html += `<p>❌ llama.cpp failed: ${results.llamacpp.error?.substring(0, 100)}...</p>`
  }
  
  // Recommendation
  if (successfulEngines.length >= 2) {
    const caps = EngineFactory.detectCapabilities()
    const fastest = successfulEngines.reduce((a, b) => a.tokensPerSec > b.tokensPerSec ? a : b)
    if (caps.webgpu && fastest.name === 'MLC WebLLM') {
      html += `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;"><strong>💡 Recommendation:</strong> Use MLC WebLLM for best performance on this device.</p>`
    } else if (caps.webgpu && fastest.name === 'Transformers.js') {
      html += `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;"><strong>💡 Recommendation:</strong> Use Transformers.js for access to HuggingFace Hub models with good performance.</p>`
    } else {
      html += `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;"><strong>💡 Recommendation:</strong> Use llama.cpp for best compatibility on this device.</p>`
    }
  } else if (successfulEngines.length === 1) {
    html += `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;"><strong>💡 Recommendation:</strong> Only ${successfulEngines[0].name} worked on this device. Use that engine.</p>`
  }
  
  contentEl.innerHTML = html
  summaryEl.style.display = 'block'
}

// Expose to window for button
;(window as any).runComparison = runComparison
