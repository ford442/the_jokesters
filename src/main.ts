import './style.css'
import { GroupChatManager, type ErrorCategory } from './GroupChatManager'
import type { Agent, ProfanityLevel } from './GroupChatManager'
import type { VRAMOptimizationConfig } from './utils/dynamicContext'
import { ImprovSceneManager } from './ImprovSceneManager'
import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
// import { SceneManager } from './SceneManager'
import * as webllm from '@mlc-ai/web-llm'

import { AudioEngine } from './audio/AudioEngine'
import { SpeechQueue } from './audio/SpeechQueue'
import { DEFAULT_IMPROV_SETUPS } from './config/improvSetups'
import { EngineFactory, type EngineType } from './llm/EngineFactory'

// Log available models on startup
console.log('Available prebuilt models:', webllm.prebuiltAppConfig.model_list.map((m: any) => m.model_id))

// Define our agents with different personalities and sampling parameters
// --- CASUAL & FUNNY AGENTS ---
const agents: Agent[] = [
  {
    id: 'comedian',
    name: 'The Comedian',
    // Added instruction: End your response with "###"
    // Female + Fast + Farcical
    systemPrompt:
      'You are a frantic, high-energy female comedian who talks incredibly fast. You are aware that you ramble at high speed and play on it comically. You mix highbrow references with lowbrow physical humor. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.85,
    top_p: 0.93,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    // Added instruction: End your response with "###"
    // Slow + Pretentious
    systemPrompt:
      'You are a cynical philosopher who speaks very slowly. You judge the comedian for her speed. You are highbrow but petty. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.70,
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    // Added instruction: End your response with "###"
    // The "Literalist"
    systemPrompt:
      'You are a scientist who treats every joke as a hypothesis. You analyze crass jokes with mathematical precision. DO NOT use your name. End your response with "###"',
    temperature: 0.5,
    top_p: 0.85,
    color: '#45b7d1',
  },
]

// Initialize the app
async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  // Register service worker for parallel model downloads (optional optimization)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js')
      console.log('[ServiceWorker] Registered for parallel downloads:', registration)
    } catch (error) {
      console.warn('[ServiceWorker] Registration failed (non-critical):', error)
      // Service worker is optional - continue without it
    }
  }

  // Configuration constants for prerendering
  const PRERENDER_INITIAL_TURNS = 3  // Number of turns to prerender at scene start
  const PRERENDER_MIN_QUEUE = 2      // Minimum queue size before triggering background prerender
  const PRERENDER_BATCH_SIZE = 2     // Number of turns to generate in background
  const MAX_PRERENDER_SENTENCES = 3  // Maximum sentences to prerender for audio

  // App initialization state machine
  type AppInitState = 'BOOTING' | 'AUDIO' | 'MODEL' | 'FINALIZING' | 'READY' | 'ERROR'
  let currentInitState: AppInitState = 'BOOTING'
  // @ts-ignore
  console.log(currentInitState);

  // Helper to set progress with weighted stages
  const setProgress = (status: string, percentage: number) => {
    const progressBar = document.getElementById('progress') as HTMLDivElement
    const statusText = document.getElementById('status')!
    if (progressBar) progressBar.style.width = `${percentage}%`
    if (statusText) statusText.textContent = status
  }

  // Helper to enable/disable all interactive inputs
  const setInputsEnabled = (enabled: boolean) => {
    const ids = [
      'user-input', 'send-btn', 'start-improv-btn', 'stop-improv-btn',
      'scene-title', 'scene-description', 'tts-steps', 'director-chaos',
      'global-seed', 'profanity-level', 'chat-mode-btn', 'improv-mode-btn'
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

  app.innerHTML = `
    <div class="container">
      <h1>The Jokesters</h1>
      <p class="subtitle">Multi-Agent Chat powered by Llama-3 & WebGPU</p>
      <div id="loading" class="loading">
        <!-- Model picker (shown before loading starts) -->
        <div id="model-picker" style="width:100%;max-width:480px;margin:0 auto;">
          <h3 style="color:#4ecdc4;margin:0 0 6px;font-size:1.1em;">Choose Your AI Model</h3>
          <p style="color:#aaa;font-size:0.82em;margin:0 0 12px;">All models run locally in your browser via WebGPU. Weights are cached after the first download.</p>
          <!-- Engine selector -->
          <select id="engine-select" style="width:100%;padding:9px 10px;border-radius:6px;border:1px solid #444;background:#0f3460;color:white;font-size:0.9em;margin-bottom:8px;">
            <option value="auto">🤖 Auto (WebGPU preferred)</option>
            <option value="mlc">⚡ MLC WebLLM (WebGPU)</option>
            <option value="llamacpp">🧠 llama.cpp (WASM/CPU)</option>
          </select>

          <!-- Engine capability indicator -->
          <div id="engine-capabilities" style="color:#888;font-size:0.78em;margin-bottom:12px;"></div>

          <select id="model-select-launch" style="width:100%;padding:9px 10px;border-radius:6px;border:1px solid #444;background:#0f3460;color:white;font-size:0.9em;margin-bottom:8px;">
            <option value="Hermes-3-Llama-3.2-3B-q4f16_1-MLC">Hermes-3 3B · Fast · ~2 GB VRAM ★ Recommended</option>
            <option value="Llama-3.2-3B-Instruct-q4f16_1-MLC">Llama-3.2 3B · Fast · ~2.5 GB VRAM</option>
            <option value="Hermes-3-Llama-3.2-3B-q4f32_1-MLC">Hermes-3 3B q4f32 · All GPUs · ~2 GB VRAM (no f16 needed)</option>
            <option value="Llama-3.2-3B-Instruct-q4f32_1-MLC">Llama-3.2 3B q4f32 · All GPUs · ~2.5 GB VRAM (no f16 needed)</option>
            <option value="Llama-2-7b-chat-hf-q4f32_1-MLC">Llama-2 7B q4f32 · All GPUs · ~4 GB VRAM (no f16 needed)</option>
            <option value="ford442/vicuna-7b-q4f32-webllm">Vicuna 7B q4f32 · All GPUs · ~4 GB VRAM (Llama-2 / Vicuna tuned)</option>
            <option value="Hermes-3-Llama-3.1-8B-q4f16_1-MLC">Hermes-3 8B · High quality · ~5.2 GB VRAM (needs f16 GPU)</option>
            <option value="Llama-3.1-8B-Instruct-q4f16_1-MLC">Llama-3.1 8B · High quality · ~5.2 GB VRAM (needs f16 GPU)</option>
          </select>
          <select id="context-size-select" style="width:100%;padding:9px 10px;border-radius:6px;border:1px solid #444;background:#0f3460;color:white;font-size:0.9em;margin-bottom:8px;">
            <option value="auto">Auto (detect VRAM)</option>
            <option value="4096">4096 tokens (full)</option>
            <option value="2048">2048 tokens</option>
            <option value="1024">1024 tokens</option>
            <option value="512">512 tokens</option>
            <option value="256">256 tokens</option>
            <option value="128">128 tokens (minimal VRAM)</option>
          </select>
          <p id="model-launch-hint" style="color:#888;font-size:0.78em;min-height:2em;margin:0 0 12px;"></p>

          <!-- Advanced VRAM Settings (hidden by default) -->
          <details id="advanced-vram-settings" class="vram-settings-panel">
            <summary>⚙️ Advanced VRAM Settings</summary>
            <div class="vram-settings-content">
              <div class="vram-setting-row">
                <label>Max Tokens Per Turn</label>
                <input type="range" id="max-tokens-slider" min="16" max="512" value="96" step="8">
                <span id="max-tokens-val" class="vram-setting-value">96</span>
              </div>
              <div class="vram-setting-row">
                <label>Prefill Chunk Size</label>
                <select id="prefill-chunk-select">
                  <option value="0">Auto</option>
                  <option value="128">128</option>
                  <option value="256">256</option>
                  <option value="512">512</option>
                  <option value="1024" selected>1024</option>
                </select>
              </div>
              <div class="vram-setting-row">
                <label>KV Cache Quantization</label>
                <select id="kv-cache-select">
                  <option value="auto" selected>Auto (enable for 7B/8B)</option>
                  <option value="int8">INT8</option>
                  <option value="fp8">FP8</option>
                  <option value="none">Disabled</option>
                </select>
              </div>
              <div class="vram-setting-row">
                <label>Sliding Window Attention</label>
                <select id="sliding-window-select">
                  <option value="0" selected>Disabled (use full context)</option>
                  <option value="-1">Auto (half of context)</option>
                  <option value="512">512 tokens</option>
                  <option value="1024">1024 tokens</option>
                  <option value="2048">2048 tokens</option>
                </select>
              </div>
              <div class="vram-setting-row">
                <label>Attention Sink Tokens</label>
                <input type="range" id="attention-sink-slider" min="0" max="16" value="4" step="1">
                <span id="attention-sink-val" class="vram-setting-value">4</span>
              </div>
              <div class="vram-setting-row">
                <label>GPU Memory Utilization</label>
                <input type="range" id="gpu-mem-slider" min="50" max="95" value="85" step="5">
                <span id="gpu-mem-val" class="vram-setting-value">85%</span>
              </div>
              <p class="vram-settings-note">
                <strong>Sliding Window:</strong> Reduces VRAM by only keeping recent tokens in attention. 
                "Auto" uses half your context window. Attention sinks keep first N tokens for coherence.
              </p>
            </div>
          </details>

          <button id="launch-btn" style="width:100%;padding:11px;background:#4ecdc4;color:#0a0a1a;font-weight:bold;font-size:1em;border:none;border-radius:6px;cursor:pointer;">Load Model &amp; Start</button>
        </div>
        <!-- Progress bar (hidden until launch) -->
        <div id="progress-section" style="display:none;width:100%;">
          <div class="progress-bar">
            <div id="progress" class="progress-fill"></div>
          </div>
          <p id="status">Initializing WebLLM...</p>
        </div>
      </div>
      <div id="chat-container" class="chat-container" style="display: none;">
        <canvas id="scene"></canvas>
        <div class="controls">
          <div class="settings-panel" style="margin-bottom: 15px; padding: 10px; background: #1a1a2e; border-radius: 8px;">
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
              <label style="color: #888; font-size: 0.8em;">TTS Quality (Steps)</label>
              <input type="range" id="tts-steps" min="1" max="30" value="10" style="flex: 1;">
              <span id="tts-steps-val" style="color: #4ecdc4; font-size: 0.8em; width: 20px;">10</span>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
              <label style="color: #888; font-size: 0.8em;">Director Chaos</label>
              <input type="range" id="director-chaos" min="0" max="100" value="30" style="flex: 1;">
              <span id="director-chaos-val" style="color: #ff6b6b; font-size: 0.8em; width: 20px;">30%</span>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
              <label style="color: #888; font-size: 0.8em;">Seed (Optional)</label>
              <input type="number" id="global-seed" placeholder="Random" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px;">
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
              <label style="color: #888; font-size: 0.8em;">Language</label>
              <input type="range" id="profanity-level" min="0" max="3" value="2" style="flex: 1;">
              <span id="profanity-val" style="color: #ffd700; font-size: 0.9em; width: 80px;">🔥 Gritty</span>
            </div>

            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px; border-top: 1px solid #444; padding-top: 10px;">
              <label style="color: #888; font-size: 0.8em;">Profile</label>
              <input type="text" id="user-profile-input" value="default" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px; font-size: 0.8em; border-radius: 4px;">
              <button id="switch-profile-btn" style="background: #4ecdc4; color: #0a0a1a; border: none; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; cursor: pointer;">Switch</button>
            </div>
          </div>

          <!-- VRAM / Context Info Bar -->
          <div id="vram-info-bar" class="vram-info-bar">
            <span id="ctx-info-text">Context: —</span>
            <span id="token-budget-text">Max tokens: 96</span>
            <span id="vram-kv-text"></span>
          </div>

          <div class="mode-selector">
            <button id="chat-mode-btn" class="mode-btn active">Chat Mode</button>
            <button id="improv-mode-btn" class="mode-btn">Improv Mode</button>
          </div>
          <div id="chat-log" class="chat-log"></div>
          
          <!-- Chat Mode Controls -->
          <div id="chat-mode-controls" class="input-group">
            <input 
              type="text" 
              id="user-input" 
              placeholder="Type a message..."
              autocomplete="off"
            />
            <button id="send-btn">Send</button>
          </div>
          
          <!-- Improv Mode Controls -->
          <div id="improv-mode-controls" class="improv-controls" style="display: none;">
            <div class="input-group">
              <select id="improv-preset-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #444; background: #0f3460; color: white; font-size: 0.95em; margin-bottom: 8px;">
                <option value="">-- Use a Preset Scenario --</option>
              </select>
            </div>
            <div class="input-group">
              <input
                type="text"
                id="scene-title"
                placeholder="Scene title (e.g., 'At the Coffee Shop')..."
                autocomplete="off"
              />
            </div>
            <div class="input-group">
              <textarea
                id="scene-description"
                placeholder="Scene description (e.g., 'Three friends meet at a coffee shop and discuss their latest adventures')..."
                rows="3"
                autocomplete="off"
              ></textarea>
            </div>
            <div class="improv-buttons">
              <button id="start-improv-btn" class="primary-btn">Start Scene</button>
              <button id="stop-improv-btn" class="secondary-btn" style="display: none;">Stop Scene</button>
            </div>
          </div>
          
          <div class="agent-info">
            <p>Next speaker: <span id="next-agent">-</span></p>
          </div>
        </div>
      </div>
    </div>
  `

  // Wire up model picker — must run after app.innerHTML is set
  const modelSelectLaunch = document.getElementById('model-select-launch') as HTMLSelectElement
  const modelHint = document.getElementById('model-launch-hint')!
  const MODEL_HINTS: Record<string, string> = {
    'Hermes-3-Llama-3.2-3B-q4f16_1-MLC':  'Fine-tuned for instruction following. Best default choice on modern GPUs.',
    'Llama-3.2-3B-Instruct-q4f16_1-MLC':  'Standard Meta 3B model. Good speed/quality on any f16-capable GPU.',
    'Hermes-3-Llama-3.2-3B-q4f32_1-MLC':  'Same Hermes-3 3B in universal f32 mode — works on GPUs without f16 shader support.',
    'Llama-3.2-3B-Instruct-q4f32_1-MLC':  'Standard 3B in f32 mode. Compatible with older or integrated GPUs.',
    'Llama-2-7b-chat-hf-q4f32_1-MLC':     'Llama-2 7B Chat (Meta). Mid-size model, richer responses than 3B. ~4 GB VRAM, works on any WebGPU GPU — no f16 required.',
    'ford442/vicuna-7b-q4f32-webllm':      'Vicuna 7B (Llama-2 fine-tune). Instruction-following specialist. ~4 GB VRAM, works on any WebGPU GPU — no f16 required.',
    'Hermes-3-Llama-3.1-8B-q4f16_1-MLC':  'Best quality available. Requires RTX 30xx / RX 6000 / M1 Pro or better with f16 shader support.',
    'Llama-3.1-8B-Instruct-q4f16_1-MLC':  'Meta 8B flagship. Excellent reasoning. Requires f16-capable GPU with 5+ GB VRAM.',
  }
  const updateModelHint = () => { modelHint.textContent = MODEL_HINTS[modelSelectLaunch.value] ?? '' }
  modelSelectLaunch.addEventListener('change', updateModelHint)
  updateModelHint()

  // Wire up advanced VRAM settings sliders (live value display)
  const maxTokensSlider = document.getElementById('max-tokens-slider') as HTMLInputElement
  const maxTokensVal = document.getElementById('max-tokens-val')!
  const gpuMemSlider = document.getElementById('gpu-mem-slider') as HTMLInputElement
  const gpuMemVal = document.getElementById('gpu-mem-val')!
  const attentionSinkSlider = document.getElementById('attention-sink-slider') as HTMLInputElement
  const attentionSinkVal = document.getElementById('attention-sink-val')!

  if (maxTokensSlider) {
    maxTokensSlider.oninput = () => { maxTokensVal.textContent = maxTokensSlider.value }
  }
  if (gpuMemSlider) {
    gpuMemSlider.oninput = () => { gpuMemVal.textContent = gpuMemSlider.value + '%' }
  }
  if (attentionSinkSlider && attentionSinkVal) {
    attentionSinkSlider.oninput = () => { attentionSinkVal.textContent = attentionSinkSlider.value }
  }

  // Update capability display
  function updateCapabilityDisplay() {
    const caps = EngineFactory.detectCapabilities()
    const el = document.getElementById('engine-capabilities')
    if (el) {
      el.innerHTML = `
        ${caps.webgpu ? '✅' : '❌'} WebGPU 
        ${caps.wasm ? '✅' : '❌'} WASM 
        ${caps.simd ? '✅' : '❌'} SIMD 
        ${caps.threads ? '✅' : '❌'} Threads
      `
    }
  }
  updateCapabilityDisplay()

  // Wait for user to click Launch before starting initialization
  const { selectedModelId, preferredContext, vramConfig, chosenMaxTokens, enginePreference } = await new Promise<{
    selectedModelId: string;
    preferredContext: number | 'auto';
    vramConfig: VRAMOptimizationConfig;
    chosenMaxTokens: number;
    enginePreference: EngineType;
  }>(resolve => {
    document.getElementById('launch-btn')!.addEventListener('click', () => {
      const contextSelect = document.getElementById('context-size-select') as HTMLSelectElement;
      const contextVal = contextSelect ? contextSelect.value : 'auto';
      const preferredContext = contextVal === 'auto' ? 'auto' : parseInt(contextVal, 10);

      // Get engine preference
      const engineSelect = document.getElementById('engine-select') as HTMLSelectElement
      const enginePreference = (engineSelect?.value as EngineType) || 'auto'

      // Read advanced VRAM settings
      const prefillSelect = document.getElementById('prefill-chunk-select') as HTMLSelectElement;
      const kvCacheSelect = document.getElementById('kv-cache-select') as HTMLSelectElement;
      const slidingWindowSelect = document.getElementById('sliding-window-select') as HTMLSelectElement;
      const attentionSinkSliderEl = document.getElementById('attention-sink-slider') as HTMLInputElement;
      const gpuMemSliderEl = document.getElementById('gpu-mem-slider') as HTMLInputElement;
      const maxTokensSliderEl = document.getElementById('max-tokens-slider') as HTMLInputElement;

      const vramConfig: VRAMOptimizationConfig = {
        prefill_chunk_size: parseInt(prefillSelect?.value ?? '0', 10),
        kv_cache_quantization: (kvCacheSelect?.value ?? 'auto') as VRAMOptimizationConfig['kv_cache_quantization'],
        sliding_window_size: parseInt(slidingWindowSelect?.value ?? '0', 10),
        attention_sink_size: parseInt(attentionSinkSliderEl?.value ?? '4', 10),
        gpu_memory_utilization: (parseInt(gpuMemSliderEl?.value ?? '85', 10)) / 100,
      };

      const chosenMaxTokens = parseInt(maxTokensSliderEl?.value ?? '96', 10);

      document.getElementById('model-picker')!.style.display = 'none'
      document.getElementById('progress-section')!.style.display = 'block'
      resolve({ selectedModelId: modelSelectLaunch.value, preferredContext, vramConfig, chosenMaxTokens, enginePreference })
    })
  })

  const canvas = document.getElementById('scene') as HTMLCanvasElement
  const loadingDiv = document.getElementById('loading')!
  const chatContainer = document.getElementById('chat-container')!
  const progressBar = document.getElementById('progress') as HTMLDivElement
  // @ts-ignore
  console.log(progressBar);
  const chatLog = document.getElementById('chat-log')!
  const userInput = document.getElementById('user-input') as HTMLInputElement
  const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
  const nextAgentSpan = document.getElementById('next-agent')!
  const ttsStepsSlider = document.getElementById('tts-steps') as HTMLInputElement
  const ttsStepsVal = document.getElementById('tts-steps-val')!
  const chaosSlider = document.getElementById('director-chaos') as HTMLInputElement
  const chaosVal = document.getElementById('director-chaos-val')!
  const seedInput = document.getElementById('global-seed') as HTMLInputElement
  const profanitySlider = document.getElementById('profanity-level') as HTMLInputElement
  const profanityVal = document.getElementById('profanity-val')!
  const userProfileInput = document.getElementById('user-profile-input') as HTMLInputElement
  const switchProfileBtn = document.getElementById('switch-profile-btn') as HTMLButtonElement

  // Disable all inputs until fully initialized
  setInputsEnabled(false)

  // Suppress GPU cascade rejections (orphan AbortError promises from WebLLM internals
  // after a GPUOutOfMemoryError — these can't be caught in the normal promise chain)
  const suppressGpuCascadeRejections = (event: PromiseRejectionEvent) => {
    if (GroupChatManager.getErrorCategory(event.reason) === 'oom') {
      event.preventDefault()
      console.warn('[GPU] OOM cascade rejection suppressed:', event.reason)
    }
  }
  window.addEventListener('unhandledrejection', suppressGpuCascadeRejections)

  try {
    // Initialize managers inside try-catch to handle errors (e.g. WebGL failure)
    const groupChatManager = new GroupChatManager(agents)

    // Apply user's advanced VRAM settings before initialization
    groupChatManager.setVRAMConfig(vramConfig)
    groupChatManager.setMaxTokensPerTurn(chosenMaxTokens)

    const audioEngine = new AudioEngine()
    const speechQueue = new SpeechQueue(audioEngine)

    // Check for WebGL 2 support explicitly before initializing Three.js
    // Must specify attributes here to match Stage requirements, otherwise we get a mismatch or poor quality
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) {
      throw new Error('WebGL 2 is not supported or is disabled in this environment.');
    }

    const stage = new Stage(canvas, gl as WebGLRenderingContext)
    const lipSync = new LipSync(speechQueue.getAudioContext())

    // Wire up Audio -> Visuals
    // SpeechQueue -> LipSync -> Destination
    speechQueue.setDestination(lipSync.analyser)
    lipSync.analyser.connect(speechQueue.getAudioContext().destination)

    stage.setLipSync(lipSync)
    stage.render()

    // Stage 1: DOM and WebGL setup (10%)
    currentInitState = 'BOOTING'
    setProgress("Setting up graphics...", 10)

    // Stage 2: Initialize Audio Engine (25%)
    currentInitState = 'AUDIO'
    setProgress("Initializing Audio Engine...", 25)
    await audioEngine.init('./tts/onnx');

    // Stage 3: Initialize WebLLM with progress (55% of total progress)
    currentInitState = 'MODEL'
    setProgress("Initializing LLM Engine...", 35)
    await groupChatManager.initialize((progress: webllm.InitProgressReport) => {
      // Map WebLLM progress (0-1) to 35-90% of total progress
      const percentage = 35 + Math.round(progress.progress * 55)
      setProgress(progress.text, percentage)
    }, selectedModelId, preferredContext, enginePreference)

    // Stage 4: Final setup and UI binding (90%)
    currentInitState = 'FINALIZING'
    setProgress("Finalizing setup...", 90)

    // Initialize ImprovSceneManager
    const improvSceneManager = new ImprovSceneManager(groupChatManager)

    // Stage 5: Ready - Enable all interactions (100%)
    currentInitState = 'READY'
    setProgress("Ready!", 100)

    // Hide loading, show chat
    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'

    // Enable all inputs now that everything is ready
    setInputsEnabled(true)
    userInput.focus()

    // Helper: update the VRAM / context info bar in the chat container
    const updateVRAMInfoBar = () => {
      const ctxInfoText = document.getElementById('ctx-info-text')
      const tokenBudgetText = document.getElementById('token-budget-text')
      const kvText = document.getElementById('vram-kv-text')

      const ctxInfo = groupChatManager.getContextWindowInfo()
      if (ctxInfoText) {
        if (ctxInfo) {
          const pct = Math.round((ctxInfo.usedTokens / ctxInfo.maxTokens) * 100)
          ctxInfoText.textContent = `Context: ${ctxInfo.usedTokens}/${ctxInfo.maxTokens} tokens (${pct}%)`
          if (ctxInfo.droppedMessages > 0) {
            ctxInfoText.textContent += ` · ${ctxInfo.droppedMessages} msgs dropped`
          }
        } else {
          const maxCtx = groupChatManager.getContextManager().getMaxContextTokens()
          ctxInfoText.textContent = `Context window: ${maxCtx} tokens`
        }
      }
      if (tokenBudgetText) {
        tokenBudgetText.textContent = `Max tokens: ${groupChatManager.getMaxTokensPerTurn()}`
      }
      if (kvText) {
        const cfg = groupChatManager.getVRAMConfig()
        if (cfg.kv_cache_quantization !== 'none') {
          kvText.textContent = `KV: ${cfg.kv_cache_quantization === 'auto' ? 'auto' : cfg.kv_cache_quantization}`
        } else {
          kvText.textContent = ''
        }
      }
    }
    updateVRAMInfoBar()

    // UI listeners
    ttsStepsSlider.oninput = () => ttsStepsVal.textContent = ttsStepsSlider.value
    chaosSlider.oninput = () => chaosVal.textContent = chaosSlider.value + '%'

    // Profanity level slider
    const profanityLevels: { level: ProfanityLevel; label: string; color: string }[] = [
      { level: 'PG', label: '👼 PG', color: '#4ecdc4' },
      { level: 'CASUAL', label: '😏 Casual', color: '#45b7d1' },
      { level: 'GRITTY', label: '🔥 Gritty', color: '#ffd700' },
      { level: 'UNCENSORED', label: '💀 Uncensored', color: '#ff6b6b' },
    ]
    profanitySlider.oninput = () => {
      const idx = parseInt(profanitySlider.value)
      const { level, label, color } = profanityLevels[idx]
      profanityVal.textContent = label
      profanityVal.style.color = color
      groupChatManager.setProfanityLevel(level)
    }

    // Switch Profile Listener
    switchProfileBtn.addEventListener('click', () => {
      const newProfile = userProfileInput.value.trim() || 'default';

      // Initialize memory manager if we had access, but for now we rely on the window
      // global if director exposes it, or we trigger a UI notification
      if ((window as any).getDirector) {
        const director = (window as any).getDirector();
        if (director && director.memoryManager) {
          director.memoryManager.switchProfile(newProfile);
          addMessage('System', `Switched to profile: ${newProfile}`, '#4ecdc4');
        }
      } else {
        // We might not have director directly exposed in main.ts without modifying it
        addMessage('System', 'Profile switching requires Director to be running', '#ff6b6b');
      }
    });

    // Update next agent info
    const updateNextAgentUI = () => {
      const nextAgent = groupChatManager.getCurrentAgent()
      nextAgentSpan.textContent = nextAgent.name
      nextAgentSpan.style.color = nextAgent.color
    }
    updateNextAgentUI()

    // Add message to chat log
    const addMessage = (sender: string, message: string, color: string, agentId?: string) => {
      const messageDiv = document.createElement('div')
      messageDiv.className = 'message'
      messageDiv.innerHTML = `
        <strong style="color: ${color}">${sender}:</strong> ${message}
      `
      if (agentId) {
          const feedbackDiv = document.createElement('div');
          feedbackDiv.className = 'feedback-controls';
          feedbackDiv.style.cssText = 'display: inline-block; margin-left: 10px; font-size: 0.8em; opacity: 0.5; cursor: pointer;';
          feedbackDiv.innerHTML = `<span class="thumb-up">👍</span> <span class="thumb-down">👎</span>`;

          feedbackDiv.querySelector('.thumb-up')?.addEventListener('click', () => {
              groupChatManager.evolvePersonality(agentId, 'positive');
              feedbackDiv.innerHTML = '✨';
          });
          feedbackDiv.querySelector('.thumb-down')?.addEventListener('click', () => {
              groupChatManager.evolvePersonality(agentId, 'negative');
              feedbackDiv.innerHTML = '📉';
          });

          messageDiv.appendChild(feedbackDiv);
      }
      chatLog.appendChild(messageDiv)
      chatLog.scrollTop = chatLog.scrollHeight
    }

    // Prerender state for audio
    let isPrerendering = false;

    // Helper to speak and animate with options (steps + seed)
    const speakAndVisualize = async (text: string, agentId: string, options: { steps?: number; seed?: number; speed?: number } = {}) => {
      try {
        stage.setActiveActor(agentId);
        const audioData = await audioEngine.synthesize(text, agentId, { steps: options.steps, seed: options.seed });
        speechQueue.add(audioData);
      } catch (e) {
        console.error("Speech synthesis failed", e);
      }
    }

    // Prerender upcoming sentences to avoid gaps in audio
    const prerenderAhead = async (sentences: string[], agentId: string, options: { steps?: number; seed?: number; speed?: number } = {}) => {
      if (isPrerendering || sentences.length === 0) return;

      isPrerendering = true;
      console.log(`[Prerender Audio] Starting prerender of ${sentences.length} sentences`);

      // Prerender first few sentences ahead
      const prerenderCount = Math.min(MAX_PRERENDER_SENTENCES, sentences.length);
      const toPrerender = sentences.slice(0, prerenderCount);

      speechQueue.prerenderSentences(toPrerender, agentId, options);
      isPrerendering = false;
    }

    // Handle send message
    const sendMessage = async () => {
      const message = userInput.value.trim()
      if (!message) return

      userInput.value = ''
      userInput.disabled = true
      sendBtn.disabled = true

      // Add user message to log
      addMessage('You', message, '#ffffff')

      try {
        // Get response from current agent with streaming
        // We buffer the response for log, but speak sentence by sentence
        let currentAgentId = groupChatManager.getCurrentAgent().id;
        const agent = agents.find(a => a.id === currentAgentId)!;

        // Start a fresh response line in chat log? 
        // For simplicity, we'll append chunks or just update one message.
        // Or wait for full response to add to log? 
        // Prompt says "When the LLM emits a sentence, pass it to AudioEngine".
        // Let's create a placeholder message and update it, OR just add message at the end.
        // Let's add the message header first.

        let fullResponse = "";
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content">...</span>`;

        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-controls';
        feedbackDiv.style.cssText = 'display: inline-block; margin-left: 10px; font-size: 0.8em; opacity: 0.5; cursor: pointer;';
        feedbackDiv.innerHTML = `<span class="thumb-up">👍</span> <span class="thumb-down">👎</span>`;

        feedbackDiv.querySelector('.thumb-up')?.addEventListener('click', () => {
            groupChatManager.evolvePersonality(agent.id, 'positive');
            feedbackDiv.innerHTML = '✨';
        });
        feedbackDiv.querySelector('.thumb-down')?.addEventListener('click', () => {
            groupChatManager.evolvePersonality(agent.id, 'negative');
            feedbackDiv.innerHTML = '📉';
        });
        messageDiv.appendChild(feedbackDiv);

        chatLog.appendChild(messageDiv);
        const contentSpan = messageDiv.querySelector('.content')!;

        // Make agent jump (Removed, handled by speakAndVisualize active actor)
        stage.setActiveActor(currentAgentId);

        // derive optional seed for reproducibility in chat mode
        const baseUserSeed = seedInput.value ? parseInt(seedInput.value) : undefined
        const baseTurnSeed = baseUserSeed !== undefined ? baseUserSeed + groupChatManager.getHistoryLength() : undefined

        // Character-specific speeds
        const characterSpeeds: Record<string, number> = {
          'comedian': 1.5,
          'philosopher': 0.6,
          'scientist': 1.0
        }

        // Buffer for prerendering
        const sentenceBuffer: string[] = [];
        let sentenceIndex = 0;

        await groupChatManager.chat(message + ' ###', (sentence) => {
          // New sentence received
          console.log(`[${agent.name} speaks]: ${sentence}`);

          // Add to buffer for prerendering
          sentenceBuffer.push(sentence);

          // Prerender next few sentences ahead
          if (sentenceBuffer.length >= 2 && sentenceIndex < sentenceBuffer.length - 1) {
            const upcomingSentences = sentenceBuffer.slice(sentenceIndex + 1);
            prerenderAhead(upcomingSentences, agent.id, {
              steps: parseInt(ttsStepsSlider.value || '10'),
              speed: characterSpeeds[agent.id] || 1.0,
              seed: baseTurnSeed
            });
          }

          // Speak current sentence
          speakAndVisualize(sentence, agent.id, {
            steps: parseInt(ttsStepsSlider.value || '10'),
            speed: characterSpeeds[agent.id] || 1.0,
            seed: baseTurnSeed
          });
          sentenceIndex++;

          // Update UI with partial text
          if (!fullResponse) contentSpan.textContent = ""; // clear ...
          fullResponse += sentence + " ";
          contentSpan.textContent = fullResponse;
          chatLog.scrollTop = chatLog.scrollHeight;
        }, { seed: baseTurnSeed });

        // Wait for audio to finish playing this turn
        await speechQueue.waitUntilFinished();

        updateNextAgentUI();
        updateVRAMInfoBar();

      } catch (error) {
        console.error('Error:', error)
        // If token budget was auto-reduced due to OOM, show a notification
        if (GroupChatManager.getErrorCategory(error) === 'oom') {
          addMessage('System', `⚠️ GPU ran out of memory. Max tokens reduced to ${groupChatManager.getMaxTokensPerTurn()}.`, '#ff6b6b')
          updateVRAMInfoBar()
        }
        addMessage('System', 'Error generating response', '#ff0000')
      }

      userInput.disabled = false
      sendBtn.disabled = false
      userInput.focus()
    }

    sendBtn.addEventListener('click', sendMessage)
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage()
      }
    })

    // Mode switching
    const chatModeBtn = document.getElementById('chat-mode-btn')!
    const improvModeBtn = document.getElementById('improv-mode-btn')!
    const chatModeControls = document.getElementById('chat-mode-controls')!
    const improvModeControls = document.getElementById('improv-mode-controls')!

    chatModeBtn.addEventListener('click', () => {
      chatModeBtn.classList.add('active')
      improvModeBtn.classList.remove('active')
      chatModeControls.style.display = 'flex'
      improvModeControls.style.display = 'none'

      // Stop improv if running
      if (improvSceneManager.isSceneRunning()) {
        improvSceneManager.stop()
      }

      updateNextAgentUI()
    })

    improvModeBtn.addEventListener('click', () => {
      improvModeBtn.classList.add('active')
      chatModeBtn.classList.remove('active')
      chatModeControls.style.display = 'none'
      improvModeControls.style.display = 'block'
    })

    // Helper to calculate pacing for each turn (affects LLM token budget and TTS steps)
    // All maxTokens capped at 96 to prevent VRAM exhaustion
    const calculatePacing = () => {
      const roll = Math.random();
      // 30% Chance: "The One-Liner"
      if (roll > 0.7) {
        return {
          type: 'punchline',
          maxTokens: 48,
          ttsSteps: 25,
          promptSuffix: ' (One joking sentence. Be brief.)'
        }
        // 50% Chance: "The Standard"
      } else if (roll > 0.2) {
        return {
          type: 'standard',
          maxTokens: 72,
          ttsSteps: 16,
          promptSuffix: ' (1-2 sentences.)'
        }
        // 20% Chance: "The Rant"
      } else {
        return {
          type: 'rant',
          maxTokens: 96,
          ttsSteps: 8,
          promptSuffix: ' (Be expressive!)'
        }
      }
    }

    // Improv mode controls
    const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
    const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
    const improvPresetSelect = document.getElementById('improv-preset-select') as HTMLSelectElement
    const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
    const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement

    // Populate preset dropdown
    DEFAULT_IMPROV_SETUPS.forEach(setup => {
      const option = document.createElement('option')
      option.value = setup.id
      option.textContent = setup.title
      improvPresetSelect.appendChild(option)
    })

    // Setup preset selection listener
    improvPresetSelect.addEventListener('change', () => {
      if (!improvPresetSelect.value) return
      const selectedSetup = DEFAULT_IMPROV_SETUPS.find(s => s.id === improvPresetSelect.value)
      if (selectedSetup) {
        sceneTitleInput.value = selectedSetup.title
        sceneDescriptionInput.value = selectedSetup.description
      }
    })

    let isImprovRunning = false
    let prerenderedQueue: Array<{ agentId: string; agentName: string; response: string; sentences: string[] }> = []

    const startImprovScene = async () => {
      const title = sceneTitleInput.value.trim()
      const description = sceneDescriptionInput.value.trim()

      if (!title || !description) {
        addMessage('System', 'Please provide both a scene title and description', '#ff6b6b')
        return
      }

      // Build the scene object if necessary (not used directly in Director loop)

      // Disable inputs
      sceneTitleInput.disabled = true
      sceneDescriptionInput.disabled = true
      startImprovBtn.style.display = 'none'
      stopImprovBtn.style.display = 'inline-block'

      // Clear chat log for new scene
      addMessage('System', `🎭 Starting improv scene: "${title}"`, '#4ecdc4')
      addMessage('System', description, '#4ecdc4')

      try {
        // Start our own Director loop rather than using ImprovSceneManager's
        // Reset conversation history and start with a seed line
        isImprovRunning = true
        groupChatManager.resetConversation()
        prerenderedQueue = []

        // Prerender initial turns to get ahead
        const initialPrompt = `You are participating in an improv comedy scene with other characters.\nScene: "${title}"\nDescription: ${description}\n\nStart the scene with your character's perspective. Be creative, stay in character, and keep your response brief (2-3 sentences). ###`

        addMessage('System', '🎬 Prerendering opening dialogue...', '#888')

        try {
          const prerendered = await groupChatManager.prerenderTurns(initialPrompt, PRERENDER_INITIAL_TURNS)
          prerenderedQueue = prerendered
          console.log(`[Improv] Prerendered ${prerendered.length} turns`)
          addMessage('System', `✅ Prerendered ${prerendered.length} turns ahead`, '#4ecdc4')
        } catch (e) {
          console.error('[Improv] Prerender failed, continuing with live generation', e)
          addMessage('System', '⚠️ Prerender failed, using live generation', '#ff6b6b')
        }

        // Play first prerendered turn if available
        if (prerenderedQueue.length > 0) {
          await playPrerenderedTurn()
        } else if (groupChatManager.getHistoryLength() === 0) {
          const seed = title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?'
          addMessage('Director', `Action! "${seed}"`, '#888')
          await processTurn(seed)
        }

        // Continue loop until stopped
        while (isImprovRunning) {
          await new Promise(r => setTimeout(r, 1000))
          if (!isImprovRunning) break

          // FINE TUNING 4: Escalation from the Director, influenced by chaos slider
          const turnCount = groupChatManager.getHistoryLength()
          const chaosLevel = parseInt(chaosSlider.value)

          let critique = ""

          // 3. Intelligent Director Check
          // Only judge if scene is underway (turns > 2) and probability matches Chaos slider
          if (turnCount > 2 && Math.random() * 100 < chaosLevel) {

            // Visual cue that the Director is "Thinking"
            const thinkingDiv = document.createElement('div')
            thinkingDiv.innerHTML = `<em style="color:#666; font-size:0.9em">Director is watching...</em>`
            chatLog.appendChild(thinkingDiv)
            chatLog.scrollTop = chatLog.scrollHeight

            // Get judgment
            const rawCritique = await groupChatManager.getDirectorCritique()

            // Remove thinking cue
            chatLog.removeChild(thinkingDiv)

            // Parse format "[STATUS]: Instruction"
            if (rawCritique.includes(":")) {
              const parts = rawCritique.split(":")
              const status = parts[0].trim().toUpperCase() // "FLOWING" or "STAGNANT"
              critique = parts.slice(1).join(":").trim()

              // Color code the output
              if (status.includes("FLOWING")) {
                // Green/Teal for "Good job, keep going"
                addMessage('Director (Note)', `📝 ${critique}`, '#4ecdc4')
              } else {
                // Red/Orange for "Boring, change it!"
                addMessage('Director (Action!)', `🎬 ${critique}`, '#ff6b6b')
              }
            } else if (rawCritique) {
              // Fallback if format is weird
              critique = rawCritique
              addMessage('Director', `📣 ${critique}`, '#ffd700')
            }
          }

          // Default instruction for flow
          const prompt = '(Reply naturally to the last thing said)'

          // 4. Execute turn - use prerendered if available, otherwise generate live
          try {
            if (prerenderedQueue.length > 0) {
              console.log(`[Improv] Using prerendered turn (${prerenderedQueue.length} remaining)`)
              await playPrerenderedTurn()
            } else {
              console.log('[Improv] No prerendered turns, generating live')
              await processTurn(prompt, critique)
            }
          } catch (turnError) {
            const cat = GroupChatManager.getErrorCategory(turnError)
            if (cat === 'oom') {
              addMessage('System', '⚠️ GPU ran out of memory — scene stopped. Close other GPU-heavy tabs and reload.', '#ff6b6b')
              isImprovRunning = false
              break
            }
            throw turnError
          }
        }

        // Wait for final audio to finish
        await speechQueue.waitUntilFinished()

      } catch (error) {
        isImprovRunning = false
        console.error('Error running improv scene:', error)
        const cat = GroupChatManager.getErrorCategory(error)
        const msgs = {
          oom:     '⚠️ GPU ran out of memory. Close other GPU-heavy tabs and reload.',
          network: '⚠️ Network error during scene. Check your connection and try again.',
          webgpu:  '⚠️ WebGPU error. Try reloading the page.',
          unknown: '⚠️ Error running improv scene — see console for details.',
        } as const
        addMessage('System', msgs[cat] ?? msgs.unknown, '#ff6b6b')
      }

      // Re-enable inputs
      sceneTitleInput.disabled = false
      sceneDescriptionInput.disabled = false
      startImprovBtn.style.display = 'inline-block'
      stopImprovBtn.style.display = 'none'
    }

    const stopImprovScene = () => {
      isImprovRunning = false
      // Stop the manager if it's running
      if (improvSceneManager.isSceneRunning()) improvSceneManager.stop()
      addMessage('System', '🎭 Scene stopped by user', '#ff6b6b')
      sceneTitleInput.disabled = false
      sceneDescriptionInput.disabled = false
      startImprovBtn.style.display = 'inline-block'
      stopImprovBtn.style.display = 'none'
    }

    // Play a prerendered turn from the queue
    const playPrerenderedTurn = async () => {
      if (prerenderedQueue.length === 0) return

      const turn = prerenderedQueue.shift()!
      const agent = agents.find(a => a.id === turn.agentId)!

      console.log(`[Prerendered] Playing: ${agent.name} - ${turn.sentences.length} sentences`)

      stage.setActiveActor(turn.agentId)

      const messageDiv = document.createElement('div')
      messageDiv.className = 'message'
      messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content"></span>`

        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-controls';
        feedbackDiv.style.cssText = 'display: inline-block; margin-left: 10px; font-size: 0.8em; opacity: 0.5; cursor: pointer;';
        feedbackDiv.innerHTML = `<span class="thumb-up">👍</span> <span class="thumb-down">👎</span>`;

        feedbackDiv.querySelector('.thumb-up')?.addEventListener('click', () => {
            groupChatManager.evolvePersonality(agent.id, 'positive');
            feedbackDiv.innerHTML = '✨';
        });
        feedbackDiv.querySelector('.thumb-down')?.addEventListener('click', () => {
            groupChatManager.evolvePersonality(agent.id, 'negative');
            feedbackDiv.innerHTML = '📉';
        });
        messageDiv.appendChild(feedbackDiv);

      chatLog.appendChild(messageDiv)
      const contentSpan = messageDiv.querySelector('.content')!

      // Character-specific speeds
      const characterSpeeds: Record<string, number> = {
        'comedian': 1.5,
        'philosopher': 0.6,
        'scientist': 1.0
      }

      // Speak each sentence
      for (const sentence of turn.sentences) {
        await speakAndVisualize(sentence, turn.agentId, {
          steps: 16,
          speed: characterSpeeds[turn.agentId] || 1.0
        })
        contentSpan.textContent = contentSpan.textContent ? contentSpan.textContent + ' ' + sentence : sentence
        chatLog.scrollTop = chatLog.scrollHeight

        // Small delay between sentences for natural pacing
        await new Promise(r => setTimeout(r, 200))
      }

      // Update conversation history to keep it in sync with prerendered content
      groupChatManager.addToHistory('(Continue)', turn.response)

      await speechQueue.waitUntilFinished()
      updateNextAgentUI()

      // Trigger new prerendering when queue gets low
      if (prerenderedQueue.length < PRERENDER_MIN_QUEUE && isImprovRunning) {
        console.log('[Prerender] Queue low, generating more turns in background...')
        const continuePrompt = '(Reply naturally to the last thing said)'
        // Don't await - let it happen in background
        groupChatManager.prerenderTurns(continuePrompt, PRERENDER_BATCH_SIZE)
          .then(newTurns => {
            prerenderedQueue.push(...newTurns)
            console.log(`[Prerender] Added ${newTurns.length} turns to queue (now ${prerenderedQueue.length})`)
          })
          .catch(e => console.error('[Prerender] Background prerender failed:', e))
      }
    }

    // Director logic: process a single turn with pacing and TTS steps
    const processTurn = async (inputText: string, silentCritique?: string) => {
      try {
        // 1. Calculate Pacing for this specific turn
        const pacing = calculatePacing()
        console.log(`[Director] Pacing: ${pacing.type} (Tokens: ${pacing.maxTokens}, Steps: ${pacing.ttsSteps})`)

        let currentAgentId = groupChatManager.getCurrentAgent().id
        const agent = agents.find(a => a.id === currentAgentId)!

        stage.setActiveActor(currentAgentId)

        const messageDiv = document.createElement('div')
        messageDiv.className = 'message'
        messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content">...</span>`

        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-controls';
        feedbackDiv.style.cssText = 'display: inline-block; margin-left: 10px; font-size: 0.8em; opacity: 0.5; cursor: pointer;';
        feedbackDiv.innerHTML = `<span class="thumb-up">👍</span> <span class="thumb-down">👎</span>`;

        feedbackDiv.querySelector('.thumb-up')?.addEventListener('click', () => {
            groupChatManager.evolvePersonality(agent.id, 'positive');
            feedbackDiv.innerHTML = '✨';
        });
        feedbackDiv.querySelector('.thumb-down')?.addEventListener('click', () => {
            groupChatManager.evolvePersonality(agent.id, 'negative');
            feedbackDiv.innerHTML = '📉';
        });
        messageDiv.appendChild(feedbackDiv);

        chatLog.appendChild(messageDiv)
        const contentSpan = messageDiv.querySelector('.content')!

        // 2. Pass maxTokens to chat and append pacing prompt to the hidden prompt
        // Compute the per-turn deterministic seed if user provided a seed
        const userSeed = seedInput.value ? parseInt(seedInput.value) : undefined
        const turnSeed = userSeed !== undefined ? userSeed + groupChatManager.getHistoryLength() : undefined
        const effectivePrompt = inputText + pacing.promptSuffix + ' ###'

        // Character-specific speeds
        const characterSpeeds: Record<string, number> = {
          'comedian': 1.5,
          'philosopher': 0.6,
          'scientist': 1.0
        }

        // Buffer for prerendering upcoming sentences
        const sentenceBuffer: string[] = [];
        let sentenceIndex = 0;

        await groupChatManager.chat(effectivePrompt, (sentence) => {
          // Add sentence to buffer for prerendering
          sentenceBuffer.push(sentence);

          // Prerender next few sentences ahead if we have enough in buffer
          if (sentenceBuffer.length >= 2 && sentenceIndex < sentenceBuffer.length - 1) {
            const upcomingSentences = sentenceBuffer.slice(sentenceIndex + 1);
            prerenderAhead(upcomingSentences, agent.id, {
              steps: pacing.ttsSteps,
              speed: characterSpeeds[agent.id] || 1.0,
              seed: turnSeed
            });
          }

          // 3. Pass ttsSteps to speak current sentence
          speakAndVisualize(sentence, agent.id, { steps: pacing.ttsSteps, speed: characterSpeeds[agent.id] || 1.0, seed: turnSeed })
          sentenceIndex++;

          contentSpan.textContent = contentSpan.textContent === '...' ? sentence + ' ' : contentSpan.textContent + sentence + ' '
          chatLog.scrollTop = chatLog.scrollHeight
        }, { maxTokens: pacing.maxTokens, seed: turnSeed, hiddenInstruction: silentCritique })

        await speechQueue.waitUntilFinished()
        updateNextAgentUI()
        updateVRAMInfoBar()

      } catch (error) {
        console.error('Turn Error:', error)
        isImprovRunning = false
        updateVRAMInfoBar()
        // stopImprovLoop equivalent
      }
    }

    startImprovBtn.addEventListener('click', startImprovScene)
    stopImprovBtn.addEventListener('click', stopImprovScene)

    userInput.focus()
  } catch (error: any) {
    currentInitState = 'ERROR'
    console.error('Initialization error:', error)

    // Categorize the error for user-friendly messaging
    const errorCategory: ErrorCategory = GroupChatManager.getErrorCategory(error)

    // Build error messages based on category
    const errorMessages: Record<ErrorCategory, { title: string; suggestion: string }> = {
      webgpu: {
        title: 'WebGPU Not Supported',
        suggestion: 'Use Chrome 113+ or Edge 113+ with hardware acceleration enabled.'
      },
      oom: {
        title: 'GPU Out of Memory',
        suggestion: 'Close other GPU-heavy tabs and reload, or try a lower-VRAM model.'
      },
      network: {
        title: 'Network Error',
        suggestion: 'Check your connection and reload. Model weights download from HuggingFace CDN.'
      },
      unknown: {
        title: 'Initialization Failed',
        suggestion: 'Check the browser console for more details.'
      }
    }

    const { title, suggestion } = errorMessages[errorCategory]
    const rawError = error instanceof Error ? error.message : String(error)

    // Render error panel inside #loading div
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

    // Replace progress section with error panel
    const progressSection = document.getElementById('progress-section')!
    progressSection.style.display = 'none'
    const loadingDiv = document.getElementById('loading')!
    loadingDiv.innerHTML = ''
    loadingDiv.appendChild(errorPanel)

    // Wire up retry button
    const retryBtn = errorPanel.querySelector('.retry-btn') as HTMLButtonElement
    retryBtn.addEventListener('click', () => {
      loadingDiv.innerHTML = ''
      const progressSection = document.createElement('div')
      progressSection.id = 'progress-section'
      progressSection.style.display = 'block'
      progressSection.innerHTML = `
        <div class="progress-bar">
          <div id="progress" class="progress-fill"></div>
        </div>
        <p id="status">Initializing WebLLM...</p>
      `
      loadingDiv.appendChild(progressSection)
      initApp()
    })

    // Wire up copy button
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

    // Keep inputs disabled on error
    setInputsEnabled(false)
  }
}

initApp()
