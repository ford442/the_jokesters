import './style.css'
import { GroupChatManager } from './GroupChatManager'
import type { Agent } from './GroupChatManager'
import { ImprovSceneManager } from './ImprovSceneManager'
import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
// import { SceneManager } from './SceneManager'
import * as webllm from '@mlc-ai/web-llm'

import { AudioEngine } from './audio/AudioEngine'
import { SpeechQueue } from './audio/SpeechQueue'

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

  app.innerHTML = `
    <div class="container">
      <h1>The Jokesters</h1>
      <p class="subtitle">Multi-Agent Chat powered by Llama-3 & WebGPU</p>
      <div id="loading" class="loading">
        <div class="progress-bar">
          <div id="progress" class="progress-fill"></div>
        </div>
        <p id="status">Initializing WebLLM...</p>
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
  const nextAgentSpan = document.getElementById('next-agent')!
  const ttsStepsSlider = document.getElementById('tts-steps') as HTMLInputElement
  const ttsStepsVal = document.getElementById('tts-steps-val')!
  const chaosSlider = document.getElementById('director-chaos') as HTMLInputElement
  const chaosVal = document.getElementById('director-chaos-val')!
  const seedInput = document.getElementById('global-seed') as HTMLInputElement

  try {
    // Initialize managers inside try-catch to handle errors (e.g. WebGL failure)
    const groupChatManager = new GroupChatManager(agents)

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

    // 1. Initialize Audio Engine (in background or parallel)
    statusText.textContent = "Initializing Audio Engine..."
    await audioEngine.init('./tts/onnx');
    // 2. Initialize the chat manager with progress callback
    statusText.textContent = "Initializing WebLLM..."
    await groupChatManager.initialize((progress: webllm.InitProgressReport) => {
      const percentage = Math.round(progress.progress * 100)
      progressBar.style.width = `${percentage}%`
      statusText.textContent = progress.text
    })

    // Initialize ImprovSceneManager
    const improvSceneManager = new ImprovSceneManager(groupChatManager)

    // Hide loading, show chat
    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'

    // UI listeners
    ttsStepsSlider.oninput = () => ttsStepsVal.textContent = ttsStepsSlider.value
    chaosSlider.oninput = () => chaosVal.textContent = chaosSlider.value + '%'

    // Update next agent info
    const updateNextAgentUI = () => {
      const nextAgent = groupChatManager.getCurrentAgent()
      nextAgentSpan.textContent = nextAgent.name
      nextAgentSpan.style.color = nextAgent.color
    }
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
      
      // Prerender first 2-3 sentences ahead
      const prerenderCount = Math.min(3, sentences.length);
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
    const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
    const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
    const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
    const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement

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
          const prerendered = await groupChatManager.prerenderTurns(initialPrompt, 3)
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
          if (prerenderedQueue.length > 0) {
            console.log(`[Improv] Using prerendered turn (${prerenderedQueue.length} remaining)`)
            await playPrerenderedTurn()
          } else {
            console.log('[Improv] No prerendered turns, generating live')
            await processTurn(prompt, critique)
          }
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
      if (prerenderedQueue.length < 2 && isImprovRunning) {
        console.log('[Prerender] Queue low, generating more turns in background...')
        // Don't await - let it happen in background
        groupChatManager.prerenderTurns('(Reply naturally to the last thing said)', 2)
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
