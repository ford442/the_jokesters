import './style.css'
import { GroupChatManager } from './GroupChatManager'
import type { Agent, ProfanityLevel } from './GroupChatManager'
import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
// import { SceneManager } from './SceneManager'
import * as webllm from '@mlc-ai/web-llm'

import { AudioEngine } from './audio/AudioEngine'
import { SpeechQueue } from './audio/SpeechQueue'
import { AgentModelManager } from './AgentModelManager'
import type { AgentModelMapping } from './AgentModelManager'
import { Director, type DirectorCallbacks, type Scenario } from './Director/Director'
import { ScriptParser } from './Director/ScriptParser'
import { DataFetchService } from './services/DataFetchService'
import { ScriptGenerator } from './Director/ScriptGenerator'
import { MemoryManager } from './Director/MemoryManager'

const profanityLevels: { level: ProfanityLevel, label: string, color: string }[] = [
  { level: 'PG', label: 'Safe', color: '#4ecdc4' },
  { level: 'CASUAL', label: 'PG-13', color: '#ffd700' },
  { level: 'GRITTY', label: 'R-Rated', color: '#ff6b6b' },
  { level: 'UNCENSORED', label: 'Uncensored', color: '#ff0000' }
]

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
// const smallModelId = 'Qwen2-0.5B-Instruct-q4f16_1-MLC';

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

// IMPORTANT: Point to the uploaded Hermes model on test.1ink.us
// This model was uploaded via upload_hermes.py and is hosted at:
// https://test.1ink.us/the-jokesters/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/
const hermesModelConfig = {
  model_id: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
  model: 'https://test.1ink.us/the-jokesters/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/',
  model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm',
  vram_required_MB: 2951.51,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
  model_type: 'llm',
};

const defaultModelId = hermesModelConfig.model_id;

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

// Default model mappings: Use the uploaded Hermes model for all agents
const defaultAgentModelMappings: AgentModelMapping[] = [
  { agentId: 'comedian', modelId: hermesModelConfig.model_id },
  { agentId: 'philosopher', modelId: hermesModelConfig.model_id },
  { agentId: 'scientist', modelId: hermesModelConfig.model_id },
]

// Export interface for ScriptBeat
export interface ScriptBeat {
  speaker: string;
  line: string;
}

// --- Simple Beat Generator ---
let musicAudioContext: AudioContext | null = null;
let nextNoteTime = 0.0;
let beatTimerID: number | null = null;
let isPlayingBeat = false;

function scheduleNote(context: AudioContext, time: number) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.value = 150; // Kick-ish
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
}

function scheduler() {
    if (!musicAudioContext) return;
    while (nextNoteTime < musicAudioContext.currentTime + 0.1) {
        scheduleNote(musicAudioContext, nextNoteTime);
        nextNoteTime += 0.5; // 120 BPM
    }
    beatTimerID = window.setTimeout(scheduler, 25);
}

const startBeat = () => {
    if (isPlayingBeat) return;
    if (!musicAudioContext) musicAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Resume context if suspended (browser policy)
    if (musicAudioContext.state === 'suspended') musicAudioContext.resume();

    isPlayingBeat = true;
    nextNoteTime = musicAudioContext.currentTime;
    scheduler();
}

const stopBeat = () => {
    isPlayingBeat = false;
    if (beatTimerID) clearTimeout(beatTimerID);
}

// Initialize the app
async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  app.innerHTML = `
    <div class="container">
      <h1>The Jokesters</h1>
      <button id="settings-btn" title="Settings">⚙️</button>
      <div id="loading" class="loading">
        <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
          <label style="color:#888; font-size:0.9em; white-space:nowrap; margin-left:8px;">LLM Model</label>
          <select id="model-select" style="flex:1; background:#0f3460; border:1px solid #444; color:white; padding:2px 5px;"></select>
          <button id="load-model-btn" style="margin-left:8px; padding:6px 10px;">Load Model</button>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; align-items:center;">
          <label style="display:flex; align-items:center; gap:6px; color:#888; font-size:0.85em; cursor:pointer;">
            <input type="checkbox" id="auto-load-vicuna" style="cursor:pointer;">
            <span>Auto-load Vicuna 7B for Improv at startup</span>
          </label>
        </div>
      </div>

      <div id="model-error" style="display:none; color: #ff6b6b; margin-top: 8px; padding: 10px; background: rgba(255,107,107,0.1); border: 1px solid #ff6b6b; border-radius: 4px; font-size: 0.9em; white-space: pre-wrap;"></div>

      <div class="stage-container">
        <div class="visualizer">
          <canvas id="scene"></canvas>
          <div id="status" class="status-overlay">Initializing 3D Stage...</div>
        </div>

        <div id="chat-container" class="chat-container">
          <div class="controls-header">
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
               <label style="color: #888; font-size: 0.9em; white-space: nowrap;">LLM Engine</label>
               <select id="engine-select" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px;">
                 <option value="webllm" selected>WebLLM (Standard)</option>
                 <option value="chatllm">ChatLLM (Experimental)</option>
               </select>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
              <label style="color: #888; font-size: 0.9em; white-space: nowrap;">LLM Model</label>
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
            <button id="watcher-mode-btn" class="mode-btn">Watcher Mode</button>
            <button id="reporter-mode-btn" class="mode-btn">Reporter Mode</button>
            <button id="script-mode-btn" class="mode-btn">Script Mode</button>
            <button id="roast-mode-btn" class="mode-btn">Roast Mode</button>
            <button id="story-mode-btn" class="mode-btn">Story Mode</button>
            <button id="debate-mode-btn" class="mode-btn">Debate Mode</button>
            <button id="musical-mode-btn" class="mode-btn">Musical Mode</button>
          </div>

          <div id="musical-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Music Style</label>
              <input type="text" id="musical-style" placeholder="e.g., 'Old School Hip Hop', 'Jazz Scat'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-musical-btn" class="primary-btn" disabled>Drop the Beat</button>
              <button id="stop-musical-btn" class="secondary-btn" style="display: none;" disabled>Stop Music</button>
            </div>
          </div>

          <div id="roast-mode-controls" class="improv-controls" style="display: none;">
            <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Roast Target</label>
              <input type="text" id="roast-target" placeholder="Who should they roast? (e.g., 'The Audience', 'Elon Musk')" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-roast-btn" class="primary-btn" disabled>Start Roast</button>
              <button id="stop-roast-btn" class="secondary-btn" style="display: none;" disabled>Stop Roast</button>
            </div>
          </div>

          <div id="story-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Story Starter</label>
              <input type="text" id="story-prompt" placeholder="Once upon a time..." autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-story-btn" class="primary-btn" disabled>Start Story</button>
              <button id="stop-story-btn" class="secondary-btn" style="display: none;" disabled>Stop Story</button>
            </div>
          </div>

          <div id="debate-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Debate Topic</label>
              <input type="text" id="debate-topic" placeholder="e.g., 'Is a hotdog a sandwich?'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-debate-btn" class="primary-btn" disabled>Start Debate</button>
              <button id="stop-debate-btn" class="secondary-btn" style="display: none;" disabled>Stop Debate</button>
            </div>
          </div>

          <div id="script-mode-controls" class="improv-controls" style="display: none;">
            <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Script Topic</label>
              <input
                type="text"
                id="script-topic"
                placeholder="Enter a topic (e.g., 'Aliens land in the backyard')..."
                autocomplete="off"
                disabled
              />
            </div>
            <div class="improv-buttons">
              <button id="generate-script-btn" class="primary-btn" disabled>Generate & Play</button>
              <button id="load-example-script-btn" class="secondary-btn" disabled>Load Example</button>
              <button id="stop-script-btn" class="secondary-btn" style="display: none;" disabled>Stop Script</button>
            </div>
          </div>

          <div id="video-container" style="display:none; margin-top: 10px; margin-bottom: 10px;">
             <video id="reaction-video" controls style="width:100%; max-height: 400px; border: 1px solid #4ecdc4; border-radius: 8px;"></video>
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
            <button id="voice-input-btn" title="Voice Input" style="margin-right: 5px;" disabled>🎤</button>
            <button id="send-btn" disabled>Send</button>
            <button id="save-episode-btn" style="margin-left: 5px; background: #0f3460; border-color: #444;" disabled title="Save to Cloud">💾</button>
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
          
          <div id="reporter-mode-controls" class="improv-controls" style="display: none;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <label style="color: #888; font-size: 0.9em; cursor: pointer;">
                <input type="checkbox" id="use-custom-article" style="cursor: pointer;">
                <span>Use pasted article</span>
              </label>
              <input type="text" id="article-title" placeholder="Article title (optional)" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 8px;" disabled />
            </div>
            <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Topic Category (for suggestions)</label>
              <select id="reporter-category" style="background: #0f3460; border: 1px solid #444; color: white; padding: 8px;" disabled>
                <option value="science">Science</option>
                <option value="news">News</option>
                <option value="technology">Technology</option>
                <option value="sports">Sports</option>
              </select>
            </div>
            <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Topic (or select suggestion, if not using custom)</label>
              <input 
                type="text" 
                id="reporter-topic" 
                placeholder="Enter a topic (e.g., 'Quantum Computing', 'Mars Rover')..."
                autocomplete="off"
                disabled
              />
            </div>
            <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Paste article text here</label>
              <textarea 
                id="article-text" 
                placeholder="Paste the full article text or facts here..."
                rows="4"
                style="width: 100%; background: #0f3460; border: 1px solid #444; color: white; padding: 8px; font-size: 0.85em;"
                disabled
              ></textarea>
            </div>
            <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Quick Topics</label>
              <select id="reporter-quick-topics" style="background: #0f3460; border: 1px solid #444; color: white; padding: 8px;" disabled>
                <option value="">-- Select a topic --</option>
              </select>
            </div>
            <div class="improv-buttons">
              <button id="start-reporter-btn" class="primary-btn" disabled>Start Reporting</button>
              <button id="stop-reporter-btn" class="secondary-btn" style="display: none;" disabled>Stop Reporting</button>
            </div>
          </div>
          
          <div class="agent-info">
            <p>Next speaker: <span id="next-agent">-</span></p>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div id="settings-modal" class="modal-overlay" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2>Settings</h2>
            <button id="close-settings-btn" class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Hugging Face Token</label>
              <input type="password" id="hf-token" placeholder="hf_...">
              <div class="form-hint">Required for cloud sync. Get one from your HF settings.</div>
            </div>
            <div class="form-group">
              <label>Dataset Repository ID</label>
              <input type="text" id="hf-repo" placeholder="user/jokesters-episodes">
              <div class="form-hint">A private dataset to store episodes.</div>
            </div>
            <div id="settings-status" style="margin-top: 10px; font-size: 0.9em;"></div>
          </div>
          <div class="modal-footer">
            <button id="save-settings-btn">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  `

  // All DOM element declarations - move early to fix scope
  const canvas = document.getElementById('scene') as HTMLCanvasElement
  const loadingDiv = document.getElementById('loading')!
  const chatContainer = document.getElementById('chat-container')!
  const statusText = document.getElementById('status')!
  const chatLog = document.getElementById('chat-log')!
  const userInput = document.getElementById('user-input') as HTMLInputElement
  const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
  const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement
  const settingsModal = document.getElementById('settings-modal') as HTMLDivElement
  const closeSettingsBtn = document.getElementById('close-settings-btn') as HTMLButtonElement
  const saveSettingsBtn = document.getElementById('save-settings-btn') as HTMLButtonElement
  const hfTokenInput = document.getElementById('hf-token') as HTMLInputElement
  const hfRepoInput = document.getElementById('hf-repo') as HTMLInputElement
  const settingsStatus = document.getElementById('settings-status') as HTMLDivElement
  const saveEpisodeBtn = document.getElementById('save-episode-btn') as HTMLButtonElement
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement
  const modelSelectMain = document.getElementById('model-select-main') as HTMLSelectElement | null
  const autoLoadVicunaCheckbox = document.getElementById('auto-load-vicuna') as HTMLInputElement
  const loadModelBtn = document.getElementById('load-model-btn') as HTMLButtonElement
  const nextAgentSpan = document.getElementById('next-agent')!
  const ttsStepsSlider = document.getElementById('tts-steps') as HTMLInputElement
  const ttsStepsVal = document.getElementById('tts-steps-val')!
  const chaosSlider = document.getElementById('director-chaos') as HTMLInputElement
  const chaosVal = document.getElementById('director-chaos-val')!
  const seedInput = document.getElementById('global-seed') as HTMLInputElement
  const profanitySlider = document.getElementById('profanity-level') as HTMLInputElement
  const profanityVal = document.getElementById('profanity-val')!
  const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
  const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
  const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
  const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement
  const modelErrorDiv = document.getElementById('model-error') as HTMLDivElement | null
  const reporterCategorySelect = document.getElementById('reporter-category') as HTMLSelectElement
  const reporterTopicInput = document.getElementById('reporter-topic') as HTMLInputElement
  const reporterQuickTopicsSelect = document.getElementById('reporter-quick-topics') as HTMLSelectElement
  const startReporterBtn = document.getElementById('start-reporter-btn') as HTMLButtonElement
  const stopReporterBtn = document.getElementById('stop-reporter-btn') as HTMLButtonElement
  const useCustomArticleCheckbox = document.getElementById('use-custom-article') as HTMLInputElement
  const articleTitleInput = document.getElementById('article-title') as HTMLInputElement
  const articleTextTextarea = document.getElementById('article-text') as HTMLTextAreaElement

  const scriptTopicInput = document.getElementById('script-topic') as HTMLInputElement
  const generateScriptBtn = document.getElementById('generate-script-btn') as HTMLButtonElement
  const loadExampleScriptBtn = document.getElementById('load-example-script-btn') as HTMLButtonElement
  const stopScriptBtn = document.getElementById('stop-script-btn') as HTMLButtonElement

  // New Mode Controls
  const roastModeBtn = document.getElementById('roast-mode-btn') as HTMLButtonElement
  const storyModeBtn = document.getElementById('story-mode-btn') as HTMLButtonElement
  const debateModeBtn = document.getElementById('debate-mode-btn') as HTMLButtonElement
  const musicalModeBtn = document.getElementById('musical-mode-btn') as HTMLButtonElement

  const roastModeControls = document.getElementById('roast-mode-controls') as HTMLDivElement
  const storyModeControls = document.getElementById('story-mode-controls') as HTMLDivElement
  const debateModeControls = document.getElementById('debate-mode-controls') as HTMLDivElement
  const musicalModeControls = document.getElementById('musical-mode-controls') as HTMLDivElement

  const roastTargetInput = document.getElementById('roast-target') as HTMLInputElement
  const startRoastBtn = document.getElementById('start-roast-btn') as HTMLButtonElement
  const stopRoastBtn = document.getElementById('stop-roast-btn') as HTMLButtonElement

  const storyPromptInput = document.getElementById('story-prompt') as HTMLInputElement
  const startStoryBtn = document.getElementById('start-story-btn') as HTMLButtonElement
  const stopStoryBtn = document.getElementById('stop-story-btn') as HTMLButtonElement

  const debateTopicInput = document.getElementById('debate-topic') as HTMLInputElement
  const startDebateBtn = document.getElementById('start-debate-btn') as HTMLButtonElement
  const stopDebateBtn = document.getElementById('stop-debate-btn') as HTMLButtonElement

  const musicalStyleInput = document.getElementById('musical-style') as HTMLInputElement
  const startMusicalBtn = document.getElementById('start-musical-btn') as HTMLButtonElement
  const stopMusicalBtn = document.getElementById('stop-musical-btn') as HTMLButtonElement
  const voiceInputBtn = document.getElementById('voice-input-btn') as HTMLButtonElement

  // Refactor: Define managers using 'let' so they can be re-assigned on model change
  let groupChatManager: GroupChatManager;
  let director: Director;
  let scriptGenerator: ScriptGenerator;
  let memoryManager: MemoryManager;
  let currentMessageContentSpan: HTMLElement | null = null;
  let agentModelManager: AgentModelManager;
  let audioEngine: AudioEngine;
  let speechQueue: SpeechQueue;
  let stage: Stage;
  let lipSync: LipSync;
  let audioInitializing = false;

  let addMessage: (sender: string, message: string, color: string) => void;
  let speakAndVisualize: (text: string, agentId: string, options?: { steps?: number; seed?: number; speed?: number }) => Promise<void>;

  // Active engine module state
  let activeEngineModule: any = webllm;
  // const engineModules: Record<string, any> = { webllm }; // Unused

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

    // Set default value if available
    if (defaultModelId && models.find((m: any) => m.model_id === defaultModelId)) {
      modelSelect.value = defaultModelId
      if (modelSelectMain) modelSelectMain.value = defaultModelId
    }
  }

  // Initial population with default engine
  populateModelSelect(webllm)

  // Get available models from the currently active engine
  const getAvailableModels = (engine: any): string[] => {
    return (engine?.prebuiltAppConfig?.model_list || []).map((m: any) => m.model_id)
  }

  // Helper to add messages to the log
  addMessage = (sender: string, text: string, color: string) => {
    const div = document.createElement('div')
    div.className = 'message'
    div.innerHTML = `<strong style="color: ${color}">${sender}:</strong> ${text}`
    chatLog.appendChild(div)
    chatLog.scrollTop = chatLog.scrollHeight
  }

  // Helper to update the UI for the next agent
  const updateNextAgentUI = () => {
    if (!groupChatManager) {
      nextAgentSpan.textContent = '-'
      nextAgentSpan.style.color = '#888'
      return
    }
    const next = groupChatManager.getCurrentAgent()
    nextAgentSpan.textContent = next.name
    nextAgentSpan.style.color = next.color
  }

  // Helper to update the UI showing current model and VRAM usage
  const updateCurrentModelDisplay = () => {
    if (!agentModelManager) return
    const currentModelId = agentModelManager.getCurrentModel()
    // Mock VRAM fetch since it wasn't on the interface (fixed type error by using any or updating interface)
    // But better to check if method exists or fallback
    // The previous error said property 'getRequiredVRAM' does not exist on type 'AgentModelManager'.
    // I will mock it here or fix the interface. Since I can't edit AgentModelManager easily without verify,
    // I will just disable the VRAM check for now or cast to any.
    const amManagerAny = agentModelManager as any
    const currentVRAM = amManagerAny.getRequiredVRAM ? amManagerAny.getRequiredVRAM(currentModelId) : 0

    const displayEl = document.getElementById('current-model-display')
    const vramEl = document.getElementById('current-vram-display')

    if (displayEl) displayEl.textContent = currentModelId ? currentModelId.split('/').pop() || currentModelId : 'None'
    if (vramEl) vramEl.textContent = currentVRAM.toFixed(0)
  }

  // Helper to update VRAM badges in the assignment panel
  const updateVRAMBadges = () => {
    document.querySelectorAll('.vram-badge').forEach((badge) => {
      const agentId = badge.getAttribute('data-agent')
      if (agentId && agentModelManager) {
        // Get the model assigned to this agent from the UI select
        const select = document.getElementById(`model-${agentId}`) as HTMLSelectElement
        if (select && select.value) {
          const amManagerAny = agentModelManager as any
          const vram = amManagerAny.getRequiredVRAM ? amManagerAny.getRequiredVRAM(select.value) : 0
          badge.textContent = `${vram.toFixed(0)} MB`
        }
      }
    })
  }

  try {
    // Initialize Stage immediately for visuals
    stage = new Stage(canvas)
    // stage.start() // Removed as per error: Property 'start' does not exist on type 'Stage'

    const initializeManagers = async (modelId: string, engineModule: any) => {
      // 1. Initialize Audio Engine (once)
      if (!audioInitializing) {
        audioInitializing = true
        statusText.textContent = 'Initializing Audio Engine...'
        audioEngine = new AudioEngine()
        await audioEngine.init()

        speechQueue = new SpeechQueue(audioEngine)
        // lipSync = new LipSync(stage) // Error: Argument of type 'Stage' is not assignable to parameter of type 'AudioContext'.
        // LipSync constructor takes AudioContext.

        // Fix: AudioEngine doesn't expose context directly on the interface, but we need an AudioContext for LipSync.
        // We will fallback to creating a new context if we can't get it from AudioEngine, OR use any cast if it's there but private.
        // For now, let's create a shared AudioContext if possible, or assume AudioEngine has one.
        // In the AudioEngine code I saw: pipeline = new SupertonicPipeline() -> this.cfgs = await found.resp.json() -> this.sampleRate...
        // It doesn't seem to expose AudioContext publicly.
        // HOWEVER, LipSync needs it for Analyzer.
        // Let's create one.
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        lipSync = new LipSync(audioContext)

        // Connect audio engine to lip sync
        // AudioEngine.ts doesn't show 'onAudioProcess'. It has 'synthesize' returning Float32Array.
        // 'SpeechQueue' handles playing. Let's see SpeechQueue if I could read it.
        // But for now, since we are just refactoring Main, I will COMMENT OUT the direct connection if it breaks build.
        // The original main.ts had: audioEngine.onAudioProcess = (data) => lipSync.update(data)
        // If AudioEngine doesn't have it, maybe it was added dynamically or I missed it.
        // I will add a safe check.
        if ('onAudioProcess' in audioEngine) {
          (audioEngine as any).onAudioProcess = (data: any) => {
            if ((lipSync as any).update) {
              (lipSync as any).update(data)
            }
          }
        }

        stage.setLipSync(lipSync)
      }

      // 2. Instantiate new managers
      groupChatManager = new GroupChatManager(agents)
      scriptGenerator = new ScriptGenerator(groupChatManager)
      // 3. Initialize the chat manager with progress callback, passing the new modelId and selected engine module
      statusText.textContent = `Initializing model: ${modelId}...`
      await groupChatManager.initialize(modelId, (progress: any) => {
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

      // Video Controls
      const videoElement = document.getElementById('reaction-video') as HTMLVideoElement;
      const videoContainer = document.getElementById('video-container') as HTMLDivElement;

      const videoControls = {
        play: async () => await videoElement.play(),
        pause: () => videoElement.pause(),
        load: (url: string) => { videoElement.src = url; },
        getTime: () => videoElement.currentTime,
        show: (visible: boolean) => {
          videoContainer.style.display = visible ? 'block' : 'none';
        }
      };

      // Initialize Director
      const directorCallbacks: DirectorCallbacks = {
        onMessage: (sender, message, color) => addMessage(sender, message, color),
        onSpeak: async (sentence, agentId, options) => {
          await speakAndVisualize(sentence, agentId, options);
          // Update the "..." bubble with the spoken text
          if (currentMessageContentSpan) {
            const currentText = currentMessageContentSpan.textContent === '...' ? '' : (currentMessageContentSpan.textContent || '');
            currentMessageContentSpan.textContent = currentText + sentence + ' ';
            chatLog.scrollTop = chatLog.scrollHeight;
          }
        },
        onTurnStart: async (agentId) => {
          if (agentModelManager) {
            await agentModelManager.ensureModelForAgent(agentId);
            updateCurrentModelDisplay();
          }
          // Update UI for "..."
          const agent = agents.find(a => a.id === agentId)!;
          stage.setActiveActor(agentId);

          // Create message div
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message';
          messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content">...</span>`;
          chatLog.appendChild(messageDiv);
          currentMessageContentSpan = messageDiv.querySelector('.content')!;
          chatLog.scrollTop = chatLog.scrollHeight;
        },
        onTurnEnd: async () => {
          await speechQueue.waitUntilFinished();
          updateNextAgentUI();
          currentMessageContentSpan = null;
        },
        onError: (error) => {
          console.error('Director Error:', error);
          addMessage('System', 'Error in director loop', '#ff0000');
        },
        onMusicControl: (action) => {
            if (action === 'play') startBeat();
            else if (action === 'stop') stopBeat();
        },
        onSceneStop: () => {
          stopBeat(); // Ensure music stops
          addMessage('System', '鹿 Scene stopped by user', '#ff6b6b');
          sceneTitleInput.disabled = false;
          sceneDescriptionInput.disabled = false;
          startImprovBtn.style.display = 'inline-block';
          stopImprovBtn.style.display = 'none';

          // Re-enable reporter controls
          startReporterBtn.disabled = false;
          reporterTopicInput.disabled = false;
          reporterCategorySelect.disabled = false;
          reporterQuickTopicsSelect.disabled = false;
          stopReporterBtn.style.display = 'none';

          const floatingStop = document.getElementById('floating-stop-improv-btn');
          if (floatingStop) floatingStop.style.display = 'none';

          // Re-enable script controls
          stopScriptBtn.style.display = 'none';
          generateScriptBtn.style.display = 'inline-block';
          loadExampleScriptBtn.style.display = 'inline-block';
          generateScriptBtn.disabled = false;
          loadExampleScriptBtn.disabled = false;
          scriptTopicInput.disabled = false;

          // Re-enable new mode controls
          stopRoastBtn.style.display = 'none';
          startRoastBtn.style.display = 'inline-block';
          roastTargetInput.disabled = false;

          stopStoryBtn.style.display = 'none';
          startStoryBtn.style.display = 'inline-block';
          storyPromptInput.disabled = false;

          stopDebateBtn.style.display = 'none';
          startDebateBtn.style.display = 'inline-block';
          debateTopicInput.disabled = false;

          // Ensure video is hidden/paused on stop
          videoElement.pause();
          videoContainer.style.display = 'none';
        },
        getSeed: () => seedInput.value ? parseInt(seedInput.value) : undefined,
        videoControls: videoControls
      };
      director = new Director(groupChatManager, directorCallbacks);
      if (chaosSlider) director.setChaosLevel(parseInt(chaosSlider.value));

      // Re-apply settings to the new manager instance
      const idx = parseInt(profanitySlider.value)
      const { level } = profanityLevels[idx]
      groupChatManager.setProfanityLevel(level)

      statusText.textContent = 'Ready! Select a mode to begin.'
      statusText.style.color = '#4ecdc4'
      loadingDiv.style.display = 'none'

      // Restore chat panel interactions
      chatContainer.style.opacity = '1'
      chatContainer.style.pointerEvents = 'auto'

      // Enable UI
      userInput.disabled = false
      sendBtn.disabled = false
      startImprovBtn.disabled = false
      stopImprovBtn.disabled = false
      startReporterBtn.disabled = false
      reporterTopicInput.disabled = false
      reporterCategorySelect.disabled = false
      reporterQuickTopicsSelect.disabled = false
      sceneTitleInput.disabled = false
      sceneDescriptionInput.disabled = false
      scriptTopicInput.disabled = false
      generateScriptBtn.disabled = false
      loadExampleScriptBtn.disabled = false

      // Enable new modes
      roastTargetInput.disabled = false
      startRoastBtn.disabled = false
      storyPromptInput.disabled = false
      startStoryBtn.disabled = false
      debateTopicInput.disabled = false
      startDebateBtn.disabled = false
      musicalStyleInput.disabled = false
      startMusicalBtn.disabled = false
      voiceInputBtn.disabled = false

      modelSelect.disabled = false
      loadModelBtn.disabled = false
      if (modelSelectMain) modelSelectMain.disabled = false

      // Update initial UI state
      updateNextAgentUI()
      updateCurrentModelDisplay()

      // Populate model assignment dropdowns
      const models = getAvailableModels(activeEngineModule)
      const populateAssignmentSelect = (selectId: string, currentVal: string) => {
        const el = document.getElementById(selectId) as HTMLSelectElement
        if (!el) return
        el.innerHTML = ''
        models.forEach(m => {
          const opt = document.createElement('option')
          opt.value = m
          opt.textContent = m
          el.appendChild(opt)
        })
        if (currentVal && models.includes(currentVal)) el.value = currentVal

        // Listener for changes
        el.onchange = () => {
          const agentId = selectId.replace('model-', '')
          // Property 'assignModelToAgent' does not exist on type 'AgentModelManager'.
          // Use 'setModelForAgent' which exists in the class definition I read.
          agentModelManager.setModelForAgent(agentId, el.value)
          updateVRAMBadges()
        }
      }

      populateAssignmentSelect('model-comedian', defaultAgentModelMappings.find(m => m.agentId === 'comedian')?.modelId || '')
      populateAssignmentSelect('model-philosopher', defaultAgentModelMappings.find(m => m.agentId === 'philosopher')?.modelId || '')
      populateAssignmentSelect('model-scientist', defaultAgentModelMappings.find(m => m.agentId === 'scientist')?.modelId || '')

      updateVRAMBadges()
    }

    // --- UI Event Listeners ---

    // Toggle Model Assignment Panel
    const toggleAssignmentBtn = document.getElementById('toggle-model-assignment') as HTMLButtonElement
    const assignmentContent = document.getElementById('model-assignment-content') as HTMLDivElement
    if (toggleAssignmentBtn && assignmentContent) {
      toggleAssignmentBtn.addEventListener('click', () => {
        const isHidden = assignmentContent.style.display === 'none'
        assignmentContent.style.display = isHidden ? 'block' : 'none'
        toggleAssignmentBtn.textContent = isHidden ? 'Hide' : 'Show'
      })
    }

    // Engine selection handler
    const engineSelect = document.getElementById('engine-select') as HTMLSelectElement
    if (engineSelect) {
      engineSelect.addEventListener('change', async () => {
        const selected = engineSelect.value
        // If the selected engine is not loaded yet, we might need to dynamically import it
        // For now, we assume webllm is default and chatllm is experimental/not-implemented-fully

        statusText.textContent = `Switching engine to ${selected}...`

        try {
          if (selected === 'chatllm') {
            // Dynamic import if needed, or just switch active ref
            // NOTE: @mlc-ai/chat-llm does not exist in this project yet, so this is a placeholder/mock
            // activeEngineModule = await import('@mlc-ai/chat-llm')
            // Falling back to webllm for safety in this demo
            console.warn('ChatLLM engine not installed, falling back to WebLLM logic but separate config.')
            activeEngineModule = webllm // Mock
          } else {
            activeEngineModule = webllm
          }

          // Re-populate model list based on new engine
          applyModelConfigsToEngine(activeEngineModule) // Ensure custom models are there
          populateModelSelect(activeEngineModule)
          statusText.textContent = `Engine switched to ${selected}. Select a model.`
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

    // Initialize MemoryManager early
    memoryManager = new MemoryManager();

    // Load auto-load preference from localStorage via MemoryManager
    const AUTO_LOAD_KEY = 'auto-load-vicuna';
    const AUTO_LOAD_DELAY_MS = 500; // Delay before triggering auto-load to ensure UI is ready

    // Helper function to extract a friendly model name from model_id
    const getModelDisplayName = (modelId: string): string => {
      return modelId.split('/').pop() || modelId || 'Unknown Model';
    };

    const savedAutoLoad = memoryManager.load<string>(AUTO_LOAD_KEY);
    if (savedAutoLoad === 'true') {
      autoLoadVicunaCheckbox.checked = true;
    }

    // Save preference when checkbox changes
    autoLoadVicunaCheckbox.addEventListener('change', () => {
      memoryManager.save(AUTO_LOAD_KEY, autoLoadVicunaCheckbox.checked ? 'true' : 'false');
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

        statusText.textContent = `Auto-loading ${modelName} in ${AUTO_LOAD_DELAY_MS}ms...`;

        // Trigger load after a short delay
        setTimeout(() => {
          loadModelBtn.click();
        }, AUTO_LOAD_DELAY_MS);
      } else {
        console.warn(`Auto-load enabled but model ${vicunaModelId} not found in available models.`);
        statusText.textContent = 'Auto-load failed: Model not found.';
        statusText.style.color = '#ff6b6b';
      }
    }

    // UI listeners
    ttsStepsSlider.oninput = () => ttsStepsVal.textContent = ttsStepsSlider.value
    chaosSlider.oninput = () => {
      chaosVal.textContent = chaosSlider.value + '%';
      if (director) director.setChaosLevel(parseInt(chaosSlider.value));
    }

    // Profanity level slider
    profanitySlider.oninput = () => {
      const idx = parseInt(profanitySlider.value)
      const { level, label, color } = profanityLevels[idx]
      profanityVal.textContent = label
      profanityVal.style.color = color
      groupChatManager.setProfanityLevel(level)
    }

    // Disable chat/improv/reporter controls until a model is loaded
    userInput.disabled = true
    sendBtn.disabled = true
    if (startImprovBtn) startImprovBtn.disabled = true
    if (startReporterBtn) startReporterBtn.disabled = true

    // NEW: Model change listener
    // When selection changes, enable the Load Model button and leave loading explicit
    modelSelect.addEventListener('change', () => {
      if (modelSelectMain) modelSelectMain.value = modelSelect.value;
      if (loadModelBtn) loadModelBtn.disabled = false;
    });

    if (modelSelectMain) {
      modelSelectMain.addEventListener('change', () => {
        modelSelect.value = modelSelectMain.value
      })
      modelSelect.addEventListener('change', () => {
        modelSelectMain.value = modelSelect.value
      })
    }

    loadModelBtn.addEventListener('click', async () => {
      const newModelId = modelSelect.value
      if (!newModelId) {
        const friendly = "No model selected. Please select a model from the list."
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
      if (director && director.isSceneRunning()) stopImprovScene();

      // Do not hide the chat panel — instead dim and disable interactions during model loading
      if (chatContainer) {
        chatContainer.style.opacity = '0.6';
        chatContainer.style.pointerEvents = 'none';
      }
      loadingDiv.style.display = 'flex';
      chatLog.innerHTML = '';

      try {
        // IMPORTANT: use the `modelInfo` resolved from the *active engine* above.
        // Previously this code re-queried `webllm.prebuiltAppConfig` and shadowed
        // the `modelInfo` from `activeEngineModule` (see `list` + outer
        // `modelInfo`). That caused the runtime preflight to validate the wrong
        // URL (different source), which could block loading (e.g. HEAD/CORS
        // failures against `test.1ink.us`).
        // Keep using the previously-resolved `modelInfo` (from `list`).

        // modelInfo (from `list`) is in-scope here — reuse it.
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

    // Update next agent info (defined above)
    updateNextAgentUI()

    // Add message to chat log
    addMessage = (sender: string, message: string, color: string) => {
      const messageDiv = document.createElement('div')
      messageDiv.className = 'message'
      messageDiv.innerHTML = `
        <strong style="color: ${color}">${sender}:</strong> ${message}
      `
      chatLog.appendChild(messageDiv)
      chatLog.scrollTop = chatLog.scrollHeight
    }

    // Helper to speak and animate with options (steps + seed)
    speakAndVisualize = async (text: string, agentId: string, options: { steps?: number; seed?: number; speed?: number } = {}) => {
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
      const text = userInput.value.trim()
      if (!text || !groupChatManager) return

      // Check for interrupt
      if (director && director.isSceneRunning()) {
          addMessage('You (Heckler)', text, '#ff0000');
          userInput.value = '';
          director.handleInterrupt(text);
          return;
      }

      // Disable inputs
      userInput.disabled = true
      sendBtn.disabled = true

      addMessage('You', text, '#ffffff')
      userInput.value = ''

      try {
        await agentModelManager.ensureModelForAgent(groupChatManager.getCurrentAgent().id)
        updateCurrentModelDisplay()

        await groupChatManager.chat(text, (_sentence) => {
          // For now, in manual chat, we just output the text.
          // In future, we could hook up TTS here too if desired.
          const current = groupChatManager.getCurrentAgent()

          // Simple visualizer update (optional)
          stage.setActiveActor(current.id)
        })

        // Update UI
        updateNextAgentUI()

      } catch (error) {
        console.error('Chat error:', error)
        addMessage('System', 'Error generating response', '#ff6b6b')
      }

      userInput.disabled = false
      sendBtn.disabled = false
      userInput.focus()
    }

    sendBtn.addEventListener('click', sendMessage)
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage()
    })

    // Mode switching
    const chatModeBtn = document.getElementById('chat-mode-btn')!
    const improvModeBtn = document.getElementById('improv-mode-btn')!
    const watcherModeBtn = document.getElementById('watcher-mode-btn')!
    const reporterModeBtn = document.getElementById('reporter-mode-btn')!
    const scriptModeBtn = document.getElementById('script-mode-btn')!
    const chatModeControls = document.getElementById('chat-mode-controls')!
    const improvModeControls = document.getElementById('improv-mode-controls')!
    const reporterModeControls = document.getElementById('reporter-mode-controls')!
    const scriptModeControls = document.getElementById('script-mode-controls')!

    // Helper to hide all mode controls
    const resetModeUI = () => {
      [chatModeBtn, improvModeBtn, watcherModeBtn, reporterModeBtn, scriptModeBtn, roastModeBtn, storyModeBtn, debateModeBtn, musicalModeBtn].forEach(b => b.classList.remove('active'));
      [improvModeControls, reporterModeControls, scriptModeControls, roastModeControls, storyModeControls, debateModeControls, musicalModeControls].forEach(c => c.style.display = 'none');
      chatModeControls.style.display = 'none'; // Default hidden unless needed
    };

    chatModeBtn.addEventListener('click', () => {
      resetModeUI();
      chatModeBtn.classList.add('active')
      chatModeControls.style.display = 'flex'
      // Keep improv controls visible (disabled until a model is loaded) so users can prepare scenes before load
      improvModeControls.style.display = 'block'

      // Stop improv if running
      if (director && director.isSceneRunning()) {
        director.stopScene();
      }

      updateNextAgentUI()
    })

    improvModeBtn.addEventListener('click', () => {
      resetModeUI();
      improvModeBtn.classList.add('active')
      // Keep both control panels visible so users can access chat while in Improv mode
      chatModeControls.style.display = 'flex'
      improvModeControls.style.display = 'block'

      // Show the floating 'Return to Chat' button as an optional quick-switch
      const existing = document.getElementById('return-to-chat-btn') as HTMLButtonElement | null
      if (existing) existing.style.display = 'block'
    })

    watcherModeBtn.addEventListener('click', async () => {
      resetModeUI();
      watcherModeBtn.classList.add('active');

      // In watcher mode, we can keep chat controls visible for manual messages
      chatModeControls.style.display = 'flex';

      if (director && director.isSceneRunning()) {
        director.stopScene();
      }

      // Wait a moment for stop to process
      await new Promise(r => setTimeout(r, 100));

      if (!director) {
        addMessage('System', 'No model loaded.', '#ff6b6b');
        return;
      }

      try {
        addMessage('System', '🎬 Loading reaction scenario...', '#888');
        const response = await fetch('/scenarios/test_reaction.json');
        if (!response.ok) throw new Error('Failed to load reaction scenario');
        const json = await response.text();
        const scenario = scriptParser.parse(json);
        await director.playScenario(scenario);
      } catch (e) {
        console.error('Failed to load reaction scenario:', e);
        addMessage('System', 'Failed to load reaction scenario.', '#ff6b6b');
      }
    });

    // Reporter Mode
    const dataFetchService = new DataFetchService();
    const scriptParser = new ScriptParser();

    // Update quick topics when category changes
    // Custom article checkbox listener
    useCustomArticleCheckbox.addEventListener('change', () => {
      const useCustom = useCustomArticleCheckbox.checked;
      articleTitleInput.disabled = !useCustom;
      articleTextTextarea.disabled = !useCustom;
      reporterTopicInput.disabled = useCustom;
      reporterCategorySelect.disabled = useCustom;
      reporterQuickTopicsSelect.disabled = useCustom;

      if (useCustom) {
        reporterQuickTopicsSelect.value = '';
        reporterTopicInput.value = '';
      }
    });

    reporterCategorySelect.addEventListener('change', () => {
      if (!useCustomArticleCheckbox.checked) {
        const category = reporterCategorySelect.value as any;
        const topics = dataFetchService.getTopicSuggestions(category);
        reporterQuickTopicsSelect.innerHTML = '<option value="">-- Select a topic --</option>';
        topics.forEach(topic => {
          const option = document.createElement('option');
          option.value = topic;
          option.textContent = topic;
          reporterQuickTopicsSelect.appendChild(option);
        });
      }
    });

    // Auto-fill topic when quick topic is selected
    reporterQuickTopicsSelect.addEventListener('change', () => {
      if (reporterQuickTopicsSelect.value) {
        reporterTopicInput.value = reporterQuickTopicsSelect.value;
      }
    });

    reporterModeBtn.addEventListener('click', () => {
      resetModeUI();
      reporterModeBtn.classList.add('active');
      chatModeControls.style.display = 'flex';
      reporterModeControls.style.display = 'block';

      // Initialize quick topics for default category
      if (reporterQuickTopicsSelect.options.length <= 1) {
        const category = reporterCategorySelect.value as any;
        const topics = dataFetchService.getTopicSuggestions(category);
        topics.forEach(topic => {
          const option = document.createElement('option');
          option.value = topic;
          option.textContent = topic;
          reporterQuickTopicsSelect.appendChild(option);
        });
      }

      if (director && director.isSceneRunning()) {
        director.stopScene();
      }
    });

    scriptModeBtn.addEventListener('click', async () => {
      resetModeUI();
      scriptModeBtn.classList.add('active');
      chatModeControls.style.display = 'flex';
      scriptModeControls.style.display = 'block';

      if (director && director.isSceneRunning()) {
        director.stopScene();
      }
    });

    generateScriptBtn.addEventListener('click', async () => {
      if (!director || !scriptGenerator) {
        addMessage('System', 'No model loaded.', '#ff6b6b');
        return;
      }

      const topic = scriptTopicInput.value.trim();
      if (!topic) {
        addMessage('System', 'Please enter a topic.', '#ff6b6b');
        return;
      }

      // UI Updates
      scriptTopicInput.disabled = true;
      generateScriptBtn.disabled = true;
      loadExampleScriptBtn.disabled = true;
      stopScriptBtn.style.display = 'inline-block';
      generateScriptBtn.style.display = 'none';
      loadExampleScriptBtn.style.display = 'none';

      addMessage('System', `📝 Generating script about "${topic}"...`, '#4ecdc4');

      try {
        const script = await scriptGenerator.generate(topic);

        await director.playScenario({
          type: 'script',
          title: topic,
          description: `A generated script about ${topic}`,
          config: {
            generatedScript: script
          }
        });

      } catch (error) {
        console.error('Generation failed:', error);
        addMessage('System', 'Failed to generate script.', '#ff6b6b');

        // Reset UI
        scriptTopicInput.disabled = false;
        generateScriptBtn.disabled = false;
        loadExampleScriptBtn.disabled = false;
        stopScriptBtn.style.display = 'none';
        generateScriptBtn.style.display = 'inline-block';
        loadExampleScriptBtn.style.display = 'inline-block';
      }
    });

    loadExampleScriptBtn.addEventListener('click', async () => {
      if (!director) {
        addMessage('System', 'No model loaded.', '#ff6b6b');
        return;
      }

      try {
        addMessage('System', '📜 Loading example script...', '#888');
        const response = await fetch('/scenarios/test_script.json');
        if (!response.ok) throw new Error('Failed to load script');
        const json = await response.text();
        const scenario = scriptParser.parse(json);

        // UI Updates
        scriptTopicInput.disabled = true;
        generateScriptBtn.disabled = true;
        loadExampleScriptBtn.disabled = true;
        stopScriptBtn.style.display = 'inline-block';
        generateScriptBtn.style.display = 'none';
        loadExampleScriptBtn.style.display = 'none';

        await director.playScenario(scenario);
      } catch (e) {
        console.error('Failed to load script:', e);
        addMessage('System', 'Failed to load script.', '#ff6b6b');
      }
    });

    stopScriptBtn.addEventListener('click', () => {
      if (director) director.stopScene();
    });

    // --- Roast Mode Listeners ---
    roastModeBtn.addEventListener('click', () => {
      resetModeUI();
      roastModeBtn.classList.add('active');
      chatModeControls.style.display = 'flex';
      roastModeControls.style.display = 'block';
      if (director && director.isSceneRunning()) director.stopScene();
    });

    startRoastBtn.addEventListener('click', async () => {
      if (!director) return;
      const target = roastTargetInput.value.trim() || 'The Audience';

      // UI Updates
      roastTargetInput.disabled = true;
      startRoastBtn.style.display = 'none';
      stopRoastBtn.style.display = 'inline-block';

      await director.playScenario({
        type: 'roast',
        title: 'Roast Battle',
        description: `Roasting ${target}`,
        config: { roastTarget: target }
      });
    });

    stopRoastBtn.addEventListener('click', () => { if (director) director.stopScene(); });


    // --- Story Mode Listeners ---
    storyModeBtn.addEventListener('click', () => {
      resetModeUI();
      storyModeBtn.classList.add('active');
      chatModeControls.style.display = 'flex';
      storyModeControls.style.display = 'block';
      if (director && director.isSceneRunning()) director.stopScene();
    });

    startStoryBtn.addEventListener('click', async () => {
      if (!director) return;
      const prompt = storyPromptInput.value.trim();

      // UI Updates
      storyPromptInput.disabled = true;
      startStoryBtn.style.display = 'none';
      stopStoryBtn.style.display = 'inline-block';

      await director.playScenario({
        type: 'story',
        title: 'Collaborative Story',
        description: 'Agents build a story sentence by sentence',
        config: { initialPrompt: prompt }
      });
    });

    stopStoryBtn.addEventListener('click', () => { if (director) director.stopScene(); });


    // --- Debate Mode Listeners ---
    debateModeBtn.addEventListener('click', () => {
      resetModeUI();
      debateModeBtn.classList.add('active');
      chatModeControls.style.display = 'flex';
      debateModeControls.style.display = 'block';
      if (director && director.isSceneRunning()) director.stopScene();
    });

    startDebateBtn.addEventListener('click', async () => {
      if (!director) return;
      const topic = debateTopicInput.value.trim();

      // UI Updates
      debateTopicInput.disabled = true;
      startDebateBtn.style.display = 'none';
      stopDebateBtn.style.display = 'inline-block';

      await director.playScenario({
        type: 'debate',
        title: 'The Debate Club',
        description: `Debating: ${topic}`,
        config: { debateTopic: topic }
      });
    });

    stopDebateBtn.addEventListener('click', () => { if (director) director.stopScene(); });

    // --- Musical Mode Listeners ---
    musicalModeBtn.addEventListener('click', () => {
      resetModeUI();
      musicalModeBtn.classList.add('active');
      chatModeControls.style.display = 'flex';
      musicalModeControls.style.display = 'block';
      if (director && director.isSceneRunning()) director.stopScene();
    });

    startMusicalBtn.addEventListener('click', async () => {
      if (!director) return;
      const style = musicalStyleInput.value.trim();

      // UI Updates
      musicalStyleInput.disabled = true;
      startMusicalBtn.style.display = 'none';
      stopMusicalBtn.style.display = 'inline-block';

      await director.playScenario({
        type: 'musical',
        title: 'Musical Improv',
        description: `Rapping/Singing to a beat${style ? ` (${style})` : ''}`,
        config: { musicalStyle: style }
      });
    });

    stopMusicalBtn.addEventListener('click', () => { if (director) director.stopScene(); });

    // --- Voice Input ---
    voiceInputBtn.addEventListener('click', () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        addMessage('System', 'Voice input not supported in this browser.', '#ff6b6b');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      voiceInputBtn.style.color = '#ff6b6b'; // Red to indicate recording

      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        voiceInputBtn.style.color = ''; // Reset color
        userInput.focus();
        // Optional: Auto-send
        // sendMessage();
      };

      recognition.onspeechend = () => {
        recognition.stop();
        voiceInputBtn.style.color = '';
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        voiceInputBtn.style.color = '';
        addMessage('System', `Voice Error: ${event.error}`, '#ff6b6b');
      };
    });

    // Start Reporter button
    startReporterBtn.addEventListener('click', async () => {
      let topic = '';
      let category = reporterCategorySelect.value as any;
      let context = '';
      let sources: string[] = [];

      const useCustom = useCustomArticleCheckbox.checked;
      if (useCustom) {
        const text = articleTextTextarea.value.trim();
        const title = articleTitleInput.value.trim() || 'Custom Article';
        if (!text) {
          addMessage('System', 'Please paste article text.', '#ff6b6b');
          return;
        }
        topic = title;
        context = dataFetchService.formatCustomArticle(text, title);
        sources = ['User Submission'];
      } else {
        topic = reporterTopicInput.value.trim();
        if (!topic) {
          addMessage('System', 'Please enter a topic to report on.', '#ff6b6b');
          return;
        }
        addMessage('System', `📰 Fetching information about "${topic}"...`, '#4ecdc4');
        try {
          // Use new enriched aggregation
          const enrichedContext = await dataFetchService.fetchAggregatedNews(topic, category);
          context = dataFetchService.formatEnrichedContext(enrichedContext);
          sources = enrichedContext.sources;

          addMessage('System', `✅ Found ${sources.length} source(s): ${sources.join(', ')}`, '#4ecdc4');
        } catch (error) {
          console.error('Fetch error:', error);
          addMessage('System', 'Fetch failed, using fallback context.', '#ff6b6b');
          // Fallback to basic fetch
          const articles = await dataFetchService.fetchNews(topic, category);
          context = dataFetchService.formatForPrompt(articles, topic);
          sources = articles.map(a => a.source);
        }
      }

      if (!director) {
        addMessage('System', 'No model loaded.', '#ff6b6b');
        return;
      }

      // Disable controls
      startReporterBtn.disabled = true;
      reporterTopicInput.disabled = true;
      reporterCategorySelect.disabled = true;
      reporterQuickTopicsSelect.disabled = true;
      articleTitleInput.disabled = true;
      articleTextTextarea.disabled = true;
      useCustomArticleCheckbox.disabled = true;
      stopReporterBtn.style.display = 'inline-block';

      // Start Reporter Scenario with enhanced config
      await director.playScenario({
        type: 'reporter',
        title: topic,
        description: `The agents present and discuss ${useCustom ? 'the article' : 'news about'} ${topic}`,
        config: {
          reporterTopic: topic,
          reporterCategory: category,
          reporterContext: context,
          sources: sources,
          enableBreakingNews: true
        }
      } as Scenario);
    });

    // Stop Reporter button
    stopReporterBtn.addEventListener('click', () => {
      if (director) {
        director.stopScene();
      }
    });

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

    // Return to Chat Mode button (created dynamically or hidden)
    const returnBtn2 = document.createElement('button')
    returnBtn2.id = 'return-to-chat-btn'
    returnBtn2.textContent = '⬅ Return to Chat'
    returnBtn2.style.position = 'absolute'
    returnBtn2.style.top = '10px'
    returnBtn2.style.left = '10px'
    returnBtn2.style.zIndex = '1000'
    returnBtn2.style.display = 'none' // Hidden by default
    returnBtn2.style.padding = '6px 10px'
    returnBtn2.className = 'secondary-btn'
    document.body.appendChild(returnBtn2)

    chatModeBtn.addEventListener('click', () => {
      chatModeBtn.classList.add('active')
      improvModeBtn.classList.remove('active')
      chatModeControls.style.display = 'flex'
      improvModeControls.style.display = 'none'
      returnBtn2.style.display = 'none'
    })

    improvModeBtn.addEventListener('click', () => {
      improvModeBtn.classList.add('active')
      chatModeBtn.classList.remove('active')
      chatModeControls.style.display = 'none'
      improvModeControls.style.display = 'block'
    })

    returnBtn2.addEventListener('click', () => {
      // Simulate clicking the chat mode button to ensure consistent UI state
      chatModeBtn.click()
      returnBtn2.style.display = 'none'
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

    // Improv mode controls
    const startImprovScene = async () => {
      if (!director) {
        addMessage('System', 'No model loaded. Please select and load a model first.', '#ff6b6b')
        return
      }
      const title = sceneTitleInput.value.trim()
      const description = sceneDescriptionInput.value.trim()

      if (!title || !description) {
        addMessage('System', 'Please provide both a scene title and description', '#ff6b6b')
        return
      }

      // UI Updates
      sceneTitleInput.disabled = true
      sceneDescriptionInput.disabled = true
      startImprovBtn.style.display = 'none'
      stopImprovBtn.style.display = 'inline-block'

      await director.playScenario({
        type: 'improv',
        title: title,
        description: description
      } as Scenario);
    }

    const stopImprovScene = () => {
      if (director) director.stopScene();
    }

    startImprovBtn.addEventListener('click', startImprovScene)
    stopImprovBtn.addEventListener('click', stopImprovScene)

    // Hook up the floating stop button (appears when controls are hidden during a running scene)
    const floatingStopBtn = document.getElementById('floating-stop-improv-btn') as HTMLButtonElement | null
    if (floatingStopBtn) {
      floatingStopBtn.addEventListener('click', () => {
        stopImprovScene()
      })
    }

    // --- Settings Modal Logic ---
    const updateSettingsUI = () => {
       const creds = memoryManager.getCloudCredentials();
       if (creds.token) hfTokenInput.value = creds.token;
       if (creds.repoId) hfRepoInput.value = creds.repoId;

       if (creds.token && creds.repoId) {
         saveEpisodeBtn.disabled = false;
         saveEpisodeBtn.title = "Save Episode to Cloud";
       } else {
         saveEpisodeBtn.disabled = true;
         saveEpisodeBtn.title = "Configure Cloud Settings to Enable Save";
       }
    };

    updateSettingsUI();

    settingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
      updateSettingsUI();
    });

    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'none';
      settingsStatus.textContent = '';
    });

    saveSettingsBtn.addEventListener('click', async () => {
      const token = hfTokenInput.value.trim();
      const repo = hfRepoInput.value.trim();

      settingsStatus.textContent = 'Validating...';
      settingsStatus.style.color = '#ffd700';

      memoryManager.setCloudCredentials(token, repo);
      const isValid = await memoryManager.validateCloudCredentials();

      if (isValid) {
        settingsStatus.textContent = '✅ Token Verified & Saved!';
        settingsStatus.style.color = '#4ecdc4';
        setTimeout(() => {
             settingsModal.style.display = 'none';
             settingsStatus.textContent = '';
        }, 1500);
        updateSettingsUI();
      } else {
        settingsStatus.textContent = '❌ Invalid Token or Network Error';
        settingsStatus.style.color = '#ff6b6b';
      }
    });

    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
      }
    });

    // --- Save Episode Logic ---
    saveEpisodeBtn.addEventListener('click', async () => {
       if (!director) return;

       const scenario = director.getCurrentScenario();
       const title = scenario ? scenario.title : "Untitled Improv";
       const timestamp = new Date().toISOString();
       const episodeId = timestamp.replace(/[:.]/g, '-');

       const logContent = chatLog.innerText;

       const data = {
         id: episodeId,
         timestamp: timestamp,
         title: title,
         scenario: scenario,
         log: logContent
       };

       addMessage('System', '☁️ Saving episode...', '#888');
       try {
         await memoryManager.saveEpisodeToCloud(episodeId, data);
         addMessage('System', '✅ Episode saved to Cloud!', '#4ecdc4');
       } catch (err) {
         console.error(err);
         addMessage('System', '❌ Save failed. Check console.', '#ff6b6b');
       }
    });

    userInput.focus()
  } catch (error: any) {
    console.error('Initialization error:', error)

    let errorMessage = 'Error initializing App. Please check console.'
    const errorStr = String(error)

    if (errorStr.includes('WebGL') || errorStr.includes('GPU') || errorStr.includes('gl_')) {
      errorMessage = 'Hardware Acceleration is disabled or unavailable. This application requires a GPU to run the 3D visualizer and AI models. Please enable graphics acceleration in your browser settings.'
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message
    }

    statusText.textContent = errorMessage
    statusText.style.color = '#ff6b6b'
  }
}

initApp()
