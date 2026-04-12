import { EngineFactory } from '../../src/llm/EngineFactory'
import { MlcEngineAdapter } from '../../src/llm/MlcEngineAdapter'
import { LlamaCppEngineAdapter } from '../../src/llm/LlamaCppEngineAdapter'
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

function setStatus(engineType: 'mlc' | 'llamacpp', status: TestResult['status'], message?: string) {
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
  
  const results: { mlc?: TestResult; llamacpp?: TestResult } = {}
  
  // Test MLC if available
  if (modelConfig.mlc) {
    results.mlc = await testEngine('mlc', modelConfig, prompt)
  } else {
    setStatus('mlc', 'idle', 'N/A (no MLC config)')
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
  engineType: 'mlc' | 'llamacpp',
  modelConfig: any,
  prompt: string
): Promise<TestResult> {
  const startTime = performance.now()
  const engine = engineType === 'mlc' ? new MlcEngineAdapter() : new LlamaCppEngineAdapter()
  
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

function showComparisonSummary(results: { mlc?: TestResult; llamacpp?: TestResult }) {
  const summaryEl = document.getElementById('comparison-summary')!
  const contentEl = document.getElementById('summary-content')!
  
  let html = ''
  
  // Compare load times
  if (results.mlc?.loadTime && results.llamacpp?.loadTime) {
    const faster = results.mlc.loadTime < results.llamacpp.loadTime ? 'MLC WebLLM' : 'llama.cpp'
    const diff = Math.abs(results.mlc.loadTime - results.llamacpp.loadTime).toFixed(2)
    html += `<p><span class="winner-badge">${faster}</span> loaded ${diff}s faster</p>`
  }
  
  // Compare generation speed
  if (results.mlc?.tokensPerSec && results.llamacpp?.tokensPerSec) {
    const faster = results.mlc.tokensPerSec > results.llamacpp.tokensPerSec ? 'MLC WebLLM' : 'llama.cpp'
    const mlcSpeed = results.mlc.tokensPerSec.toFixed(1)
    const llamaSpeed = results.llamacpp.tokensPerSec.toFixed(1)
    const ratio = (Math.max(results.mlc.tokensPerSec, results.llamacpp.tokensPerSec) / 
                   Math.min(results.mlc.tokensPerSec, results.llamacpp.tokensPerSec)).toFixed(1)
    html += `<p><span class="winner-badge">${faster}</span> generated ${ratio}x faster (${mlcSpeed} vs ${llamaSpeed} tok/s)</p>`
  }
  
  // Show which engines had errors
  if (results.mlc?.status === 'error') {
    html += `<p>❌ MLC WebLLM failed: ${results.mlc.error?.substring(0, 100)}...</p>`
  }
  if (results.llamacpp?.status === 'error') {
    html += `<p>❌ llama.cpp failed: ${results.llamacpp.error?.substring(0, 100)}...</p>`
  }
  
  // Recommendation
  if (results.mlc?.status === 'complete' && results.llamacpp?.status === 'complete') {
    const caps = EngineFactory.detectCapabilities()
    if (caps.webgpu && results.mlc.tokensPerSec && results.mlc.tokensPerSec > (results.llamacpp.tokensPerSec || 0)) {
      html += `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;"><strong>💡 Recommendation:</strong> Use MLC WebLLM for best performance on this device.</p>`
    } else {
      html += `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;"><strong>💡 Recommendation:</strong> Use llama.cpp for best compatibility on this device.</p>`
    }
  }
  
  contentEl.innerHTML = html
  summaryEl.style.display = 'block'
}

// Expose to window for button
;(window as any).runComparison = runComparison
