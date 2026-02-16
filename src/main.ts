import './style.css'
import { GroupChatManager } from './GroupChatManager'
import type { Agent, ProfanityLevel } from './GroupChatManager'
import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
// import { SceneManager } from './SceneManager'
import * as webllm from '@mlc-ai/web-llm'

import { AudioEngine } from './audio/AudioEngine'
import { MusicEngine } from './audio/MusicEngine'
import { SpeechQueue } from './audio/SpeechQueue'
import { VoiceInputManager } from './audio/VoiceInputManager'
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

// Model Configuration - Using main's newer 3.2 models with better config structure
const hermesModelConfig = {
  model_id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
  model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Hermes-3-Llama-3.2-3B-q4f32_1-MLC-webgpu.wasm",
  overrides: {
    context_window_size: 4096,
  },
};

const appConfig = {
  model_list: [
    {
      model: "https://huggingface.co/mlc-ai/Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
      model_id: hermesModelConfig.model_id,
      model_lib: hermesModelConfig.model_lib,
      overrides: hermesModelConfig.overrides,
    },
    {
      model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC",
      model_id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
      model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.2-3B-Instruct-q4f32_1-MLC-webgpu.wasm",
    }
  ],
  useIndexedDBCache: true,
};

const defaultModelId = hermesModelConfig.model_id;

function applyModelConfigsToEngine(engine: any) {
  if (engine && engine.prebuiltAppConfig) {
      const existing = engine.prebuiltAppConfig.model_list || [];
      // Prioritize our config
      engine.prebuiltAppConfig.model_list = [...appConfig.model_list, ...existing];
  }
}

function getAvailableModels(engine: any): string[] {
    if (!engine || !engine.prebuiltAppConfig || !engine.prebuiltAppConfig.model_list) return [];
    return engine.prebuiltAppConfig.model_list.map((m: any) => m.model_id);
}

function populateModelSelect(engine: any) {
    const select = document.getElementById('model-select') as HTMLSelectElement;
    const mainSelect = document.getElementById('model-select-main') as HTMLSelectElement;

    if (!select) return;

    const models = getAvailableModels(engine);
    const optionsHTML = models.map((m: string) => `<option value="${m}">${m}</option>`).join('');

    select.innerHTML = optionsHTML;
    select.value = defaultModelId;

    if (mainSelect) {
        mainSelect.innerHTML = optionsHTML;
        mainSelect.value = defaultModelId;

        mainSelect.addEventListener('change', () => {
            select.value = mainSelect.value;
        });
        select.addEventListener('change', () => {
            if (mainSelect) mainSelect.value = select.value;
        });
    }
}

// Apply configs to the default imported engine (webllm)
applyModelConfigsToEngine(webllm)

// Define our agents with different personalities and sampling parameters
// --- CASUAL & FUNNY AGENTS ---
const agents: Agent[] = [
  {
    id: 'comedian',
    name: 'The Comedian',
    systemPrompt:
      'You are a frantic, high-energy female comedian who talks incredibly fast. You are aware that you ramble at high speed and sometimes apologize for it. You mix highbrow references with lowbrow physical humor. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.95,
    top_p: 0.95,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    systemPrompt:
      'You are a cynical philosopher who speaks... very... slowly... to... ensure... your... profound... thoughts... are... understood. You judge the comedian for her speed. You are highbrow but petty. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.75,
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
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
              <span id="profanity-val" style="color: #ffd700; font-size: 0.9em; width: 80px;">🤬 Gritty</span>
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
            <button id="interview-mode-btn" class="mode-btn">Podcast Mode</button>
            <button id="dm-mode-btn" class="mode-btn">DM Mode</button>
          </div>

          <div id="interview-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Podcast Host</label>
              <select id="interview-host" style="background: #0f3460; border: 1px solid #444; color: white; padding: 8px;" disabled>
                <option value="comedian">The Comedian</option>
                <option value="philosopher">The Philosopher</option>
                <option value="scientist">The Scientist</option>
              </select>
            </div>
            <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Guest Name</label>
              <input type="text" id="interview-guest" placeholder="The User" value="The User" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-interview-btn" class="primary-btn" disabled>Start Podcast</button>
              <button id="stop-interview-btn" class="secondary-btn" style="display: none;" disabled>Stop Podcast</button>
            </div>
          </div>

          <div id="dm-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Adventure Setting</label>
              <input type="text" id="dm-setting" placeholder="e.g., 'A cyberpunk noodle shop in 2099'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-dm-btn" class="primary-btn" disabled>Start Adventure</button>
              <button id="stop-dm-btn" class="secondary-btn" style="display: none;" disabled>Stop Adventure</button>
            </div>
          </div>

          <div id="musical-mode-controls" class="improv-controls" style="display: none;">
            <div class="improv-buttons">
              <button id="start-musical-btn" class="primary-btn" disabled>Start Musical Improv</button>
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
            <button id="voice-btn" style="margin-right: 5px; background: #0f3460; border-color: #444; width: 40px;" title="Voice Input" disabled>🎤</button>
            <input 
              type="text" 
              id="user-input" 
              placeholder="Type a message (load a model to enable)..."
              autocomplete="off"
              disabled
            />
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

  const roastModeControls = document.getElementById('roast-mode-controls') as HTMLDivElement
  const storyModeControls = document.getElementById('story-mode-controls') as HTMLDivElement
  const debateModeControls = document.getElementById('debate-mode-controls') as HTMLDivElement

  const roastTargetInput = document.getElementById('roast-target') as HTMLInputElement
  const startRoastBtn = document.getElementById('start-roast-btn') as HTMLButtonElement
  const stopRoastBtn = document.getElementById('stop-roast-btn') as HTMLButtonElement

  const storyPromptInput = document.getElementById('story-prompt') as HTMLInputElement
  const startStoryBtn = document.getElementById('start-story-btn') as HTMLButtonElement
  const stopStoryBtn = document.getElementById('stop-story-btn') as HTMLButtonElement

  const debateTopicInput = document.getElementById('debate-topic') as HTMLInputElement
  const startDebateBtn = document.getElementById('start-debate-btn') as HTMLButtonElement
  const stopDebateBtn = document.getElementById('stop-debate-btn') as HTMLButtonElement

  // Musical Mode
  const musicalModeBtn = document.getElementById('musical-mode-btn') as HTMLButtonElement
  const musicalModeControls = document.getElementById('musical-mode-controls') as HTMLDivElement
  const startMusicalBtn = document.getElementById('start-musical-btn') as HTMLButtonElement
  const stopMusicalBtn = document.getElementById('stop-musical-btn') as HTMLButtonElement

  // Interview Mode (Podcast)
  const interviewModeBtn = document.getElementById('interview-mode-btn') as HTMLButtonElement
  const interviewModeControls = document.getElementById('interview-mode-controls') as HTMLDivElement
  const interviewHostSelect = document.getElementById('interview-host') as HTMLSelectElement
  const interviewGuestInput = document.getElementById('interview-guest') as HTMLInputElement
  const startInterviewBtn = document.getElementById('start-interview-btn') as HTMLButtonElement
  const stopInterviewBtn = document.getElementById('stop-interview-btn') as HTMLButtonElement

  // DM Mode
  const dmModeBtn = document.getElementById('dm-mode-btn') as HTMLButtonElement
  const dmModeControls = document.getElementById('dm-mode-controls') as HTMLDivElement
  const dmSettingInput = document.getElementById('dm-setting') as HTMLInputElement
  const startDmBtn = document.getElementById('start-dm-btn') as HTMLButtonElement
  const stopDmBtn = document.getElementById('stop-dm-btn') as HTMLButtonElement

  const chatModeControls = document.getElementById('chat-mode-controls') as HTMLDivElement;
  // Voice Input
  const voiceBtn = document.getElementById('voice-btn') as HTMLButtonElement

  // Refactor: Define managers using 'let' so they can be re-assigned on model change
  let groupChatManager: GroupChatManager;
  let director: Director;
  let scriptGenerator: ScriptGenerator;
  let memoryManager: MemoryManager | null = null;
  let currentMessageContentSpan: HTMLElement | null = null;
  let agentModelManager: AgentModelManager;
  let audioEngine: AudioEngine;
  let musicEngine: MusicEngine;
  let speechQueue: SpeechQueue;
  let voiceInput: VoiceInputManager;
  let stage: Stage;
  let lipSync: LipSync;
  let audioInitializing = false;

  let addMessage: (sender: string, message: string, color: string) => void;
  let speakAndVisualize: (text: string, agentId: string, options?: { steps?: number; seed?: number; speed?: number }) => Promise<void>;
    speakAndVisualize = async (text: string, agentId: string, options?: { steps?: number; seed?: number; speed?: number }) => {
        if(stage) stage.setActiveActor(agentId);
        if(audioEngine && speechQueue) {
            const audio = await audioEngine.synthesize(text, agentId, options);
            speechQueue.add(audio);
        }
    };


  // Active engine module state
  let activeEngineModule: any = webllm;

  // Initial population with default engine
  populateModelSelect(webllm)

  // Helper to add messages to the log
  addMessage = (sender: string, text: string, color: string) => {
    const div = document.createElement('div')
    div.className = 'message'
    div.innerHTML = `<strong style="color: ${color}">${sender}:</strong> ${text}`
    chatLog.appendChild(div)
    chatLog.scrollTop = chatLog.scrollHeight
  }

  speakAndVisualize = async (text: string, agentId: string, options?: { steps?: number; seed?: number; speed?: number }) => {
      const opts = {
          speed: options?.speed || 1.3,
          steps: options?.steps || 10,
          seed: options?.seed
      };

      try {
          if (audioEngine) {
              const audio = await audioEngine.synthesize(text, agentId, opts);
              speechQueue.add(audio);
              stage.setActiveActor(agentId);
          }
      } catch (e) {
          console.error('TTS Error:', e);
      }
  };

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

    const initializeManagers = async (modelId: string, engineModule: any) => {
      // 1. Initialize Audio Engine (once)
      if (!audioInitializing) {
        audioInitializing = true
        statusText.textContent = 'Initializing Audio Engine...'
        audioEngine = new AudioEngine()
        await audioEngine.init()

        musicEngine = new MusicEngine()
        voiceInput = new VoiceInputManager()

        speechQueue = new SpeechQueue(audioEngine)

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        lipSync = new LipSync(audioContext)

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
      memoryManager = new MemoryManager();
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
          const agent = agents.find(a => a.id === agentId)!;
          stage.setActiveActor(agentId);

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
        onSceneStop: () => {
          addMessage('System', '🛑 Scene stopped by user', '#ff6b6b');
          sceneTitleInput.disabled = false;
          sceneDescriptionInput.disabled = false;
          startImprovBtn.style.display = 'inline-block';
          stopImprovBtn.style.display = 'none';

          startReporterBtn.disabled = false;
          reporterTopicInput.disabled = false;
          reporterCategorySelect.disabled = false;
          reporterQuickTopicsSelect.disabled = false;
          stopReporterBtn.style.display = 'none';

          const floatingStop = document.getElementById('floating-stop-improv-btn');
          if (floatingStop) floatingStop.style.display = 'none';

          stopScriptBtn.style.display = 'none';
          generateScriptBtn.style.display = 'inline-block';
          loadExampleScriptBtn.style.display = 'inline-block';
          generateScriptBtn.disabled = false;
          loadExampleScriptBtn.disabled = false;
          scriptTopicInput.disabled = false;

          stopRoastBtn.style.display = 'none';
          startRoastBtn.style.display = 'inline-block';
          roastTargetInput.disabled = false;

          stopStoryBtn.style.display = 'none';
          startStoryBtn.style.display = 'inline-block';
          storyPromptInput.disabled = false;

          stopDebateBtn.style.display = 'none';
          startDebateBtn.style.display = 'inline-block';
          debateTopicInput.disabled = false;

          stopMusicalBtn.style.display = 'none';
          startMusicalBtn.style.display = 'inline-block';

          stopInterviewBtn.style.display = 'none';
          startInterviewBtn.style.display = 'inline-block';
          interviewHostSelect.disabled = false;
          interviewGuestInput.disabled = false;

          stopDmBtn.style.display = 'none';
          startDmBtn.style.display = 'inline-block';
          dmSettingInput.disabled = false;

          videoElement.pause();
          videoContainer.style.display = 'none';
        },
        getSeed: () => seedInput.value ? parseInt(seedInput.value) : undefined,
        onMusicControl: (action, bpm) => {
            if (musicEngine) {
                if (action === 'start') musicEngine.startBeat(bpm);
                else musicEngine.stopBeat();
            }
        },
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
      startMusicalBtn.disabled = false
      startInterviewBtn.disabled = false
      interviewHostSelect.disabled = false
      interviewGuestInput.disabled = false
      startDmBtn.disabled = false
      dmSettingInput.disabled = false

      modelSelect.disabled = false
      loadModelBtn.disabled = false
      if (modelSelectMain) modelSelectMain.disabled = false

      // Enable voice button if supported
      if (voiceInput && voiceInput.isSupported()) {
          voiceBtn.disabled = false;
      }

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

        el.onchange = () => {
          const agentId = selectId.replace('model-', '')
          agentModelManager.setModelForAgent(agentId, el.value)
          updateVRAMBadges()
        }
      }

      populateAssignmentSelect('model-comedian', defaultAgentModelMappings.find(m => m.agentId === 'comedian')?.modelId || '')
      populateAssignmentSelect('model-philosopher', defaultAgentModelMappings.find(m => m.agentId === 'philosopher')?.modelId || '')
      populateAssignmentSelect('model-scientist', defaultAgentModelMappings.find(m => m.agentId === 'scientist')?.modelId || '')

      updateVRAMBadges()

      // Enable Voice Button if supported
      if (voiceInput && voiceInput.isSupported()) {
          voiceBtn.disabled = false;
          voiceBtn.onclick = () => {
              if ((voiceBtn as any).classList.contains('listening')) {
                  voiceInput.stopListening();
                  voiceBtn.classList.remove('listening');
                  voiceBtn.style.background = '#0f3460';
              } else {
                  voiceBtn.classList.add('listening');
                  voiceBtn.style.background = '#ff6b6b';
                  voiceInput.startListening((text) => {
                      if (director && director.isSceneRunning()) {
                          director.handleInterrupt(text);
                          addMessage('You (Voice)', `(Interrupt) ${text}`, '#ffffff');
                      } else {
                          userInput.value = text;
                          userInput.focus();
                      }
                      voiceBtn.classList.remove('listening');
                      voiceBtn.style.background = '#0f3460';
                  }, (err) => {
                      console.error('Voice error:', err);
                      voiceBtn.classList.remove('listening');
                      voiceBtn.style.background = '#0f3460';
                  });
              }
          };
      }
    }

    loadModelBtn.addEventListener('click', async () => {
        const modelId = modelSelect.value;
        loadingDiv.style.display = 'flex'; // Show loading
        loadModelBtn.disabled = true;

        try {
            await initializeManagers(modelId, webllm);
        } catch (e) {
            console.error(e);
            addMessage('System', 'Failed to load model: ' + e, '#ff0000');
        } finally {
            loadingDiv.style.display = 'none';
            loadModelBtn.disabled = false;
        }
    });

    // --- EVENT LISTENERS ---

    // Define UI Reset Helper
    const resetModeUI = () => {
        // Hide all control panels
        chatModeControls.style.display = 'none';
        const panels = document.querySelectorAll('.improv-controls');
        panels.forEach(p => (p as HTMLElement).style.display = 'none');

        // Deactivate all mode buttons
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(b => b.classList.remove('active'));
    };

    // Chat Mode
    const chatModeBtn = document.getElementById('chat-mode-btn') as HTMLButtonElement;
    chatModeBtn.addEventListener('click', () => {
        resetModeUI();
        chatModeBtn.classList.add('active');
        chatModeControls.style.display = 'flex';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    // Improv Mode
    const improvModeBtn = document.getElementById('improv-mode-btn') as HTMLButtonElement;
    const improvModeControls = document.getElementById('improv-mode-controls') as HTMLDivElement;
    improvModeBtn.addEventListener('click', () => {
        resetModeUI();
        improvModeBtn.classList.add('active');
        improvModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startImprovBtn.addEventListener('click', async () => {
        if (!director) return;
        startImprovBtn.style.display = 'none';
        stopImprovBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'improv',
            title: sceneTitleInput.value || 'Untitled Scene',
            description: sceneDescriptionInput.value || 'A random improv scene.',
            config: { chaosLevel: parseInt(chaosSlider.value) }
        });
    });

    stopImprovBtn.addEventListener('click', () => director && director.stopScene());

    // Watcher Mode (Media Reaction)
    const watcherModeBtn = document.getElementById('watcher-mode-btn') as HTMLButtonElement;
    watcherModeBtn.addEventListener('click', async () => {
        resetModeUI();
        watcherModeBtn.classList.add('active');
        chatModeControls.style.display = 'flex';

        if (director && director.isSceneRunning()) director.stopScene();

        await director.playScenario({
            type: 'reaction',
            title: 'Reaction to Video',
            description: 'Agents watching a video.',
            config: {
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                triggers: [
                    { timestamp: 10, prompt: '(Video: The bunny wakes up. Comment on how cute/annoying it is.)', executed: false },
                    { timestamp: 30, prompt: '(Video: The bunny throws an apple. Laugh at the slapstick humor.)', executed: false }
                ]
            }
        });
    });

    // Reporter Mode
    const reporterModeBtn = document.getElementById('reporter-mode-btn') as HTMLButtonElement;
    const reporterModeControls = document.getElementById('reporter-mode-controls') as HTMLDivElement;
    reporterModeBtn.addEventListener('click', () => {
        resetModeUI();
        reporterModeBtn.classList.add('active');
        reporterModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startReporterBtn.addEventListener('click', async () => {
        if (!director) return;
        startReporterBtn.style.display = 'none';
        stopReporterBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'reporter',
            title: reporterTopicInput.value || 'Breaking News',
            description: 'A news report.',
            config: {
                reporterTopic: reporterTopicInput.value,
                reporterContext: articleTextTextarea.value || 'No context provided.',
                reporterCategory: reporterCategorySelect.value as any
            }
        });
    });

    stopReporterBtn.addEventListener('click', () => director && director.stopScene());

    // Script Mode
    const scriptModeBtn = document.getElementById('script-mode-btn') as HTMLButtonElement;
    const scriptModeControls = document.getElementById('script-mode-controls') as HTMLDivElement;
    scriptModeBtn.addEventListener('click', () => {
        resetModeUI();
        scriptModeBtn.classList.add('active');
        scriptModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    generateScriptBtn.addEventListener('click', async () => {
        if (!director) return;
        generateScriptBtn.disabled = true;
        generateScriptBtn.textContent = 'Generating...';

        try {
            const topic = scriptTopicInput.value || 'A funny situation';
            const script = await scriptGenerator.generate(topic);

            generateScriptBtn.textContent = 'Generate & Play';
            generateScriptBtn.disabled = false;
            generateScriptBtn.style.display = 'none';
            stopScriptBtn.style.display = 'inline-block';

            await director.playScenario({
                type: 'script',
                title: topic,
                description: 'A generated script.',
                config: { generatedScript: script }
            });
        } catch (e) {
            console.error(e);
            generateScriptBtn.disabled = false;
            generateScriptBtn.textContent = 'Generate & Play';
            addMessage('System', 'Failed to generate script.', '#ff0000');
        }
    });

    stopScriptBtn.addEventListener('click', () => director && director.stopScene());

    // Roast Mode
    roastModeBtn.addEventListener('click', () => {
        resetModeUI();
        roastModeBtn.classList.add('active');
        roastModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startRoastBtn.addEventListener('click', async () => {
        if (!director) return;
        startRoastBtn.style.display = 'none';
        stopRoastBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'roast',
            title: 'Roast Battle',
            description: 'Agents roasting a target.',
            config: { roastTarget: roastTargetInput.value || 'The Audience' }
        });
    });

    stopRoastBtn.addEventListener('click', () => director && director.stopScene());

    // Story Mode
    storyModeBtn.addEventListener('click', () => {
        resetModeUI();
        storyModeBtn.classList.add('active');
        storyModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startStoryBtn.addEventListener('click', async () => {
        if (!director) return;
        startStoryBtn.style.display = 'none';
        stopStoryBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'story',
            title: 'Collaborative Story',
            description: 'Agents telling a story.',
            config: { initialPrompt: storyPromptInput.value }
        });
    });

    stopStoryBtn.addEventListener('click', () => director && director.stopScene());

    // Debate Mode
    debateModeBtn.addEventListener('click', () => {
        resetModeUI();
        debateModeBtn.classList.add('active');
        debateModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startDebateBtn.addEventListener('click', async () => {
        if (!director) return;
        startDebateBtn.style.display = 'none';
        stopDebateBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'debate',
            title: 'Debate Club',
            description: 'Agents debating a topic.',
            config: { debateTopic: debateTopicInput.value }
        });
    });

    stopDebateBtn.addEventListener('click', () => director && director.stopScene());

    // Musical Mode
    musicalModeBtn.addEventListener('click', () => {
        resetModeUI();
        musicalModeBtn.classList.add('active');
        musicalModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startMusicalBtn.addEventListener('click', async () => {
        if (!director) return;
        startMusicalBtn.style.display = 'none';
        stopMusicalBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'musical',
            title: 'Musical Improv',
            description: 'Agents rapping to a beat',
        });
    });

    stopMusicalBtn.addEventListener('click', () => director && director.stopScene());

    // Podcast Mode (Interview)
    interviewModeBtn.addEventListener('click', () => {
        resetModeUI();
        interviewModeBtn.classList.add('active');
        interviewModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startInterviewBtn.addEventListener('click', async () => {
        if (!director) return;
        startInterviewBtn.style.display = 'none';
        stopInterviewBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'interview',
            title: 'The Podcast',
            description: 'An interview session.',
            config: {
                interviewHost: interviewHostSelect.value,
                interviewGuest: interviewGuestInput.value
            }
        });
    });

    stopInterviewBtn.addEventListener('click', () => director && director.stopScene());

    // DM Mode
    dmModeBtn.addEventListener('click', () => {
        resetModeUI();
        dmModeBtn.classList.add('active');
        dmModeControls.style.display = 'block';
        if (director && director.isSceneRunning()) director.stopScene();
    });

    startDmBtn.addEventListener('click', async () => {
        if (!director) return;
        startDmBtn.style.display = 'none';
        stopDmBtn.style.display = 'inline-block';

        await director.playScenario({
            type: 'dungeon_master',
            title: 'Dungeon Master',
            description: 'An interactive RPG session.',
            config: { dmSetting: dmSettingInput.value }
        });
    });

    stopDmBtn.addEventListener('click', () => director && director.stopScene());

    // Handle Send (User Input)
    const handleSend = async () => {
        const text = userInput.value.trim();
        if (!text) return;
        userInput.value = '';

        if (director && director.isSceneRunning()) {
            director.handleUserMessage(text);
            addMessage('You', text, '#ffffff');
        } else {
            addMessage('You', text, '#ffffff');
            try {
                 await groupChatManager.chat(text, (sentence) => {
                     const agent = groupChatManager.getCurrentAgent();
                     speakAndVisualize(sentence, agent.id);
                 });
            } catch (e) {
                console.error(e);
                addMessage('System', 'Error generating response.', '#ff0000');
            }
        }
    };

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Settings Modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
        if (memoryManager) {
            const creds = memoryManager.getCloudCredentials();
            if (creds.token) hfTokenInput.value = creds.token;
            if (creds.repoId) hfRepoInput.value = creds.repoId;
        }
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', async () => {
        const token = hfTokenInput.value.trim();
        const repo = hfRepoInput.value.trim();

        settingsStatus.textContent = 'Validating...';
        settingsStatus.style.color = '#ffd700';

        if (memoryManager) {
             memoryManager.setCloudCredentials(token, repo);
             const valid = await memoryManager.validateCloudCredentials();
             if (valid) {
                 settingsStatus.textContent = 'Success! Credentials valid.';
                 settingsStatus.style.color = '#4ecdc4';
                 setTimeout(() => settingsModal.style.display = 'none', 1000);
             } else {
                 settingsStatus.textContent = 'Invalid Token.';
                 settingsStatus.style.color = '#ff6b6b';
             }
        }
    });

    // Save Episode
    saveEpisodeBtn.addEventListener('click', () => {
        if (memoryManager) {
            const history = groupChatManager.getHistory();
            const id = new Date().toISOString().replace(/[:.]/g, '-');
            memoryManager.saveEpisode(id, {
                timestamp: new Date().toISOString(),
                history: history
            });
            addMessage('System', `Episode saved locally (and to cloud if configured). ID: ${id}`, '#4ecdc4');
        }
    });

    // Initial load
    if (defaultModelId) {
        await initializeManagers(defaultModelId, activeEngineModule);
    }

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