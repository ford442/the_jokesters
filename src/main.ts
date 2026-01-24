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
import { AgentModelManager } from './AgentModelManager'
import type { AgentModelMapping } from './AgentModelManager'

// --- Custom Model Configurations ---
// 1. User's custom Vicuna model (7B)
const customVicunaModelConfig = {
  model_id: "ford442/vicuna-7b-q4f32-webllm",
  model: "https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/",
  // This WASM file is assumed to be the correct library for the model architecture
  model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm",
  vram_required_MB: 4096,
  low_resource_required: false,
  model_type: 'llm',
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
const smallModelId = 'Qwen2-0.5B-Instruct-q4f16_1-MLC';

// 4. Snowflake embedding model (for vector/embedding tasks)
const snowflakeEmbedModelConfig = {
  model_id: 'snowflake-arctic-embed-s-q0f32-MLC-b4',
  model: 'https://huggingface.co/mlc-ai/snowflake-arctic-embed-s-q0f32-MLC/resolve/main/',
  // Prebuilt WASM runtime for the Snowflake embedding model (hosted by mlc-ai libs)
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/snowflake-arctic-embed-s-q0f32-ctx512_cs512_batch4-webgpu.wasm',
  vram_required_MB: 238.71,
  // Use a simple string type here to avoid coupling to an enum that may not be present at runtime
  model_type: 'embedding',
};

// Phi-3.5 Vision instruct (q4f16)
const phi35VisionQ4f16Config = {
  model_id: 'Phi-3.5-vision-instruct-q4f16_1-MLC',
  model: 'https://huggingface.co/mlc-ai/Phi-3.5-vision-instruct-q4f16_1-MLC/resolve/main/',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Phi-3.5-vision-instruct-q4f16_1-ctx4k_cs2k-webgpu.wasm',
  vram_required_MB: 3952.18,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'vlm',
};

// Phi-3.5 Vision instruct (q4f32)
const phi35VisionQ4f32Config = {
  model_id: 'Phi-3.5-vision-instruct-q4f32_1-MLC',
  model: 'https://huggingface.co/mlc-ai/Phi-3.5-vision-instruct-q4f32_1-MLC/resolve/main/',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Phi-3.5-vision-instruct-q4f32_1-ctx4k_cs2k-webgpu.wasm',
  vram_required_MB: 5879.84,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'vlm',
};

// SmolLM2 small instruct model
const smolLM2Config = {
  model_id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
  model: 'https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f32_1-MLC/resolve/main/',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/SmolLM2-360M-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm',
  vram_required_MB: 579.61,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'llm',
};

// Set Vicuna 7B as the default model
const defaultModelId = customVicunaModelConfig.model_id;

// IMPORTANT: Ensure the default Hermes model also uses the /resolve/main/ URL pattern to point to raw files
// instead of the HTML repo page. This overrides the default internal config in WebLLM if present.
const hermesModelConfig = {
  model_id: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
  model: 'https://huggingface.co/mlc-ai/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/resolve/main/',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm',
  vram_required_MB: 2951.51,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'llm',
}

// Helper: apply the custom model configurations to a given engine module
const applyModelConfigsToEngine = (engine: any) => {
  if (!engine || !(engine as any).prebuiltAppConfig || !Array.isArray((engine as any).prebuiltAppConfig.model_list)) {
    console.warn('Engine does not expose a prebuiltAppConfig.model_list; skipping model injection for this engine')
    return
  }

  const list = (engine as any).prebuiltAppConfig.model_list

  // Inject/Update the default Hermes model
  const existingHermes = list.findIndex((m: any) => m.model_id === hermesModelConfig.model_id)
  if (existingHermes !== -1) {
    list[existingHermes] = hermesModelConfig as any
  } else {
    list.push(hermesModelConfig as any)
  }

  // Inject the custom model into the engine's configuration list
  if (!list.find((m: any) => m.model_id === customVicunaModelConfig.model_id)) {
    list.push(customVicunaModelConfig as any)
  }

  // Inject Llama2b for local testing if not present
  if (!list.find((m: any) => m.model_id === llama2bModelConfig.model_id)) {
    list.push(llama2bModelConfig as any)
  }

  // Register Snowflake embedding model so it's discoverable in the UI
  if (!list.find((m: any) => m.model_id === snowflakeEmbedModelConfig.model_id)) {
    list.push(snowflakeEmbedModelConfig as any)
  }

  // Phi-3.5 Vision instruct (q4f16)
  if (!list.find((m: any) => m.model_id === phi35VisionQ4f16Config.model_id)) {
    list.push(phi35VisionQ4f16Config as any)
  }

  // Phi-3.5 Vision instruct (q4f32)
  if (!list.find((m: any) => m.model_id === phi35VisionQ4f32Config.model_id)) {
    list.push(phi35VisionQ4f32Config as any)
  }

  // SmolLM2 small instruct model
  if (!list.find((m: any) => m.model_id === smolLM2Config.model_id)) {
    list.push(smolLM2Config as any)
  }

  console.log('Available prebuilt models (including custom):', list.map((m: any) => m.model_id))
}

// Apply configs to the default imported engine (webllm)
applyModelConfigsToEngine(webllm)

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

// Default model mappings (variety pack for 6GB+ GPUs)
const defaultAgentModelMappings: AgentModelMapping[] = [
  { agentId: 'comedian', modelId: 'SmolLM2-360M-Instruct-q4f32_1-MLC' },      // 580MB - chaotic
  { agentId: 'philosopher', modelId: smallModelId },                          // 500MB - odd
  { agentId: 'scientist', modelId: defaultModelId },                          // 3GB - verbose
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
        <p id="status">Initializing model engine...</p>
        <div id="model-error" style="color:#ff6b6b;margin-top:6px;display:none;white-space:pre-wrap;"></div>
        <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
          <label style="color:#888; font-size:0.9em; white-space:nowrap;">Engine</label>
          <select id="engine-select" style="width:140px; background:#0f3460; border:1px solid #444; color:white; padding:2px 5px;">
            <option value="webllm">WebLLM</option>
            <option value="chatllm" selected>ChatLLM</option>
          </select>

          <label style="color:#888; font-size:0.9em; white-space:nowrap; margin-left:8px;">LLM Model</label>
          <select id="model-select" style="flex:1; background:#0f3460; border:1px solid #444; color:white; padding:2px 5px;"></select>
          <button id="load-model-btn" style="margin-left:8px; padding:6px 10px;">Load Model</button>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px; align-items:center;">
          <label style="display:flex; align-items:center; gap:6px; color:#888; font-size:0.85em; cursor:pointer;">
            <input type="checkbox" id="auto-load-vicuna" style="cursor:pointer;" checked>
            <span>Auto-load Vicuna 7B for Improv at startup</span>
          </label>
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
            
            <div class="model-assignment-panel" style="margin-top: 15px; padding: 10px; background: #1a1a2e; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label style="color: #4ecdc4; font-size: 0.9em; font-weight: bold;">🎭 Agent Model Assignment</label>
                <button id="toggle-model-assignment" style="background: transparent; border: 1px solid #4ecdc4; color: #4ecdc4; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">Show</button>
              </div>
              <div id="model-assignment-content" style="display: none;">
                <div class="assignment-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                  <label style="color: #ff6b6b; font-size: 0.85em; width: 100px;">🔴 Comedian:</label>
                  <select id="model-comedian" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px; font-size: 0.85em;"></select>
                  <span class="vram-badge" data-agent="comedian" style="color: #888; font-size: 0.75em; white-space: nowrap;">0 MB</span>
                </div>
                <div class="assignment-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                  <label style="color: #4ecdc4; font-size: 0.85em; width: 100px;">🟢 Philosopher:</label>
                  <select id="model-philosopher" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px; font-size: 0.85em;"></select>
                  <span class="vram-badge" data-agent="philosopher" style="color: #888; font-size: 0.75em; white-space: nowrap;">0 MB</span>
                </div>
                <div class="assignment-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                  <label style="color: #45b7d1; font-size: 0.85em; width: 100px;">🔵 Scientist:</label>
                  <select id="model-scientist" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px; font-size: 0.85em;"></select>
                  <span class="vram-badge" data-agent="scientist" style="color: #888; font-size: 0.75em; white-space: nowrap;">0 MB</span>
                </div>
                <div style="margin-top: 10px; padding: 8px; background: #0f3460; border-radius: 4px; border-left: 3px solid #4ecdc4;">
                  <div style="font-size: 0.8em; color: #888;">Current Model: <span id="current-model-display" style="color: #4ecdc4;">None</span></div>
                  <div style="font-size: 0.8em; color: #888;">Estimated VRAM: <span id="current-vram-display" style="color: #4ecdc4;">0</span> MB</div>
                </div>
                <div style="margin-top: 8px; padding: 6px; background: #16213e; border-radius: 4px; font-size: 0.75em; color: #888;">
                  💡 Models swap automatically per turn. Only one loaded at a time.
                </div>
              </div>
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
              placeholder="Type a message (load a model to enable)..."
              autocomplete="off"
              disabled
            />
            <button id="send-btn" disabled>Send</button>
          </div>
          
          <div id="improv-mode-controls" class="improv-controls">
            <div class="input-group">
              <input 
                type="text" 
                id="scene-title" 
                placeholder="Scene title (e.g., 'At the Coffee Shop')..."
                autocomplete="off"
                disabled
              />
            </div>
            <div class="input-group">
              <textarea 
                id="scene-description" 
                placeholder="Scene description (e.g., 'Three friends meet at a coffee shop and discuss their latest adventures')..."
                rows="3"
                autocomplete="off"
                disabled
              ></textarea>
            </div>
            <div class="improv-buttons">
              <button id="start-improv-btn" class="primary-btn" disabled>Start Scene</button>
              <button id="stop-improv-btn" class="secondary-btn" style="display: none;" disabled>Stop Scene</button>
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
  // Improv controls
  const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
  const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
  const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
  const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement
  const modelErrorDiv = document.getElementById('model-error') as HTMLDivElement | null

  // NEW: Get reference to the model selection box - DECLARATIONS MOVED UP HERE
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
  const modelSelectMain = document.getElementById('model-select-main') as HTMLSelectElement | null;
  const autoLoadVicunaCheckbox = document.getElementById('auto-load-vicuna') as HTMLInputElement;

  // Refactor: Define managers using 'let' so they can be re-assigned on model change
  let groupChatManager: GroupChatManager;
  let improvSceneManager: ImprovSceneManager;
  let agentModelManager: AgentModelManager;
  let audioEngine: AudioEngine;
  let speechQueue: SpeechQueue;
  let stage: Stage;
  let lipSync: LipSync;
  let audioInitializing = false;

  // Active engine module state
  let activeEngineModule: any = webllm;
  const engineModules: Record<string, any> = { webllm };

  // Populate model selects for a given engine (MOVED INSIDE INITAPP)
  const populateModelSelect = (engine: any) => {
    const models = (engine && engine.prebuiltAppConfig && Array.isArray(engine.prebuiltAppConfig.model_list)) ? engine.prebuiltAppConfig.model_list : []

    // Clear existing options
    modelSelect.innerHTML = ''
    if (modelSelectMain) modelSelectMain.innerHTML = ''

    models.forEach((m: any) => {
      const option = document.createElement('option')
      option.value = m.model_id
      option.textContent = m.model_id
      modelSelect.appendChild(option)
      if (modelSelectMain) {
        const opt2 = option.cloneNode(true) as HTMLOptionElement
        modelSelectMain.appendChild(opt2)
      }
    })
  }

  // Compute curated available models from a given engine (MOVED INSIDE INITAPP)
  const getAvailableModels = (engine: any) => {
    const list = (engine && engine.prebuiltAppConfig && Array.isArray(engine.prebuiltAppConfig.model_list)) ? engine.prebuiltAppConfig.model_list : []
    return [
      defaultModelId,
      llama2bModelConfig.model_id,
      customVicunaModelConfig.model_id,
      smallModelId,
      snowflakeEmbedModelConfig.model_id,
      // Newly added models
      phi35VisionQ4f16Config.model_id,
      phi35VisionQ4f32Config.model_id,
      smolLM2Config.model_id,
    ].filter(id => list.some((m: any) => m.model_id === id));
  }

  // Update next agent info in the UI
  const updateNextAgentUI = () => {
    if (!groupChatManager) return
    const nextAgent = groupChatManager.getCurrentAgent()
    nextAgentSpan.textContent = nextAgent.name
    nextAgentSpan.style.color = nextAgent.color
  }

  // Update current model display in UI
  const updateCurrentModelDisplay = () => {
    if (!agentModelManager) return
    
    const currentModel = agentModelManager.getCurrentModel()
    const currentModelSpan = document.getElementById('current-model-display')
    const currentVramSpan = document.getElementById('current-vram-display')
    
    if (currentModelSpan && currentModel) {
      // Shorten model name for display
      const shortName = currentModel.split('/').pop() || currentModel
      currentModelSpan.textContent = shortName
    }
    
    if (currentVramSpan && currentModel) {
      const modelInfo = (activeEngineModule && activeEngineModule.prebuiltAppConfig && Array.isArray(activeEngineModule.prebuiltAppConfig.model_list)) ? activeEngineModule.prebuiltAppConfig.model_list.find((m: any) => m.model_id === currentModel) : undefined
      const vram = modelInfo?.vram_required_MB || 0
      currentVramSpan.textContent = Math.round(vram).toString()
      
      // Color code by VRAM usage
      if (vram < 1000) {
        currentVramSpan.style.color = '#4ecdc4' // Green
      } else if (vram < 3000) {
        currentVramSpan.style.color = '#ffd700' // Yellow
      } else {
        currentVramSpan.style.color = '#ff6b6b' // Red
      }
    }
  }

  // Update VRAM badge for an agent's dropdown
  const updateVRAMBadge = (agentId: string, modelId: string) => {
    const badge = document.querySelector(`[data-agent="${agentId}"]`)
    if (!badge) return
    
    const list = (activeEngineModule && activeEngineModule.prebuiltAppConfig && Array.isArray(activeEngineModule.prebuiltAppConfig.model_list)) ? activeEngineModule.prebuiltAppConfig.model_list : []
    const modelInfo = list.find((m: any) => m.model_id === modelId)
    const vram = modelInfo?.vram_required_MB || 0
    badge.textContent = `${Math.round(vram)} MB`
    
    // Color code
    if (vram < 1000) {
      (badge as HTMLElement).style.color = '#4ecdc4'
    } else if (vram < 3000) {
      (badge as HTMLElement).style.color = '#ffd700'
    } else {
      (badge as HTMLElement).style.color = '#ff6b6b'
    }
  }

  const profanityLevels: { level: ProfanityLevel; label: string; color: string }[] = [
    { level: 'PG', label: '他 PG', color: '#4ecdc4' },
    { level: 'CASUAL', label: ' Casual', color: '#45b7d1' },
    { level: 'GRITTY', label: '櫨 Gritty', color: '#ffd700' },
    { level: 'UNCENSORED', label: '逐 Uncensored', color: '#ff6b6b' },
  ]
  
  // NEW: Function to handle LLM/Manager initialization and re-initialization
  const initializeManagers = async (modelId: string, engineModule: any) => {
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

    // 3. Initialize the chat manager with progress callback, passing the new modelId and selected engine module
    statusText.textContent = `Initializing model: ${modelId}...`
    await groupChatManager.initialize(modelId, (progress: any) => {
      const percentage = Math.round(progress.progress * 100)
      progressBar.style.width = `${percentage}%`
      statusText.textContent = progress.text
    }, engineModule)

    // 4. Initialize AgentModelManager
    agentModelManager = new AgentModelManager(
      groupChatManager,
      defaultAgentModelMappings,
      (progress) => {
        statusText.textContent = `Swapping model: ${progress.text}`
      }
    )

    // Re-apply settings to the new manager instance
    const idx = parseInt(profanitySlider.value)
    const { level } = profanityLevels[idx]
    groupChatManager.setProfanityLevel(level)

    // Hide loading, show chat and restore interactions
    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'
    if (chatContainer) {
      chatContainer.style.opacity = '1'
      chatContainer.style.pointerEvents = 'auto'
    }
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
    // Populate model select dropdown from the active engine module
    populateModelSelect(activeEngineModule)

    // Set the initial available models based on the default engine (webllm)
    const availableModels = getAvailableModels(activeEngineModule)

    // Set the initial default model (use equality to avoid accidental undefined.includes calls)
    const initialDefaultModel = availableModels.find(id => id === defaultModelId) || availableModels[0];

    // Set the default model in the dropdown
    if (initialDefaultModel) {
      modelSelect.value = initialDefaultModel;
      if (modelSelectMain) modelSelectMain.value = initialDefaultModel;
    }
    
    // Populate agent model assignment dropdowns
    const agentIds = ['comedian', 'philosopher', 'scientist']
    agentIds.forEach(agentId => {
      const select = document.getElementById(`model-${agentId}`) as HTMLSelectElement
      if (!select) return
      
      availableModels.forEach(modelId => {
        // Only show LLM models (exclude embedding/vision models)
        
        const option = document.createElement('option')
        option.value = modelId
        option.textContent = modelId
        select.appendChild(option)
      })
      
      // Set default values from mappings
      const defaultMapping = defaultAgentModelMappings.find(m => m.agentId === agentId)
      if (defaultMapping) {
        select.value = defaultMapping.modelId
        updateVRAMBadge(agentId, defaultMapping.modelId)
      }
      
      // Update on change
      select.addEventListener('change', () => {
        if (agentModelManager) {
          agentModelManager.setModelForAgent(agentId, select.value)
          updateVRAMBadge(agentId, select.value)
          addMessage('System', `${agentId} will use ${select.value} on next turn`, '#4ecdc4')
        }
      })
    })

    // Toggle model assignment panel
    const toggleBtn = document.getElementById('toggle-model-assignment')
    const content = document.getElementById('model-assignment-content')
    if (toggleBtn && content) {
      toggleBtn.addEventListener('click', () => {
        if (content.style.display === 'none') {
          content.style.display = 'block'
          toggleBtn.textContent = 'Hide'
        } else {
          content.style.display = 'none'
          toggleBtn.textContent = 'Show'
        }
      })
    }
    
    // Engine selection UI
    const engineSelect = document.getElementById('engine-select') as HTMLSelectElement | null;

    // Attempt to dynamically load engine modules when selected and repopulate models
    if (engineSelect) {
      engineSelect.addEventListener('change', async () => {
        const selected = engineSelect.value
        statusText.textContent = `Switching engine to ${selected}...`
        statusText.style.color = ''

        try {
          if (engineModules[selected]) {
            activeEngineModule = engineModules[selected]
          } else {
            // Try to dynamically import known modules. You can extend this mapping later.
            if (selected === 'chatllm') {
              // ALIAS TO WEBLLM as ChatLLM package is unavailable
              // const mod = await import('@mlc-ai/chat-llm') // REMOVED
              console.log('ChatLLM selected: using WebLLM engine alias')
              const mod = webllm; // Alias
              engineModules['chatllm'] = mod
              activeEngineModule = mod
            } else if (selected === 'webllm') {
              activeEngineModule = webllm
              engineModules['webllm'] = webllm
            } else {
              throw new Error(`Unknown engine: ${selected}`)
            }
          }

          // Apply our custom model configs to the newly selected engine (if it supports prebuiltAppConfig)
          applyModelConfigsToEngine(activeEngineModule)

          // Recompute available models and populate selects
          const newModels = getAvailableModels(activeEngineModule)
          populateModelSelect(activeEngineModule)
          if (newModels.length) {
            modelSelect.value = newModels[0]
            if (modelSelectMain) modelSelectMain.value = newModels[0]
          }

          statusText.textContent = `Engine switched to ${selected}. Select a model and click "Load Model".`
        } catch (err) {
          console.error('Failed to switch engine:', err)
          statusText.textContent = `Failed to switch engine to ${selected}. See console.`
          statusText.style.color = '#ff6b6b'
          // Revert to webllm
          engineSelect.value = 'webllm'
          activeEngineModule = webllm
        }
      })
    }

    // Load auto-load preference from localStorage
    const AUTO_LOAD_KEY = 'jokesters-auto-load-vicuna';
    const AUTO_LOAD_DELAY_MS = 500; // Delay before triggering auto-load to ensure UI is ready
    
    // Helper function to extract a friendly model name from model_id
    const getModelDisplayName = (modelId: string): string => {
      return modelId.split('/').pop() || modelId || 'Unknown Model';
    };
    
    const savedAutoLoad = localStorage.getItem(AUTO_LOAD_KEY);
    if (savedAutoLoad === 'true') {
      autoLoadVicunaCheckbox.checked = true;
    }
    
    // Save preference when checkbox changes
    autoLoadVicunaCheckbox.addEventListener('change', () => {
      localStorage.setItem(AUTO_LOAD_KEY, autoLoadVicunaCheckbox.checked ? 'true' : 'false');
      const modelName = getModelDisplayName(customVicunaModelConfig.model_id);
      if (autoLoadVicunaCheckbox.checked) {
        statusText.textContent = `${modelName} will auto-load at next startup. Click "Load Model" now to load it immediately.`;
        statusText.style.color = ''; // Reset to default color
      } else {
        statusText.textContent = 'Select a model and click "Load Model" to begin.';
        statusText.style.color = ''; // Reset to default color
      }
    });
    
    // Auto-load Vicuna 7B if option is enabled
    if (autoLoadVicunaCheckbox.checked) {
      // Verify that Vicuna model is available before attempting to auto-load
      const vicunaModelId = customVicunaModelConfig.model_id;
      // Re-calculate available models since getAvailableModels depends on activeEngineModule which might have changed (though unlikely at startup)
      const currentAvailable = getAvailableModels(activeEngineModule);
      const isVicunaAvailable = currentAvailable.includes(vicunaModelId);
      
      if (isVicunaAvailable) {
        // Set Vicuna as the selected model
        modelSelect.value = vicunaModelId;
        if (modelSelectMain) modelSelectMain.value = vicunaModelId;
        
        const modelName = getModelDisplayName(vicunaModelId);
        statusText.textContent = `Auto-loading ${modelName} for Improv...`;
        statusText.style.color = ''; // Reset to default color
        
        // Trigger model load after a short delay to ensure UI is ready
        // Note: Errors from the actual model loading happen in the button's event handler
        setTimeout(() => {
          loadModelBtn.click();
        }, AUTO_LOAD_DELAY_MS);
      } else {
        // Vicuna model not available, disable auto-load and inform user
        console.warn('Vicuna model not available in model list, disabling auto-load');
        autoLoadVicunaCheckbox.checked = false;
        localStorage.setItem(AUTO_LOAD_KEY, 'false');
        statusText.textContent = 'Vicuna model not available. Auto-load disabled. Select a model and click "Load Model" to begin.';
        statusText.style.color = '#ff6b6b';
      }
    } else {
      // Do NOT auto-load any model. The user must click "Load Model" to initialize.
      statusText.textContent = 'Select a model and click "Load Model" to begin.';
      statusText.style.color = ''; // Reset to default color
    }
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
        const newModelId = (modelSelect.value || '').toString();

        // Basic validation: ensure a model id was selected
        if (!newModelId) {
          const friendly = `No model selected. Please select a model from the dropdown before clicking Load Model.`
          statusText.textContent = friendly
          statusText.style.color = '#ff6b6b'
          if (modelErrorDiv) { modelErrorDiv.textContent = friendly; modelErrorDiv.style.display = 'block' }
          if (modelSelect) modelSelect.disabled = false
          if (loadModelBtn) loadModelBtn.disabled = false
          return
        }

        // Look up the model metadata so we can provide clearer diagnostics if fields are missing
        const list = (activeEngineModule && activeEngineModule.prebuiltAppConfig && Array.isArray(activeEngineModule.prebuiltAppConfig.model_list)) ? activeEngineModule.prebuiltAppConfig.model_list : []
        const modelInfo = list.find((m: any) => m.model_id === newModelId)
        if (!modelInfo) {
          const friendly = `Model '${newModelId}' was not found in the selected engine's prebuilt model list. Ensure it's been registered in the app config.`
          console.error(friendly)
          statusText.textContent = friendly
          statusText.style.color = '#ff6b6b'
          if (modelErrorDiv) { modelErrorDiv.textContent = friendly; modelErrorDiv.style.display = 'block' }
          if (modelSelect) modelSelect.disabled = false
          if (loadModelBtn) loadModelBtn.disabled = false
          return
        }

        // Stop improv if running
        if (isImprovRunning) stopImprovScene();

        // Do not hide the chat panel — instead dim and disable interactions during model loading
        if (chatContainer) {
          chatContainer.style.opacity = '0.6';
          chatContainer.style.pointerEvents = 'none';
        }
        loadingDiv.style.display = 'flex';
        chatLog.innerHTML = '';

        try {
          const modelInfo = webllm.prebuiltAppConfig.model_list.find((m: any) => m.model_id === newModelId)

          // Prevent loading non-chat-capable models (e.g., embeddings or VLMs) into the Chat flow
          const modelType = (modelInfo?.model_type || '').toString().toLowerCase()
          const allowedChatTypes = ['llm', 'chat']
          if (modelType && !allowedChatTypes.includes(modelType)) {
            const friendly = `Model '${newModelId}' is type '${modelType}' and cannot be used for Chat. Please select an LLM/chat-capable model.`
            console.warn(friendly)
            statusText.textContent = friendly
            statusText.style.color = '#ff6b6b'
            if (modelErrorDiv) { modelErrorDiv.textContent = friendly; modelErrorDiv.style.display = 'block' }
            if (modelSelect) modelSelect.disabled = false
            if (loadModelBtn) loadModelBtn.disabled = false
            return
          }

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
          await initializeManagers(newModelId, activeEngineModule)
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
          // Restore chat panel visibility and interactions after a failed load
          if (chatContainer) {
            chatContainer.style.opacity = '1'
            chatContainer.style.pointerEvents = 'auto'
          }
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
      
      // 🔥 NEW: Ensure correct model before processing
      const currentAgentId = groupChatManager.getCurrentAgent().id
      if (agentModelManager) {
        await agentModelManager.ensureModelForAgent(currentAgentId)
        updateCurrentModelDisplay()
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
      // Keep improv controls visible (disabled until a model is loaded) so users can prepare scenes before load
      improvModeControls.style.display = 'block'

      // Stop improv if running
      if (improvSceneManager && improvSceneManager.isSceneRunning && improvSceneManager.isSceneRunning()) {
        try { improvSceneManager.stop() } catch (err) { console.warn('Failed to stop improvSceneManager:', err) }
      }

      updateNextAgentUI()
    })

    improvModeBtn.addEventListener('click', () => {
      improvModeBtn.classList.add('active')
      chatModeBtn.classList.remove('active')
      // Keep both control panels visible so users can access chat while in Improv mode
      chatModeControls.style.display = 'flex'
      improvModeControls.style.display = 'block'
      // Show the floating 'Return to Chat' button as an optional quick-switch
      const existing = document.getElementById('return-to-chat-btn') as HTMLButtonElement | null
      if (existing) existing.style.display = 'block'
    })

    // Floating 'Return to Chat' button to aid quick switching
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

    // Floating 'Stop Scene' button that appears when a scene is running and hides the right controls
    const floatingStopBtn = document.createElement('button') as HTMLButtonElement
    floatingStopBtn.id = 'floating-stop-improv-btn'
    floatingStopBtn.textContent = 'Stop Scene'
    floatingStopBtn.title = 'Stop the running scene and restore controls'
    floatingStopBtn.style.position = 'fixed'
    floatingStopBtn.style.right = '16px'
    floatingStopBtn.style.bottom = '16px'
    floatingStopBtn.style.zIndex = '9999'
    floatingStopBtn.style.background = '#ff6b6b'
    floatingStopBtn.style.color = '#ffffff'
    floatingStopBtn.style.border = 'none'
    floatingStopBtn.style.padding = '10px 12px'
    floatingStopBtn.style.borderRadius = '8px'
    floatingStopBtn.style.cursor = 'pointer'
    floatingStopBtn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.3)'
    floatingStopBtn.style.display = 'none'
    document.body.appendChild(floatingStopBtn)

    returnBtn.addEventListener('click', () => {
      // Simulate clicking the chat mode button to ensure consistent UI state
      chatModeBtn.click()
      returnBtn.style.display = 'none'
    })

    // Ensure both panels remain visible when switching back to Chat
    chatModeBtn.addEventListener('click', () => {
      chatModeBtn.classList.add('active')
      improvModeBtn.classList.remove('active')
      chatModeControls.style.display = 'flex'
      improvModeControls.style.display = 'block'
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

      // Disable inputs (do NOT hide them)
      sceneTitleInput.disabled = true
      sceneDescriptionInput.disabled = true
      // Only hide the start button as it doesn't make sense to start again
      startImprovBtn.style.display = 'none'
      stopImprovBtn.style.display = 'inline-block'

      // Clear chat log for new scene
      addMessage('System', `鹿 Starting improv scene: "${title}"`, '#4ecdc4')
      addMessage('System', description, '#4ecdc4')

      // Keep controls visible during scenes per user preference
      const floatingStop = document.getElementById('floating-stop-improv-btn') as HTMLButtonElement | null
      if (floatingStop) floatingStop.style.display = 'none'

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

      // Controls remain visible (no-op). Ensure floating stop button is hidden
      const floatingStop2 = document.getElementById('floating-stop-improv-btn') as HTMLButtonElement | null
      if (floatingStop2) floatingStop2.style.display = 'none'
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

      // Controls remain visible; just ensure floating stop button is hidden
      const floatingStop = document.getElementById('floating-stop-improv-btn') as HTMLButtonElement | null
      if (floatingStop) floatingStop.style.display = 'none'
    }

    // Director logic: process a single turn with pacing and TTS steps
    const processTurn = async (inputText: string) => {
      if (!groupChatManager) {
        console.warn('processTurn called with no groupChatManager')
        isImprovRunning = false
        return
      }
      try {
        // 🔥 NEW: Ensure correct model is loaded for this agent
        const currentAgentId = groupChatManager.getCurrentAgent().id
        if (agentModelManager) {
          await agentModelManager.ensureModelForAgent(currentAgentId)
          updateCurrentModelDisplay() // Update UI
        }
        
        // 1. Calculate Pacing for this specific turn
        const pacing = calculatePacing()
        console.log(`[Director] Pacing: ${pacing.type} (Tokens: ${pacing.maxTokens}, Steps: ${pacing.ttsSteps})`)

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

    // Hook up the floating stop button (appears when controls are hidden during a running scene)
    const floatingStopBtnEl = document.getElementById('floating-stop-improv-btn') as HTMLButtonElement | null
    if (floatingStopBtnEl) {
      floatingStopBtnEl.addEventListener('click', () => {
        stopImprovScene()
      })
    }

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
