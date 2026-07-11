export function getAppTemplate(): string {
  return `
    <div class="container">
      <h1>The Jokesters</h1>
      <p class="subtitle">Multi-Agent Chat powered by Llama-3 & WebGPU</p>
      <div id="loading" class="loading">
        <!-- Model picker (shown before loading starts) -->
        <div id="model-picker" style="width:100%;max-width:480px;margin:0 auto;">
          <h3 style="color:#4ecdc4;margin:0 0 6px;font-size:1.1em;">Choose Your AI Model</h3>
          <p style="color:#aaa;font-size:0.82em;margin:0 0 12px;">Models run in your browser. We'll probe your GPU and recommend a path before any download.</p>

          <!-- Guided recommendation (filled by modelPicker after capability probe) -->
          <div id="model-guide-card" class="model-guide-card" aria-live="polite">
            <div class="model-guide-probe" id="model-guide-probe">🔍 Checking GPU…</div>
            <div id="model-guide-body" style="display:none;">
              <div class="model-guide-device" id="model-guide-device"></div>
              <div class="model-guide-primary">
                <span class="model-guide-badge">Recommended</span>
                <strong id="model-guide-primary-name"></strong>
                <p id="model-guide-primary-reason" class="model-guide-reason"></p>
                <button type="button" id="use-primary-btn" class="model-guide-btn model-guide-btn-primary">Use recommended</button>
              </div>
              <div class="model-guide-fallback">
                <span class="model-guide-badge model-guide-badge-safe">Safe fallback</span>
                <strong id="model-guide-fallback-name"></strong>
                <p id="model-guide-fallback-reason" class="model-guide-reason"></p>
                <button type="button" id="use-fallback-btn" class="model-guide-btn">Use safe fallback</button>
              </div>
              <p id="model-guide-remembered" class="model-guide-remembered" style="display:none;"></p>
            </div>
          </div>

          <!-- Engine selector -->
          <select id="engine-select" style="width:100%;padding:9px 10px;border-radius:6px;border:1px solid #444;background:#0f3460;color:white;font-size:0.9em;margin-bottom:8px;">
            <option value="auto">🤖 Auto (MLC → Transformers.js → llama.cpp)</option>
            <option value="mlc">⚡ MLC WebLLM (Fastest WebGPU)</option>
            <option value="transformers">🤗 Transformers.js (HF Hub Models)</option>
            <option value="llamacpp">🧠 llama.cpp (Any GGUF)</option>
            <option value="api">🌐 API fallback (OpenAI-compatible)</option>
          </select>

          <!-- Engine info display -->
          <div id="engine-info" style="color:#888;font-size:0.78em;margin-bottom:12px;">
            Speed: Auto | Models: Best available | VRAM: Auto
          </div>

          <!-- Engine capability indicator -->
          <div id="engine-capabilities" style="color:#888;font-size:0.78em;margin-bottom:12px;"></div>

          <!-- Blessed presets only (3–5 curated) -->
          <select id="model-select-launch" style="width:100%;padding:9px 10px;border-radius:6px;border:1px solid #444;background:#0f3460;color:white;font-size:0.9em;margin-bottom:8px;">
            <option value="Hermes-3-Llama-3.2-3B-q4f32_1-MLC" selected>Hermes-3 3B q4f32 · MLC · ~2 GB · no f16 needed ★ Safe</option>
            <option value="Hermes-3-Llama-3.2-3B-q4f16_1-MLC">Hermes-3 3B · MLC · ~2 GB · needs f16 ★ Fast</option>
            <option value="vicuna-7b-q4f32-webllm-vps">Vicuna 7B q4f32 · MLC · ~4 GB · richer replies</option>
            <option value="Qwen2.5-0.5B-Instruct-ONNX">Qwen 2.5 0.5B · Transformers.js · ~1.5 GB · ultra-low</option>
            <option value="vicuna-7b-v1.5-GGUF">Vicuna 7B · llama.cpp WASM · CPU · no WebGPU</option>
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
          <p id="model-launch-hint" style="color:#888;font-size:0.78em;min-height:1.2em;margin:0 0 6px;"></p>
          <p id="model-download-estimate" class="model-download-estimate" style="color:#ffd700;font-size:0.8em;margin:0 0 12px;min-height:1.4em;"></p>

          <!-- Advanced VRAM Settings (hidden by default — progressive disclosure) -->
          <details id="advanced-vram-settings" class="vram-settings-panel">
            <summary>⚙️ Advanced VRAM Settings (optional)</summary>
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
              <div class="vram-setting-row">
                <label>3D Renderer</label>
                <select id="renderer-mode-select">
                  <option value="webgl" selected>WebGL2 (default, recommended)</option>
                  <option value="webgpu">WebGPU (experimental)</option>
                </select>
              </div>
              <p class="vram-settings-note">
                <strong>Sliding Window:</strong> Reduces VRAM by only keeping recent tokens in attention.
                "Auto" uses half your context window. Attention sinks keep first N tokens for coherence.
              </p>
              <p class="vram-settings-note">
                <strong>3D Renderer:</strong> Only affects avatar/stage drawing — LLM inference always uses WebGPU.
                WebGL2 is universal and easiest to debug. WebGPU rendering is opt-in and shares GPU memory with the
                model, so avoid it on ~4 GB cards. Applies on next "Load Model &amp; Start".
              </p>
            </div>
          </details>

          <div id="storage-info" style="color:#888;font-size:0.78em;margin-bottom:8px;min-height:1.5em;"></div>
          <button id="clear-cache-btn" style="width:100%;padding:8px;background:#2a2a4e;color:#ff6b6b;font-size:0.85em;border:1px solid #444;border-radius:6px;cursor:pointer;margin-bottom:8px;display:none;">Clear Model Cache</button>
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

            <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
              <label style="color: #888; font-size: 0.8em;">Memory Depth</label>
              <input type="range" id="memory-depth-slider" min="4" max="30" value="15" step="1" style="flex: 1;">
              <span id="memory-depth-val" style="color: #9b59b6; font-size: 0.8em; width: 52px;">15 msgs</span>
            </div>

            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px; border-top: 1px solid #444; padding-top: 10px;">
              <label style="color: #888; font-size: 0.8em;">Profile</label>
              <input type="text" id="user-profile-input" value="default" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px; font-size: 0.8em; border-radius: 4px;">
              <button id="switch-profile-btn" style="background: #4ecdc4; color: #0a0a1a; border: none; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; cursor: pointer;">Switch</button>
            </div>

            <!-- Sound effects -->
            <div class="sfx-settings" style="margin-top: 10px; border-top: 1px solid #444; padding-top: 10px;">
              <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 6px;">
                <label style="color: #888; font-size: 0.8em; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" id="sfx-enabled" checked style="cursor: pointer;">
                  SFX
                </label>
                <input type="range" id="sfx-volume" min="0" max="100" value="70" style="flex: 1;" title="SFX volume">
                <span id="sfx-volume-val" style="color: #4ecdc4; font-size: 0.8em; width: 32px;">70%</span>
                <select id="sfx-mode" style="background: #0f3460; border: 1px solid #444; color: white; padding: 2px 4px; font-size: 0.75em; border-radius: 4px;" title="Playback mode">
                  <option value="duck" selected>Duck TTS</option>
                  <option value="overlay">Overlay</option>
                  <option value="interrupt">Interrupt</option>
                </select>
              </div>
              <div id="sfx-preview-row" class="sfx-preview-row" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
            </div>
          </div>

          <!-- VRAM / Context Info Bar -->
          <div id="vram-info-bar" class="vram-info-bar">
            <span id="memory-depth-text">Depth: —</span>
            <span id="ctx-info-text">Context: —</span>
            <span id="token-budget-text">Max tokens: 96</span>
            <span id="vram-kv-text"></span>
            <span id="prerender-hud-text" title="Prerender queue · inter-turn gap · time-to-first-audio">Prerender: —</span>
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
          <div id="sync-status-indicator" style="font-size: 0.8em; margin-top: 5px; text-align: right; color: #888; display: flex; justify-content: flex-end; align-items: center; gap: 5px;">

            <span id="sync-icon">☁️</span>
            <span id="sync-text">Not synced</span>
            <button id="cloud-dashboard-btn" style="background: none; border: 1px solid #4ecdc4; color: #4ecdc4; border-radius: 4px; padding: 2px 5px; cursor: pointer; font-size: 0.9em; margin-left: 10px;">Dashboard</button>

          </div>
          
          <!-- Improv Mode Controls -->
          <div id="improv-mode-controls" class="improv-controls" style="display: none;">
            <div id="mode-browser" class="mode-browser" role="region" aria-label="Mode browser">
              <div class="mode-browser-toolbar">
                <input
                  type="search"
                  id="mode-search"
                  class="mode-search-input"
                  placeholder="Search modes (title, tags, category)…"
                  autocomplete="off"
                  aria-label="Search modes"
                />
              </div>
              <div class="mode-browser-section" id="mode-featured-section">
                <h4 class="mode-browser-heading">Featured</h4>
                <div id="mode-featured-grid" class="mode-browser-grid mode-browser-grid-featured"></div>
              </div>
              <div class="mode-browser-section" id="mode-recent-section" style="display: none;">
                <h4 class="mode-browser-heading">Recently used</h4>
                <div id="mode-recent-grid" class="mode-browser-grid"></div>
              </div>
              <div class="mode-browser-categories" id="mode-category-tabs" role="tablist" aria-label="Mode categories"></div>
              <div id="mode-list" class="mode-browser-list" role="listbox" aria-label="All modes"></div>
            </div>
            <input type="hidden" id="selected-mode-id" value="improv" />
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

          <!-- Episode export / import / replay (shown after scene stop or import) -->
          <div id="episode-export-bar" class="episode-export-bar" style="display: none;" role="region" aria-label="Episode export">
            <span class="episode-export-meta">Episode ready</span>
            <div class="episode-export-actions">
              <button type="button" id="export-episode-json-btn" class="episode-btn" title="Download .jokesters.json">⬇️ JSON</button>
              <button type="button" id="export-episode-md-btn" class="episode-btn" title="Download Markdown transcript">⬇️ MD</button>
              <button type="button" id="export-episode-copy-btn" class="episode-btn" title="Copy plain text">📋 Copy</button>
              <button type="button" id="replay-episode-btn" class="episode-btn episode-btn-primary" title="Replay with TTS only (no LLM)">▶️ Replay</button>
              <button type="button" id="stop-replay-btn" class="episode-btn episode-btn-danger" style="display: none;">⏹ Stop Replay</button>
              <button type="button" id="import-episode-btn" class="episode-btn" title="Import .jokesters.json">📥 Import</button>
              <button type="button" id="dismiss-episode-bar-btn" class="episode-btn episode-btn-ghost" title="Dismiss">✕</button>
            </div>
            <input type="file" id="import-episode-input" accept=".json,.jokesters.json,application/json" style="display:none" />
          </div>
          <div class="episode-always-row">
            <button type="button" id="import-episode-always-btn" class="episode-btn episode-btn-ghost" title="Import episode for TTS-only replay">📥 Import Episode</button>
          </div>
          
          <div class="agent-info">
            <p>Next speaker: <span id="next-agent">-</span></p>
          </div>
        </div>
      </div>
    </div>
  `
}

