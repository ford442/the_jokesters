import './style.css'
import { GroupChatManager } from './GroupChatManager'
import type { Agent, ProfanityLevel } from './GroupChatManager'
import { ImprovSceneManager } from './ImprovSceneManager'
import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
// import { SceneManager } from './SceneManager'
import * as webllm from '@mlc-ai/web-llm'

import { AudioEngine } from './audio/AudioEngine'
import { SpeechQueue } from './audio/SpeechQueue'

// --- Custom Model Configurations ---
// 1. User's custom Vicuna model (7B)
const customVicunaModelConfig = {
  model_id: "ford442/vicuna-7b-q4f32-webllm",
  model: "https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/",
  // This WASM file is assumed to be the correct library for the model architecture
  model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
  vram_required_MB: 4096,
  low_resource_required: false,
};

// 3. Lightweight Llama-2 2B for quick comparison testing
// Note: "Llama-2-2B" does not exist officially. Replacing with TinyLlama-1.1B which is a valid small Llama-based model.
const llama2bModelConfig = {
  model_id: 'TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC',
  model: 'https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC/resolve/main/',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/TinyLlama-1.1B-Chat-v0.4-q4f32_1-ctx2k_cs1k-webgpu.wasm',
  vram_required_MB: 2048,
  low_resource_required: false,
}

// 2. A smaller model for contrast (Qwen2 0.5B from mlc-ai)
const smallModelId = 'mlc-ai/Qwen2-0.5B-Instruct-q4f32_1-MLC';

// 4. Snowflake embedding model (for vector/embedding tasks)
const snowflakeEmbedModelConfig = {
  model_id: 'snowflake-arctic-embed-s-q0f32-MLC-b4',
  model: 'https://huggingface.co/mlc-ai/snowflake-arctic-embed-s-q0f32-MLC',
  // Prebuilt WASM runtime for the Snowflake embedding model (hosted by mlc-ai libs)
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/snowflake-arctic-embed-s-q0f32-ctx512_cs512_batch4-webgpu.wasm',
  vram_required_MB: 238.71,
  // Use a simple string type here to avoid coupling to an enum that may not be present at runtime
  model_type: 'embedding',
};

// Phi-3.5 Vision instruct (q4f16)
const phi35VisionQ4f16Config = {
  model_id: 'Phi-3.5-vision-instruct-q4f16_1-MLC',
  model: 'https://huggingface.co/mlc-ai/Phi-3.5-vision-instruct-q4f16_1-MLC',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Phi-3.5-vision-instruct-q4f16_1-ctx4k_cs2k-webgpu.wasm',
  vram_required_MB: 3952.18,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'vlm',
};

// Phi-3.5 Vision instruct (q4f32)
const phi35VisionQ4f32Config = {
  model_id: 'Phi-3.5-vision-instruct-q4f32_1-MLC',
  model: 'https://huggingface.co/mlc-ai/Phi-3.5-vision-instruct-q4f32_1-MLC',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Phi-3.5-vision-instruct-q4f32_1-ctx4k_cs2k-webgpu.wasm',
  vram_required_MB: 5879.84,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'vlm',
};

// SmolLM2 small instruct model
const smolLM2Config = {
  model_id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
  model: 'https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f32_1-MLC',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/SmolLM2-360M-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm',
  vram_required_MB: 579.61,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'llm',
};

// The previous default model
const defaultModelId = 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC';

// Inject the custom model into the WebLLM configuration list
// This ensures that webllm.CreateMLCEngine knows how to load the custom model weights/wasm
if (!webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === customVicunaModelConfig.model_id)) {
  webllm.prebuiltAppConfig.model_list.push(customVicunaModelConfig as any)
}
// Inject Llama2b for local testing if not present
if (!webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === llama2bModelConfig.model_id)) {
  webllm.prebuiltAppConfig.model_list.push(llama2bModelConfig as any)
}

// Register Snowflake embedding model so it's discoverable in the UI
if (!webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === snowflakeEmbedModelConfig.model_id)) {
  webllm.prebuiltAppConfig.model_list.push(snowflakeEmbedModelConfig as any)
}

// Phi-3.5 Vision instruct (q4f16)
if (!webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === phi35VisionQ4f16Config.model_id)) {
  webllm.prebuiltAppConfig.model_list.push(phi35VisionQ4f16Config as any)
}

// Phi-3.5 Vision instruct (q4f32)
if (!webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === phi35VisionQ4f32Config.model_id)) {
  webllm.prebuiltAppConfig.model_list.push(phi35VisionQ4f32Config as any)
}

// SmolLM2 small instruct model
if (!webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === smolLM2Config.model_id)) {
  webllm.prebuiltAppConfig.model_list.push(smolLM2Config as any)
}

// Log available models (now includes the custom one)
console.log('Available prebuilt models (including custom):', webllm.prebuiltAppConfig.model_list.map((m: any) => m.model_id))

// Curate the list of models we want in the dropdown, in a logical order
const availableModels = [
  defaultModelId,
  llama2bModelConfig.model_id,
  customVicunaModelConfig.model_id,
  smallModelId,
  snowflakeEmbedModelConfig.model_id,
  // Newly added models
  phi35VisionQ4f16Config.model_id,
  phi35VisionQ4f32Config.model_id,
  smolLM2Config.model_id,
].filter(id => webllm.prebuiltAppConfig.model_list.some((m: any) => m.model_id === id)); // Filter to ensure only models that exist are included

// Set the initial default model
const initialDefaultModel = availableModels.find(id => id.includes(defaultModelId)) || availableModels[0];

// Define our agents with different personalities and sampling parameters
// --- CASUAL & FUNNY AGENTS ---
const agents: Agent[] = [
  {
    id: 'comedian',
    name: 'The Comedian',
    // Added instruction: End your response with "###"
    // Female + Fast + Farcical
    systemPrompt:
      'You are a frantic, high-energy female comedian who talks incredibly fast. You are aware that you ramble at high speed and sometimes apologize for it. You mix highbrow references with lowbrow physical humor. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.95,
    top_p: 0.95,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    // Added instruction: End your response with "###"
    // Slow + Pretentious
    systemPrompt:
      'You are a cynical philosopher who speaks... very... slowly... to... ensure... your... profound... thoughts... are... understood. You judge the comedian for her speed. You are highbrow but petty. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.75,
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    // Added instruction: End your response with "###"
    // The "Literalist"
    systemPrompt:
      'You are a scientist who treats every joke as a serious hypothesis. You are dry and devoid of humor, which makes you unintentionally funny. You analyze crass jokes with mathematical precision. DO NOT use your name. End your response with "###"',
    temperature: 0.6,
    top_p: 0.85,
    color: '#45b7d1',
  },
]

// Initialize the app
async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  app.innerHTML = `
    <div class="container">
      <h1>The Jokesters</h1>
      <p class="subtitle">Multi-Agent Chat powered by Llama-3 & WebGPU</p>
      <div id="loading" class="loading">
        <div class="progress-bar">
          <div id="progress" class="progress-fill"></div>
        </div>
        <p id="status">Initializing WebLLM...</p>
        <div id="model-error" style="color:#ff6b6b;margin-top:6px;display:none;white-space:pre-wrap;"></div>
        <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
          <label style="color:#888; font-size:0.9em; white-space:nowrap;">LLM Model</label>
          <select id="model-select" style="flex:1; background:#0f3460; border:1px solid #444; color:white; padding:2px 5px;"></select>
          <button id="load-model-btn" style="margin-left:8px; padding:6px 10px;">Load Model</button>
        </div>
      </div>
      <div id="chat-container" class="chat-container">
        <canvas id="scene"></canvas>
        <div class="controls">
          <div class="settings-panel" style="margin-bottom: 15px; padding: 10px; background: #1a1a2e; border-radius: 8px;">
            
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
              <label style="color: #888; font-size: 0.8em; white-space: nowrap;">LLM Model</label>
              <select id="model-select-main" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px;"></select>
            </div>
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
              <span id="profanity-val" style="color: #ffd700; font-size: 0.9em; width: 80px;">櫨 Gritty</span>
            </div>
          </div>
          <div class="mode-selector">
            <button id="chat-mode-btn" class="mode-btn active">Chat Mode</button>
            <button id="improv-mode-btn" class="mode-btn">Improv Mode</button>
          </div>
          <div id="chat-log" class="chat-log"></div>
          
          <div id="chat-mode-controls" class="input-group">
            <input 
              type="text" 
              id="user-input" 
              placeholder="Type a message..."
              autocomplete="off"
            />
            <button id="send-btn">Send</button>
          </div>
          
          <div id="improv-mode-controls" class="improv-controls" style="display: none;">
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

  const canvas = document.getElementById('scene') as HTMLCanvasElement
  const loadingDiv = document.getElementById('loading')!
  const chatContainer = document.getElementById('chat-container')!
  const progressBar = document.getElementById('progress') as HTMLDivElement
  const statusText = document.getElementById('status')!
  const chatLog = document.getElementById('chat-log')!
  const userInput = document.getElementById('user-input') as HTMLInputElement
  const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
  const loadModelBtn = document.getElementById('load-model-btn') as HTMLButtonElement
  const nextAgentSpan = document.getElementById('next-agent')!
  const ttsStepsSlider = document.getElementById('tts-steps') as HTMLInputElement
  const ttsStepsVal = document.getElementById('tts-steps-val')!
  const chaosSlider = document.getElementById('director-chaos') as HTMLInputElement
  const chaosVal = document.getElementById('director-chaos-val')!
  const seedInput = document.getElementById('global-seed') as HTMLInputElement
  const profanitySlider = document.getElementById('profanity-level') as HTMLInputElement
  const profanityVal = document.getElementById('profanity-val')!
  // Improv controls (declared early so other functions can reference them)
  const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
  const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
  const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
  const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement
  const modelErrorDiv = document.getElementById('model-error') as HTMLDivElement | null
  // NEW: Get reference to the model selection box
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
  const modelSelectMain = document.getElementById('model-select-main') as HTMLSelectElement | null;

  // Refactor: Define managers using 'let' so they can be re-assigned on model change
  let groupChatManager: GroupChatManager;
  let improvSceneManager: ImprovSceneManager;
  let audioEngine: AudioEngine;
  let speechQueue: SpeechQueue;
  let stage: Stage;
  let lipSync: LipSync;
  let audioInitializing = false;

  // Update next agent info in the UI
  const updateNextAgentUI = () => {
    if (!groupChatManager) return
    const nextAgent = groupChatManager.getCurrentAgent()
    nextAgentSpan.textContent = nextAgent.name
    nextAgentSpan.style.color = nextAgent.color
  }

  const profanityLevels: { level: ProfanityLevel; label: string; color: string }[] = [
    { level: 'PG', label: '他 PG', color: '#4ecdc4' },
    { level: 'CASUAL', label: ' Casual', color: '#45b7d1' },
    { level: 'GRITTY', label: '櫨 Gritty', color: '#ffd700' },
    { level: 'UNCENSORED', label: '逐 Uncensored', color: '#ff6b6b' },
  ]
  
  // NEW: Function to handle LLM/Manager initialization and re-initialization
  const initializeManagers = async (modelId: string) => {
    // Clear any prior model error
    if (modelErrorDiv) { modelErrorDiv.style.display = 'none'; modelErrorDiv.textContent = '' }

    // Disable model select and load button during initialization to prevent re-entrancy
    if (modelSelect) modelSelect.disabled = true;
    if (loadModelBtn) loadModelBtn.disabled = true;
    if (audioInitializing) {
      statusText.textContent = 'Audio initialization already in progress...'
      return
    }

    // 1. Initialize Audio Engine (in background or parallel)
    // Only initialize the shared resources once
    if (!audioEngine) {
      statusText.textContent = "Initializing Audio Engine..."
      audioEngine = new AudioEngine()
      speechQueue = new SpeechQueue(audioEngine)
      audioInitializing = true

      // Check for WebGL 2 support explicitly before initializing Three.js
      const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
      if (!gl) {
        throw new Error('WebGL 2 is not supported or is disabled in this environment.');
      }

      stage = new Stage(canvas, gl as WebGLRenderingContext)
      lipSync = new LipSync(speechQueue.getAudioContext())

      // Wire up Audio -> Visuals
      speechQueue.setDestination(lipSync.analyser)
      lipSync.analyser.connect(speechQueue.getAudioContext().destination)

      stage.setLipSync(lipSync)
      stage.render()
      audioInitializing = true
      try {
        await audioEngine.init('./tts/onnx');
      } catch (err: any) {
        // Clear UI state and show a clearer error message for WASM/Module failures
        console.error('Audio engine initialization failed:', err)
        statusText.textContent = 'Audio engine failed to initialize. See console for details.'
        statusText.style.color = '#ff6b6b'
        // Common Emscripten error when multiple Module objects conflict
        if (String(err).includes('Module object should not be replaced')) {
          console.error('Possible Emscripten Module conflict: ensure the BespokeSynth WASM is built with MODULARIZE=1 or that the script order does not replace window.Module.')
        }
        // Re-enable UI controls to allow retry or selecting a different model
        if (modelSelect) modelSelect.disabled = false
        if (loadModelBtn) loadModelBtn.disabled = false
        audioInitializing = false
        throw err
      } finally {
        audioInitializing = false
      }
    }

    // 2. Instantiate new managers
    groupChatManager = new GroupChatManager(agents)
    improvSceneManager = new ImprovSceneManager(groupChatManager)

    // 3. Initialize the chat manager with progress callback, passing the new modelId
    statusText.textContent = `Initializing WebLLM: ${modelId}...`
    await groupChatManager.initialize(modelId, (progress: webllm.InitProgressReport) => {
      const percentage = Math.round(progress.progress * 100)
      progressBar.style.width = `${percentage}%`
      statusText.textContent = progress.text
    })

    // Re-apply settings to the new manager instance
    const idx = parseInt(profanitySlider.value)
    const { level } = profanityLevels[idx]
    groupChatManager.setProfanityLevel(level)

    // Hide loading, show chat
    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'
    // Re-enable model select and load button after successful initialization
    if (modelSelect) modelSelect.disabled = false;
    if (modelSelectMain) modelSelectMain.disabled = false;
    if (loadModelBtn) loadModelBtn.disabled = false;

    // Ensure both selects reflect the active model
    if (modelSelectMain) modelSelectMain.value = modelId;
    if (modelErrorDiv) { modelErrorDiv.style.display = 'none'; modelErrorDiv.textContent = '' }

    // Enable chat and improv controls now that a model is loaded
    userInput.disabled = false
    sendBtn.disabled = false
    if (typeof (startImprovBtn as any) !== 'undefined' && startImprovBtn) startImprovBtn.disabled = false

    updateNextAgentUI()
  }

  try {
    // NEW: Populate model select dropdown (both loading and main settings select)
    availableModels.forEach(modelId => {
      const option = document.createElement('option');
      option.value = modelId;
      option.textContent = modelId;
      modelSelect.appendChild(option);
      if (modelSelectMain) {
        const opt2 = option.cloneNode(true) as HTMLOptionElement
        modelSelectMain.appendChild(opt2)
      }
    });
    // Set the default model in the dropdown
    if (initialDefaultModel) {
      modelSelect.value = initialDefaultModel;
      if (modelSelectMain) modelSelectMain.value = initialDefaultModel;
    }
    // Do NOT auto-load any model. The user must click "Load Model" to initialize.
    statusText.textContent = 'Select a model and click "Load Model" to begin.'
    loadingDiv.style.display = 'flex'
    
    // UI listeners
    ttsStepsSlider.oninput = () => ttsStepsVal.textContent = ttsStepsSlider.value
    chaosSlider.oninput = () => chaosVal.textContent = chaosSlider.value + '%'

    // Profanity level slider
    profanitySlider.oninput = () => {
      const idx = parseInt(profanitySlider.value)
      const { level, label, color } = profanityLevels[idx]
      profanityVal.textContent = label
      profanityVal.style.color = color
      groupChatManager.setProfanityLevel(level)
    }

    // Disable chat/improv controls until a model is loaded
    userInput.disabled = true
    sendBtn.disabled = true
    if (startImprovBtn) startImprovBtn.disabled = true

    // NEW: Model change listener
    // When selection changes, enable the Load Model button and leave loading explicit
    modelSelect.addEventListener('change', () => {
      if (modelSelectMain) modelSelectMain.value = modelSelect.value;
      if (loadModelBtn) loadModelBtn.disabled = false;
    });

    if (modelSelectMain) {
      modelSelectMain.addEventListener('change', () => {
        modelSelect.value = modelSelectMain.value;
        if (loadModelBtn) loadModelBtn.disabled = false;
      });
    }

    // Load Model button handler (explicit, mandatory model load)
    if (loadModelBtn) {
      loadModelBtn.addEventListener('click', async () => {
        const newModelId = modelSelect.value;

        // Stop improv if running
        if (isImprovRunning) stopImprovScene();

        chatContainer.style.display = 'none';
        loadingDiv.style.display = 'flex';
        chatLog.innerHTML = '';

        try {
          const modelInfo = webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === newModelId)

          // Lightweight URL checks to prevent long-running network failures when loading large WASM/model assets
          // 1) If the selected model is Qwen, keep the existing URL HEAD check (it was added for reliability)
          if (newModelId.toLowerCase().includes('qwen')) {
            const urlToCheck = modelInfo?.model
            if (urlToCheck) {
              statusText.textContent = `Checking model URL for ${newModelId}...`
              // Fetch with timeout to verify reachability
              const controller = new AbortController()
              const timeout = setTimeout(() => controller.abort(), 5000)
              try {
                const resp = await fetch(urlToCheck, { method: 'HEAD', signal: controller.signal })
                clearTimeout(timeout)
                if (!resp.ok) {
                  throw new Error(`Model URL returned ${resp.status}`)
                }
              } catch (err) {
                console.error('Qwen model URL check failed:', err)
                statusText.textContent = `Model URL check failed for ${newModelId}. See console.`
                statusText.style.color = '#ff6b6b'
                loadingDiv.style.display = 'flex'
                if (modelSelect) modelSelect.disabled = false
                if (loadModelBtn) loadModelBtn.disabled = false
                return
              }
            }
          }

          // 2) Preflight-check the model runtime/WASM URL (model_lib) for ALL models. Some hosts (raw.githubusercontent.com, cf CDN) can be rate-limited or return HTML errors.
          const modelRuntimeURL = modelInfo?.model_lib || modelInfo?.model_lib_url || modelInfo?.model
          if (modelRuntimeURL) {
            statusText.textContent = `Checking model runtime URL for ${newModelId}...`
            const controller = new AbortController()
            const timeoutMs = 8000
            const timeout = setTimeout(() => controller.abort(), timeoutMs)
            let ok = false
            try {
              // Try HEAD first (many hosts support it). If it fails or returns HTML, try a small Range GET as fallback.
              const headResp = await fetch(modelRuntimeURL, { method: 'HEAD', signal: controller.signal })
              clearTimeout(timeout)
              if (headResp.ok) {
                const ct = headResp.headers.get('content-type') || ''
                if (!ct.includes('text/html') && !ct.includes('text/plain')) {
                  ok = true
                } else {
                  console.warn('Model runtime HEAD returned non-binary content-type:', ct)
                }
              } else {
                console.warn('Model runtime HEAD returned non-OK status:', headResp.status)
              }
            } catch (headErr) {
              console.warn('HEAD check failed for model runtime, attempting Range GET as fallback:', headErr)
              try {
                // Reset controller for second request
                const controller2 = new AbortController()
                const timeout2 = setTimeout(() => controller2.abort(), timeoutMs)
                const rangeResp = await fetch(modelRuntimeURL, { method: 'GET', headers: { Range: 'bytes=0-1023' }, signal: controller2.signal })
                clearTimeout(timeout2)
                if (rangeResp.ok) {
                  const ct = rangeResp.headers.get('content-type') || ''
                  if (!ct.includes('text/html') && !ct.includes('text/plain')) {
                    ok = true
                  } else {
                    console.warn('Model runtime Range GET returned non-binary content-type:', ct)
                  }
                } else {
                  console.warn('Model runtime Range GET returned non-OK status:', rangeResp.status)
                }
              } catch (rangeErr) {
                console.error('Range GET fallback failed for model runtime:', rangeErr)
              }
            }

            if (!ok) {
              const friendly = `Model runtime '${modelRuntimeURL}' is not reachable or does not look like a binary runtime (WASM). This commonly causes network/cache errors while loading a model.`
              console.error(friendly)
              statusText.textContent = friendly
              statusText.style.color = '#ff6b6b'
              if (modelErrorDiv) {
                modelErrorDiv.textContent = `${friendly}\n\nSuggestions:\n • Check the URL in the model config is a direct link to the WASM runtime (not a directory or HTML page).\n • Raw GitHub links may be rate-limited; try hosting the WASM on a stable CDN (jsdelivr/gh-cdn) or mlc-ai's releases.\n • If the file is very large, try a smaller model or a local static host.`
                modelErrorDiv.style.display = 'block'
              }
              if (modelSelect) modelSelect.disabled = false
              if (loadModelBtn) loadModelBtn.disabled = false
              return
            }
          }

          // Clear prior model error
          if (modelErrorDiv) { modelErrorDiv.style.display = 'none'; modelErrorDiv.textContent = '' }

          // Terminate gracefully if we have an existing manager
          if (groupChatManager && typeof (groupChatManager as any).terminate === 'function') {
            await groupChatManager.terminate()
          }

          // Initialize with the chosen model
          await initializeManagers(newModelId)
        } catch (e: any) {
          console.error('Error loading model:', e)
          const errMsg = e?.message || String(e)

          // Detect cache.add / network errors and show a clearer message
          if (errMsg.includes('Cache.add') || errMsg.includes("Failed to execute 'add' on 'Cache'") || errMsg.includes('NetworkError') || errMsg.includes('net::ERR')) {
            const friendly = `Network error while fetching model assets. This commonly happens when the browser cannot fetch model files from the host (CORS, network/firewall, or blocked Host).

Suggestions:
  • Check your network connection and any firewall/proxy settings.
  • Try a different model in the selector.
  • If using Hugging Face/cas-bridge, ensure the model URL is reachable from your browser (open DevTools → Network to inspect failing GETs).
  • As a fallback, download the model locally and point the app to a local URL or static server.`
            statusText.textContent = friendly
            statusText.style.color = '#ff6b6b'
            if (modelErrorDiv) {
              modelErrorDiv.textContent = friendly
              modelErrorDiv.style.display = 'block'
            }
          } else {
            statusText.textContent = `Error loading model ${newModelId}. See console.`
            statusText.style.color = '#ff6b6b'
            if (modelErrorDiv) {
              modelErrorDiv.textContent = `Error loading model: ${errMsg}`
              modelErrorDiv.style.display = 'block'
            }
          }

          loadingDiv.style.display = 'flex'
          chatContainer.style.display = 'none'
          if (modelSelect) modelSelect.disabled = false
          if (modelSelectMain) modelSelectMain.disabled = false
          if (loadModelBtn) loadModelBtn.disabled = false
        }
      })
    }

    // Update next agent info (defined above)
    updateNextAgentUI()

    // Add message to chat log
    const addMessage = (sender: string, message: string, color: string) => {
      const messageDiv = document.createElement('div')
      messageDiv.className = 'message'
      messageDiv.innerHTML = `
        <strong style="color: ${color}">${sender}:</strong> ${message}
      `
      chatLog.appendChild(messageDiv)
      chatLog.scrollTop = chatLog.scrollHeight
    }

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

    // Handle send message
    const sendMessage = async () => {
      if (!groupChatManager) {
        addMessage('System', 'No model loaded. Please select and load a model first.', '#ff6b6b')
        return
      }
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
        chatLog.appendChild(messageDiv);
        const contentSpan = messageDiv.querySelector('.content')!;

        // Make agent jump (Removed, handled by speakAndVisualize active actor)
        stage.setActiveActor(currentAgentId);

        // derive optional seed for reproducibility in chat mode
        const baseUserSeed = seedInput.value ? parseInt(seedInput.value) : undefined
        const baseTurnSeed = baseUserSeed !== undefined ? baseUserSeed + groupChatManager.getHistoryLength() : undefined
        await groupChatManager.chat(message + ' ###', (sentence) => {
          // New sentence received
          console.log(`[${agent.name} speaks]: ${sentence}`);
          // Apply character-specific speed
          const characterSpeeds: Record<string, number> = {
            'comedian': 1.5,
            'philosopher': 0.6,
            'scientist': 1.0
          }
          speakAndVisualize(sentence, agent.id, { steps: parseInt(ttsStepsSlider.value || '10'), speed: characterSpeeds[agent.id] || 1.0, seed: baseTurnSeed });

          // Update UI with partial text (optional, or just append)
          // Actually chat() returns full response at end, but we can update UI incrementally here if we want.
          // But the chat() implementation we wrote accumulates internal buffer.
          // For now, let's just let chat() finish for the full text return or update span incrementally.
          // Since we get 'sentence', it's easier to append sentences.
          // But we missed the punctuation in the sentence callback (GroupChatManager logic: "We keep the delimiter").
          // So we can visually append the sentence.
          if (!fullResponse) contentSpan.textContent = ""; // clear ...
          fullResponse += sentence + " ";
          contentSpan.textContent = fullResponse;
          chatLog.scrollTop = chatLog.scrollHeight;
        }, { seed: baseTurnSeed });

        // Wait for audio to finish playing this turn
        await speechQueue.waitUntilFinished();

        updateNextAgentUI();

      } catch (error) {
        console.error('Error:', error)
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
      if (improvSceneManager && improvSceneManager.isSceneRunning && improvSceneManager.isSceneRunning()) {
        try { improvSceneManager.stop() } catch (err) { console.warn('Failed to stop improvSceneManager:', err) }
      }

      updateNextAgentUI()
    })

    improvModeBtn.addEventListener('click', () => {
      improvModeBtn.classList.add('active')
      chatModeBtn.classList.remove('active')
      chatModeControls.style.display = 'none'
      improvModeControls.style.display = 'block'
      // Show a persistent 'Return to Chat' floating button so users can easily switch back
      const existing = document.getElementById('return-to-chat-btn') as HTMLButtonElement | null
      if (existing) existing.style.display = 'block'
    })

    // Floating 'Return to Chat' button to aid recovery from Improv-only view
    const returnBtn = document.createElement('button') as HTMLButtonElement
    returnBtn.id = 'return-to-chat-btn'
    returnBtn.textContent = 'Return to Chat'
    returnBtn.title = 'Switch back to Chat Mode'
    returnBtn.style.position = 'fixed'
    returnBtn.style.left = '16px'
    returnBtn.style.bottom = '16px'
    returnBtn.style.zIndex = '9999'
    returnBtn.style.background = '#4ecdc4'
    returnBtn.style.color = '#0f0f23'
    returnBtn.style.border = 'none'
    returnBtn.style.padding = '10px 12px'
    returnBtn.style.borderRadius = '8px'
    returnBtn.style.cursor = 'pointer'
    returnBtn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.3)'
    returnBtn.style.display = 'none'
    document.body.appendChild(returnBtn)

    returnBtn.addEventListener('click', () => {
      // Simulate clicking the chat mode button to ensure consistent UI state
      chatModeBtn.click()
      returnBtn.style.display = 'none'
    })

    // Hide the floating button when switching back to Chat
    chatModeBtn.addEventListener('click', () => {
      chatModeBtn.classList.add('active')
      improvModeBtn.classList.remove('active')
      chatModeControls.style.display = 'flex'
      improvModeControls.style.display = 'none'
      const existing = document.getElementById('return-to-chat-btn') as HTMLButtonElement | null
      if (existing) existing.style.display = 'none'
    })

    // Helper to calculate pacing for each turn (affects LLM token budget and TTS steps)
    const calculatePacing = () => {
      const roll = Math.random();
      // 30% Chance: "The One-Liner"
      if (roll > 0.7) {
        return {
          type: 'punchline',
          // SAFETY NET ONLY: Allow enough space for a full sentence
          maxTokens: 60,
          ttsSteps: 25,
          // THE REAL FIX: Explicit instruction for brevity
          promptSuffix: ' (Reply with a single, joking sentence. Be very brief.)'
        }
        // 50% Chance: "The Standard"
      } else if (roll > 0.2) {
        return {
          type: 'standard',
          maxTokens: 150,
          ttsSteps: 16,
          promptSuffix: ' (Keep the conversation flowing. 1-2 sentences.)'
        }
        // 20% Chance: "The Rant"
      } else {
        return {
          type: 'rant',
          maxTokens: 256,
          ttsSteps: 8,
          promptSuffix: ' (Go on a funny, passionate rant. Be expressive!)'
        }
      }
    }

    // Improv mode controls

    let isImprovRunning = false
    const startImprovScene = async () => {
      if (!groupChatManager) {
        addMessage('System', 'No model loaded. Please select and load a model first.', '#ff6b6b')
        return
      }
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
      addMessage('System', `鹿 Starting improv scene: "${title}"`, '#4ecdc4')
      addMessage('System', description, '#4ecdc4')

      try {
        // Start our own Director loop rather than using ImprovSceneManager's
        // Reset conversation history and start with a seed line
        isImprovRunning = true
        groupChatManager.resetConversation()

        if (groupChatManager.getHistoryLength() === 0) {
          const seed = title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?'
          addMessage('Director', `Action! "${seed}"`, '#888')
          await processTurn(seed)
        }

        // Continue loop until stopped
        while (isImprovRunning) {
          await new Promise(r => setTimeout(r, 800))
          if (!isImprovRunning) break

          // FINE TUNING 4: Escalation from the Director, influenced by chaos slider
          const turnCount = groupChatManager.getHistoryLength()
          const chaosLevel = parseInt(chaosSlider.value)
          let prompt = '(Reply naturally to the last thing said)'
          if (turnCount % 3 === 0 && Math.random() * 100 < chaosLevel) {
            prompt = '(Suddenly, a physical disaster happens. React with panic and crass humor!)'
          } else if (turnCount % 4 === 0 && Math.random() * 100 < chaosLevel) {
            prompt = '(Make a highbrow reference to history that completely misses the point.)'
          }

          await processTurn(prompt)
        }

        // Wait for final audio to finish
        await speechQueue.waitUntilFinished()

      } catch (error) {
        console.error('Error running improv scene:', error)
        addMessage('System', 'Error running improv scene', '#ff0000')
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
      if (improvSceneManager && improvSceneManager.isSceneRunning && improvSceneManager.isSceneRunning()) {
        try { improvSceneManager.stop() } catch (err) { console.warn('Failed to stop improvSceneManager:', err) }
      }
      addMessage('System', '鹿 Scene stopped by user', '#ff6b6b')
      sceneTitleInput.disabled = false
      sceneDescriptionInput.disabled = false
      startImprovBtn.style.display = 'inline-block'
      stopImprovBtn.style.display = 'none'
    }

    // Director logic: process a single turn with pacing and TTS steps
    const processTurn = async (inputText: string) => {
      if (!groupChatManager) {
        console.warn('processTurn called with no groupChatManager')
        isImprovRunning = false
        return
      }
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

        await groupChatManager.chat(effectivePrompt, (sentence) => {
          // 3. Pass ttsSteps to speak
          speakAndVisualize(sentence, agent.id, { steps: pacing.ttsSteps, speed: characterSpeeds[agent.id] || 1.0, seed: turnSeed })

          contentSpan.textContent = contentSpan.textContent === '...' ? sentence + ' ' : contentSpan.textContent + sentence + ' '
          chatLog.scrollTop = chatLog.scrollHeight
        }, { maxTokens: pacing.maxTokens, seed: turnSeed })

        await speechQueue.waitUntilFinished()
        updateNextAgentUI()

      } catch (error) {
        console.error('Turn Error:', error)
        isImprovRunning = false
        // stopImprovLoop equivalent
      }
    }

    startImprovBtn.addEventListener('click', startImprovScene)
    stopImprovBtn.addEventListener('click', stopImprovScene)

    userInput.focus()
  } catch (error: any) {
    console.error('Initialization error:', error)

    let errorMessage = 'Error initializing App. Please check console.'
    const errorStr = String(error)

    if (errorStr.includes('WebGL') || errorStr.includes('GPU') || errorStr.includes('gl_')) {
      errorMessage = 'Hardware Acceleration is disabled or unavailable. This application requires a GPU to run the 3D visualizer and AI models. Please enable graphics acceleration in your browser settings.'
    }

    statusText.textContent = errorMessage
    statusText.style.color = '#ff6b6b'
  }
}

initApp()
