/**
 * Returns the main application HTML template.
 */
export function getAppTemplate(): string {
  return `
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
              <label style="color: #888; font-size: 0.8em;">Profanity</label>
              <input type="range" id="profanity-level" min="0" max="3" value="2" style="flex: 1;">
              <span id="profanity-val" style="color: #ffd700; font-size: 0.9em; width: 80px;">🤬 Gritty</span>
            </div>

            <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
              <label style="color: #888; font-size: 0.8em;">Language</label>
              <select id="language-select" style="flex: 1; background: #0f3460; border: 1px solid #444; color: white; padding: 2px 5px;">
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
                <option value="Chinese">Chinese</option>
                <option value="Russian">Russian</option>
              </select>
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
            <button id="autonomous-mode-btn" class="mode-btn">Auto Mode</button>
            <button id="trivia-mode-btn" class="mode-btn">Trivia Mode</button>
            <button id="dream-mode-btn" class="mode-btn">Dream Mode</button>
            <button id="vision-mode-btn" class="mode-btn">Vision Mode</button>
            <button id="trial-mode-btn" class="mode-btn">The Trial</button>
            <button id="interrogation-mode-btn" class="mode-btn">Interrogation</button>
            <button id="tech-mode-btn" class="mode-btn">Tech Support</button>
            <button id="historical-mode-btn" class="mode-btn">Historical</button>
            <button id="commentary-mode-btn" class="mode-btn">Commentary</button>
            <button id="code-mode-btn" class="mode-btn">Code Review</button>
            <button id="therapy-mode-btn" class="mode-btn">Therapy</button>
            <button id="philosopher-mode-btn" class="mode-btn">Phil. Stone</button>
            <button id="alien-mode-btn" class="mode-btn">Alien Contact</button>
            <button id="time-mode-btn" class="mode-btn">Time Travel</button>
            <button id="chef-mode-btn" class="mode-btn">Chef's Kitchen</button>
            <button id="medical-mode-btn" class="mode-btn">Medical Drama</button>
            <button id="haunted-mode-btn" class="mode-btn">Haunted House</button>
            <button id="sports-mode-btn" class="mode-btn">SportsCast</button>
            <button id="reality-mode-btn" class="mode-btn">Reality TV</button>
            <button id="auction-mode-btn" class="mode-btn">Auction House</button>
            <button id="escape-mode-btn" class="mode-btn">Escape Room</button>
            <button id="lightning-round-mode-btn" class="mode-btn">⚡ Lightning Round</button>
          </div>

          <div id="code-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Programming Language</label>
              <input type="text" id="code-language" placeholder="e.g., 'TypeScript', 'Python'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-code-btn" class="primary-btn" disabled>Start Code Review</button>
              <button id="stop-code-btn" class="secondary-btn" style="display: none;" disabled>Stop Review</button>
            </div>
          </div>

          <div id="therapy-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">What's on your mind?</label>
              <input type="text" id="therapy-topic" placeholder="e.g., 'Imposter Syndrome', 'Burnout'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-therapy-btn" class="primary-btn" disabled>Start Session</button>
              <button id="stop-therapy-btn" class="secondary-btn" style="display: none;" disabled>End Session</button>
            </div>
          </div>

          <div id="philosopher-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Paradox Topic</label>
              <input type="text" id="philosopher-topic" placeholder="e.g., 'The Trolley Problem', 'Ship of Theseus'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-philosopher-btn" class="primary-btn" disabled>Start Debate</button>
              <button id="stop-philosopher-btn" class="secondary-btn" style="display: none;" disabled>Stop Debate</button>
            </div>
          </div>

          <div id="alien-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Scenario Title</label>
              <input type="text" id="alien-topic" placeholder="e.g., 'Signal from Kepler-22b'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-alien-btn" class="primary-btn" disabled>Open Channel</button>
              <button id="stop-alien-btn" class="secondary-btn" style="display: none;" disabled>Close Channel</button>
            </div>
          </div>

          <div id="time-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Time Era</label>
              <input type="text" id="time-era" placeholder="e.g., 'Ancient Rome', 'The 90s'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-time-btn" class="primary-btn" disabled>Start Time Travel</button>
              <button id="stop-time-btn" class="secondary-btn" style="display: none;" disabled>Stop Time Travel</button>
            </div>
          </div>

          <div id="chef-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">The Dish</label>
              <input type="text" id="chef-dish" placeholder="e.g., 'Burnt Toast', 'Raw Chicken'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-chef-btn" class="primary-btn" disabled>Start Service</button>
              <button id="stop-chef-btn" class="secondary-btn" style="display: none;" disabled>Stop Service</button>
            </div>
          </div>

          <div id="medical-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Medical Condition</label>
              <input type="text" id="medical-condition" placeholder="e.g., 'Alien Parasite', 'Hiccups'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-medical-btn" class="primary-btn" disabled>Start Surgery</button>
              <button id="stop-medical-btn" class="secondary-btn" style="display: none;" disabled>Stop Surgery</button>
            </div>
          </div>

          <div id="haunted-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Location</label>
              <input type="text" id="haunted-setting" placeholder="e.g., 'A Creepy Doll Factory'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-haunted-btn" class="primary-btn" disabled>Enter House</button>
              <button id="stop-haunted-btn" class="secondary-btn" style="display: none;" disabled>Escape</button>
            </div>
          </div>

          <div id="sports-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Mundane Activity</label>
              <input type="text" id="sports-activity" placeholder="e.g., 'Doing Taxes', 'Making Toast'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-sports-btn" class="primary-btn" disabled>Start Commentary</button>
              <button id="stop-sports-btn" class="secondary-btn" style="display: none;" disabled>Stop Commentary</button>
            </div>
          </div>

          <div id="reality-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Show Name</label>
              <input type="text" id="reality-show-name" placeholder="e.g., 'Keeping Up With The AI'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-reality-btn" class="primary-btn" disabled>Start Filming</button>
              <button id="stop-reality-btn" class="secondary-btn" style="display: none;" disabled>Cut!</button>
            </div>
          </div>

          <div id="auction-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Auction Item</label>
              <input type="text" id="auction-item" placeholder="e.g., 'A signed photo of a potato'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-auction-btn" class="primary-btn" disabled>Start Auction</button>
              <button id="stop-auction-btn" class="secondary-btn" style="display: none;" disabled>Stop Auction</button>
            </div>
          </div>

          <div id="escape-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Escape Room Setting</label>
              <input type="text" id="escape-setting" placeholder="e.g., 'A laser-filled vault'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-escape-btn" class="primary-btn" disabled>Start Escape Room</button>
              <button id="stop-escape-btn" class="secondary-btn" style="display: none;" disabled>Stop Escape Room</button>
            </div>
          </div>

          <div id="lightning-round-mode-controls" class="improv-controls" style="display: none;">
            <div class="input-group">
              <label style="color: #ff00ff; font-size: 0.9em; margin-bottom: 5px; font-weight: bold;">⚡ Lightning Round Roast</label>
              <label style="color: #888; font-size: 0.85em; margin-bottom: 5px;">Preset Category</label>
              <select id="lightning-round-category" style="background: #0f3460; border: 1px solid #444; color: white; padding: 4px 6px; border-radius: 4px; width: 100%;" disabled>
                <option value="">— random —</option>
                <option value="bad dating stories">Bad dating stories</option>
                <option value="why pineapple belongs on pizza">Why pineapple belongs on pizza</option>
                <option value="AI taking over the world">AI taking over the world</option>
                <option value="worst tech support fails">Worst tech support fails</option>
                <option value="celebrity gossip gone wrong">Celebrity gossip gone wrong</option>
                <option value="food crimes against humanity">Food crimes against humanity</option>
                <option value="why your boss is actually an alien">Why your boss is actually an alien</option>
                <option value="things you should never google">Things you should never google</option>
              </select>
            </div>
            <div class="input-group">
              <label style="color: #888; font-size: 0.85em; margin-bottom: 5px;">…or type a custom topic</label>
              <input type="text" id="lightning-round-topic" placeholder="e.g., 'why cats are secretly evil'" autocomplete="off" disabled />
            </div>
            <div class="input-group">
              <label style="color: #888; font-size: 0.85em; margin-bottom: 5px;">Rounds (4–20)</label>
              <input type="number" id="lightning-round-rounds" value="12" min="4" max="20" style="background: #0f3460; border: 1px solid #444; color: white; padding: 4px 6px; border-radius: 4px; width: 80px;" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-lightning-round-btn" class="primary-btn" disabled>⚡ Start Lightning Round</button>
              <button id="stop-lightning-round-btn" class="secondary-btn" style="display: none;" disabled>Stop</button>
            </div>
          </div>

          <div id="historical-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Figure 1 (for Comedian)</label>
              <input type="text" id="historical-figure-1" placeholder="e.g., 'Napoleon'" autocomplete="off" disabled />
            </div>
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Figure 2 (for Philosopher)</label>
              <input type="text" id="historical-figure-2" placeholder="e.g., 'Genghis Khan'" autocomplete="off" disabled />
            </div>
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Debate Topic</label>
              <input type="text" id="historical-topic" placeholder="e.g., 'The best strategy for world domination'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-historical-btn" class="primary-btn" disabled>Start Reenactment</button>
              <button id="stop-historical-btn" class="secondary-btn" style="display: none;" disabled>Stop Reenactment</button>
            </div>
          </div>

          <div id="commentary-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Commentary Target</label>
              <input type="text" id="commentary-target" placeholder="e.g., 'The User\'s Code', 'A Chess Game'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-commentary-btn" class="primary-btn" disabled>Start Commentary</button>
              <button id="stop-commentary-btn" class="secondary-btn" style="display: none;" disabled>Stop Commentary</button>
            </div>
          </div>

          <div id="autonomous-mode-controls" class="improv-controls" style="display: none;">
            <div class="improv-buttons">
              <button id="start-autonomous-btn" class="primary-btn" disabled>Start Autonomous</button>
              <button id="stop-autonomous-btn" class="secondary-btn" style="display: none;" disabled>Stop Autonomous</button>
            </div>
          </div>

          <div id="trivia-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Trivia Topic</label>
              <input type="text" id="trivia-topic" placeholder="e.g., 'Science Fiction Movies'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-trivia-btn" class="primary-btn" disabled>Start Trivia</button>
              <button id="stop-trivia-btn" class="secondary-btn" style="display: none;" disabled>Stop Trivia</button>
            </div>
          </div>

          <div id="dream-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Dream Theme</label>
              <input type="text" id="dream-theme" placeholder="e.g., 'Flying through a candy city'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-dream-btn" class="primary-btn" disabled>Start Dream</button>
              <button id="stop-dream-btn" class="secondary-btn" style="display: none;" disabled>Stop Dream</button>
            </div>
          </div>

          <div id="vision-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Image URL (Direct Link)</label>
              <input type="text" id="vision-url" placeholder="https://example.com/image.jpg" autocomplete="off" disabled />
            </div>
             <div class="input-group" style="margin-top:5px;">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Or Upload Image</label>
              <input type="file" id="vision-file" accept="image/*" style="color: #ccc;" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-vision-btn" class="primary-btn" disabled>Analyze Image</button>
              <button id="stop-vision-btn" class="secondary-btn" style="display: none;" disabled>Stop Vision</button>
            </div>
          </div>

          <div id="trial-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">The Crime</label>
              <input type="text" id="trial-topic" placeholder="e.g., 'Eating the last cookie'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-trial-btn" class="primary-btn" disabled>Start Trial</button>
              <button id="stop-trial-btn" class="secondary-btn" style="display: none;" disabled>Stop Trial</button>
            </div>
          </div>

          <div id="interrogation-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">The Crime</label>
              <input type="text" id="interrogation-crime" placeholder="e.g., 'Stealing the cookies'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-interrogation-btn" class="primary-btn" disabled>Start Interrogation</button>
              <button id="stop-interrogation-btn" class="secondary-btn" style="display: none;" disabled>Stop Interrogation</button>
            </div>
          </div>

          <div id="tech-mode-controls" class="improv-controls" style="display: none;">
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Tech Issue</label>
              <input type="text" id="tech-issue" placeholder="e.g., 'My printer is on fire'" autocomplete="off" disabled />
            </div>
            <div class="improv-buttons">
              <button id="start-tech-btn" class="primary-btn" disabled>Start Tech Support</button>
              <button id="stop-tech-btn" class="secondary-btn" style="display: none;" disabled>Hang Up</button>
            </div>
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
             <div class="input-group">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Music Style</label>
              <input type="text" id="musical-style" placeholder="e.g., 'Old School Hip Hop', 'Jazz Scat'" autocomplete="off" disabled />
            </div>
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
            <div class="input-group" style="margin-top: 8px;">
              <label style="color: #888; font-size: 0.9em; margin-bottom: 5px;">Or paste a script (JSON format)</label>
              <textarea
                id="script-text"
                placeholder='[{"speaker":"comedian","line":"..."},{"speaker":"philosopher","line":"..."},{"speaker":"scientist","line":"..."}]  — speakers: comedian, philosopher, scientist, techBro, robot'
                rows="4"
                style="width: 100%; background: #0f3460; border: 1px solid #444; color: white; padding: 8px; font-size: 0.8em; resize: vertical;"
                disabled
              ></textarea>
            </div>
            <div class="improv-buttons">
              <button id="generate-script-btn" class="primary-btn" disabled>Generate & Play</button>
              <button id="load-example-script-btn" class="secondary-btn" disabled>Load Example</button>
              <button id="play-script-btn" class="secondary-btn" disabled>Play Pasted Script</button>
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
    </div>`;
}
