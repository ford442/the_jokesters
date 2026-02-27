import './style.css'
import { GroupChatManager } from './GroupChatManager'

import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
// WebLLM is now lazy-loaded when needed

import { AudioEngine } from './audio/AudioEngine'
import { MusicEngine } from './audio/MusicEngine'
import { SpeechQueue } from './audio/SpeechQueue'
import { VoiceInputManager } from './audio/VoiceInputManager'
import { AgentModelManager } from './AgentModelManager'
import { Director, type DirectorCallbacks } from './Director/Director'
import { ScriptGenerator } from './Director/ScriptGenerator'
import { MemoryManager } from './Director/MemoryManager'

import { agents, profanityLevels, defaultAgentModelMappings } from './config/agents'
import { defaultModelId, applyModelConfigsToEngine, getAvailableModels, populateModelSelect } from './config/models'
import { getAppTemplate } from './ui/htmlTemplate'
import { startBeat, stopBeat } from './ui/BeatGenerator'
import { collectModeElements, enableModeControls, registerModeHandlers } from './ui/ModeHandlers'

// Export interface for ScriptBeat
export interface ScriptBeat {
  speaker: string;
  line: string;
}

// WebLLM module will be loaded lazily
let webllmModule: typeof import('@mlc-ai/web-llm') | null = null

/**
 * Lazy load WebLLM engine
 */
async function loadWebLLM(): Promise<typeof import('@mlc-ai/web-llm')> {
  if (!webllmModule) {
    webllmModule = await import('@mlc-ai/web-llm')
    // Apply configs after loading
    applyModelConfigsToEngine(webllmModule)
  }
  return webllmModule
}

// Initialize the app
async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!
  app.innerHTML = getAppTemplate()

  // Core DOM elements
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
  const loadModelBtn = document.getElementById('load-model-btn') as HTMLButtonElement
  const nextAgentSpan = document.getElementById('next-agent')!
  const chaosSlider = document.getElementById('director-chaos') as HTMLInputElement
  const seedInput = document.getElementById('global-seed') as HTMLInputElement
  const profanitySlider = document.getElementById('profanity-level') as HTMLInputElement
  const languageSelect = document.getElementById('language-select') as HTMLSelectElement
  const voiceBtn = document.getElementById('voice-btn') as HTMLButtonElement

  // Collect all mode-related DOM elements
  const modeEl = collectModeElements()

  // Manager state
  let groupChatManager: GroupChatManager;
  let director: Director;
  let scriptGenerator: ScriptGenerator;

  // Expose for debugging/testing
  (window as any).getDirector = () => director;
  (window as any).getGroupChatManager = () => groupChatManager;
  (window as any).getMemoryManager = () => memoryManager;
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

  // Active engine module state (lazy loaded)
  let activeEngineModule: any = null

  // Initial population with default engine (will be populated after loading)

  // --- Helper Functions ---

  const addMessage = (sender: string, text: string, color: string) => {
    const div = document.createElement('div')
    div.className = 'message'

    const agent = agents.find(a => a.name === sender || a.id === sender);
    let buttonsHtml = '';

    if (agent) {
      buttonsHtml = `
      <span class="feedback-controls" style="float:right; opacity:0.5;">
        <button class="feedback-btn" data-agent="${agent.id}" data-type="positive" title="Encourage Chaos">👍</button>
        <button class="feedback-btn" data-agent="${agent.id}" data-type="negative" title="Reduce Chaos">👎</button>
      </span>
      `;
    }

    div.innerHTML = `<strong style="color: ${color}">${sender}:</strong> ${text}${buttonsHtml}`
    chatLog.appendChild(div)
    chatLog.scrollTop = chatLog.scrollHeight

    if (agent) {
      const btns = div.querySelectorAll('.feedback-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          const agentId = target.getAttribute('data-agent');
          const type = target.getAttribute('data-type') as 'positive' | 'negative';
          if (agentId && groupChatManager) {
            groupChatManager.adjustAgentPersonality(agentId, type);
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = `Adjusted ${agentId}: ${type === 'positive' ? '+Chaos' : '-Chaos'}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
            target.parentElement?.remove();
          }
        });
      });
    }
  }

  const speakAndVisualize = async (text: string, agentId: string, options?: { steps?: number; seed?: number; speed?: number }) => {
    const opts = {
      speed: options?.speed || 1.3,
      steps: options?.steps || 10,
      seed: options?.seed
    };
    
    try {
      // Parse timing cues for robot animations
      let textToSpeak = text;
      const isRobot = stage.isRobot(agentId);
      
      if (isRobot) {
        // Set up robot animation sequence and get clean text
        textToSpeak = stage.setupRobotAnimation(agentId, text);
      }
      
      if (audioEngine) {
        const audio = await audioEngine.synthesize(textToSpeak, agentId, opts);
        speechQueue.add(audio);
        stage.setActiveActor(agentId);
      }
    } catch (e) {
      console.error('TTS Error:', e);
    }
  };

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
    // --- Stage 1: Initialize 3D Stage ---
    stage = new Stage(canvas)

    // --- Stage 2: Model Loading (triggered by button or auto-load) ---
    const initializeManagers = async (modelId: string, engineModule: any) => {
      // 2a. Initialize Audio Engine (once)
      if (!audioInitializing) {
        audioInitializing = true
        statusText.textContent = 'Initializing Audio Engine...'
        audioEngine = new AudioEngine()
        try {
          await audioEngine.init()
        } catch (e) {
          console.warn('AudioEngine init failed, proceeding without TTS:', e);
          addMessage('System', 'TTS failed to load. Audio disabled.', '#ff6b6b');
        }

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

      // 2b. Instantiate new managers
      groupChatManager = new GroupChatManager(agents)
      scriptGenerator = new ScriptGenerator(groupChatManager)
      memoryManager = new MemoryManager();

      const previousContext = await memoryManager.loadLastEpisode();

      // 2d. Initialize AgentModelManager
      agentModelManager = new AgentModelManager(
        groupChatManager,
        defaultAgentModelMappings,
        (progress) => {
          statusText.textContent = `Swapping model: ${progress.text}`
        }
      )

      // 2e. Video Controls
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

      // 2f. Initialize Director with callbacks
      const directorCallbacks: DirectorCallbacks = {
        onMessage: (sender, message, color) => addMessage(sender, message, color),
        onTicker: (text) => {
          const container = document.getElementById('news-ticker-container');
          const content = document.getElementById('news-ticker-content');
          if (container && content) {
            container.style.display = 'block';
            content.textContent = text;
          }
        },
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
          
          // Robot head tilt between phrases (when starting turn)
          if (stage.isRobot(agentId)) {
            stage.tiltRobotHead(agentId, 'left');
            setTimeout(() => stage.tiltRobotHead(agentId, 'reset'), 300);
          }

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
        onMusicControl: (action, bpm) => {
          if (musicEngine) {
            if (action === 'start') musicEngine.startBeat(bpm);
            else musicEngine.stopBeat();
          }
        },
        onCallbackRecorded: (agentId: string, jokeId: string, count: number, status: string) => {
          // Trigger visual callback feedback on the Stage
          stage.recordCallback(agentId, jokeId, count, status as 'fresh' | 'building' | 'peak' | 'declining' | 'dead');
        },
        onSceneStop: () => {
          addMessage('System', '🛑 Scene stopped by user', '#ff6b6b');
          
          // Clear all callback visuals when scene stops
          stage.clearAllCallbackVisuals();

          const ticker = document.getElementById('news-ticker-container');
          if (ticker) ticker.style.display = 'none';

          // Reset all mode start/stop buttons
          modeEl.sceneTitleInput.disabled = false;
          modeEl.sceneDescriptionInput.disabled = false;
          modeEl.startImprovBtn.style.display = 'inline-block';
          modeEl.stopImprovBtn.style.display = 'none';

          modeEl.startReporterBtn.disabled = false;
          modeEl.reporterTopicInput.disabled = false;
          modeEl.reporterCategorySelect.disabled = false;
          modeEl.reporterQuickTopicsSelect.disabled = false;
          modeEl.stopReporterBtn.style.display = 'none';

          const floatingStop = document.getElementById('floating-stop-improv-btn');
          if (floatingStop) floatingStop.style.display = 'none';

          modeEl.stopScriptBtn.style.display = 'none';
          modeEl.generateScriptBtn.style.display = 'inline-block';
          modeEl.loadExampleScriptBtn.style.display = 'inline-block';
          modeEl.playScriptBtn.style.display = 'inline-block';
          modeEl.generateScriptBtn.disabled = false;
          modeEl.loadExampleScriptBtn.disabled = false;
          modeEl.playScriptBtn.disabled = false;
          modeEl.scriptTopicInput.disabled = false;
          modeEl.scriptTextTextarea.disabled = false;

          modeEl.stopRoastBtn.style.display = 'none';
          modeEl.startRoastBtn.style.display = 'inline-block';
          modeEl.roastTargetInput.disabled = false;

          modeEl.stopStoryBtn.style.display = 'none';
          modeEl.startStoryBtn.style.display = 'inline-block';
          modeEl.storyPromptInput.disabled = false;

          modeEl.stopDebateBtn.style.display = 'none';
          modeEl.startDebateBtn.style.display = 'inline-block';
          modeEl.debateTopicInput.disabled = false;

          modeEl.stopMusicalBtn.style.display = 'none';
          modeEl.startMusicalBtn.style.display = 'inline-block';
          modeEl.musicalStyleInput.disabled = false;

          modeEl.stopInterviewBtn.style.display = 'none';
          modeEl.startInterviewBtn.style.display = 'inline-block';
          modeEl.interviewHostSelect.disabled = false;
          modeEl.interviewGuestInput.disabled = false;

          modeEl.stopDmBtn.style.display = 'none';
          modeEl.startDmBtn.style.display = 'inline-block';
          modeEl.dmSettingInput.disabled = false;

          modeEl.stopAutonomousBtn.style.display = 'none';
          modeEl.startAutonomousBtn.style.display = 'inline-block';

          modeEl.stopTriviaBtn.style.display = 'none';
          modeEl.startTriviaBtn.style.display = 'inline-block';
          modeEl.triviaTopicInput.disabled = false;

          modeEl.stopDreamBtn.style.display = 'none';
          modeEl.startDreamBtn.style.display = 'inline-block';
          modeEl.dreamThemeInput.disabled = false;

          modeEl.stopVisionBtn.style.display = 'none';
          modeEl.startVisionBtn.style.display = 'inline-block';
          modeEl.visionUrlInput.disabled = false;
          modeEl.visionFileInput.disabled = false;

          modeEl.stopTrialBtn.style.display = 'none';
          modeEl.startTrialBtn.style.display = 'inline-block';
          modeEl.trialTopicInput.disabled = false;

          modeEl.stopTechBtn.style.display = 'none';
          modeEl.startTechBtn.style.display = 'inline-block';
          modeEl.techIssueInput.disabled = false;

          modeEl.stopHistoricalBtn.style.display = 'none';
          modeEl.startHistoricalBtn.style.display = 'inline-block';
          modeEl.historicalFigure1Input.disabled = false;
          modeEl.historicalFigure2Input.disabled = false;
          modeEl.historicalTopicInput.disabled = false;

          modeEl.stopCommentaryBtn.style.display = 'none';
          modeEl.startCommentaryBtn.style.display = 'inline-block';
          modeEl.commentaryTargetInput.disabled = false;

          modeEl.stopCodeBtn.style.display = 'none';
          modeEl.startCodeBtn.style.display = 'inline-block';
          modeEl.codeLanguageInput.disabled = false;

          modeEl.stopTherapyBtn.style.display = 'none';
          modeEl.startTherapyBtn.style.display = 'inline-block';
          modeEl.therapyTopicInput.disabled = false;

          videoElement.pause();
          videoContainer.style.display = 'none';
        },
        getSeed: () => seedInput.value ? parseInt(seedInput.value) : undefined,
        videoControls: videoControls,
        musicControls: {
          startBeat: (bpm?: number) => { if (musicEngine) musicEngine.startBeat(bpm); else startBeat(); },
          stopBeat: () => { if (musicEngine) musicEngine.stopBeat(); else stopBeat(); },
        },
      };
      director = new Director(groupChatManager, directorCallbacks, memoryManager);
      if (chaosSlider) director.setChaosLevel(parseInt(chaosSlider.value));

      // Re-apply settings to the new manager instance
      const idx = parseInt(profanitySlider.value)
      const { level } = profanityLevels[idx]
      groupChatManager.setProfanityLevel(level)
      groupChatManager.setLanguage(languageSelect.value)

      // 2c. Load LLM model with progress (Moved to end to allow Director access during load)
      statusText.textContent = `Loading model: ${modelId}...`

      // Note: We await this LAST so that 'director' and other managers are instantiated
      // and exposed to window even if loading hangs (useful for testing).
      await groupChatManager.initialize(modelId, (progress: any) => {
        statusText.textContent = progress.text
      }, engineModule)

      if (previousContext) {
        groupChatManager.setGlobalContext(previousContext);
        addMessage('System', 'Loaded context from previous episode.', '#4ecdc4');
      }

      // --- Stage 3: Enable Mode Selection ---
      statusText.textContent = 'Ready! Select a mode to begin.'
      statusText.style.color = '#4ecdc4'
      loadingDiv.style.display = 'none'

      chatContainer.classList.add('enabled')

      // Enable chat controls
      userInput.disabled = false
      sendBtn.disabled = false
      modelSelect.disabled = false
      loadModelBtn.disabled = false
      if (modelSelectMain) modelSelectMain.disabled = false

      // Enable all mode controls
      enableModeControls(modeEl)

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

    // --- Load Model Button Handler ---
    loadModelBtn.addEventListener('click', async () => {
      const modelId = modelSelect.value;
      loadingDiv.style.display = 'flex';
      loadModelBtn.disabled = true;

      try {
        // Lazy load WebLLM on first use
        const webllm = await loadWebLLM();
        activeEngineModule = webllm;
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

    // Language Change
    languageSelect.addEventListener('change', () => {
      if (groupChatManager) {
        groupChatManager.setLanguage(languageSelect.value);
        addMessage('System', `Language set to ${languageSelect.value}`, '#4ecdc4');
      }
    });

    // Register all mode button handlers
    registerModeHandlers(
      modeEl,
      () => director || null,
      () => scriptGenerator || null,
      addMessage,
    );

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

    // Initial load - lazy load WebLLM first
    if (defaultModelId) {
      const webllm = await loadWebLLM();
      activeEngineModule = webllm;
      populateModelSelect(webllm)
      await initializeManagers(defaultModelId, webllm);
    }

    userInput.focus()
  } catch (error: any) {
    console.error('Initialization error:', error)

    const statusText = document.getElementById('status')!;
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
