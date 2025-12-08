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
    // Prompt Focus: Casual, conversational, strictly humor over analysis
    systemPrompt:
      'You are a casual, funny guy hanging out with friends. Speak naturally, use slang, and keep it loose. Your goal is to make people laugh, not to analyze. Do not be poetic. Be brief, punchy, and a little bit silly.',
    temperature: 0.95,
    top_p: 0.95,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    // Prompt Focus: Wry wit, observational comedy
    systemPrompt:
      'You are a cynical observer with a dry wit. Speak like a normal person, but one who is tired of everyone\'s nonsense. Make fun of the situation directly. Do not give long speeches. Be sarcastic and quick.',
    temperature: 0.8,
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    // Prompt Focus: Deadpan delivery
    systemPrompt:
      'You are a nerd, but a casual one. You take things literally for comedic effect. Speak in short, factual sentences that accidentally kill the mood. Be deadpan.',
    temperature: 0.7,
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

    // Helper to speak and animate (accept steps for TTS quality)
    const speakAndVisualize = async (text: string, agentId: string, steps: number) => {
      try {
        stage.setActiveActor(agentId);
        const audioData = await audioEngine.synthesize(text, agentId, steps);
        speechQueue.add(audioData);
      } catch (e) {
        console.error("Speech synthesis failed", e);
      }
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

        await groupChatManager.chat(message, (sentence) => {
          // New sentence received
          console.log(`[${agent.name} speaks]: ${sentence}`);
          speakAndVisualize(sentence, agent.id, 10);

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
        });

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
      if (roll > 0.7) {
        return {
          type: 'punchline',
          maxTokens: 40,
          ttsSteps: 15,
          promptSuffix: ' (Make a quick one-liner joke)'
        }
      } else if (roll > 0.2) {
        return {
          type: 'standard',
          maxTokens: 100,
          ttsSteps: 6,
          promptSuffix: ' (Keep the conversation flowing casually)'
        }
      } else {
        return {
          type: 'rant',
          maxTokens: 200,
          ttsSteps: 4,
          promptSuffix: ' (Go on a short, funny rant)'
        }
      }
    }

    // Improv mode controls
    const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
    const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
    const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
    const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement

    let isImprovRunning = false
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

        if (groupChatManager.getHistoryLength() === 0) {
          const seed = title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?'
          addMessage('Director', `Action! "${seed}"`, '#888')
          await processTurn(seed)
        }

        // Continue loop until stopped
        while (isImprovRunning) {
          await new Promise(r => setTimeout(r, 800))
          if (!isImprovRunning) break
          await processTurn('(Reply naturally to the last thing said)')
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

    // Director logic: process a single turn with pacing and TTS steps
    const processTurn = async (inputText: string) => {
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
        const effectivePrompt = inputText + pacing.promptSuffix

        await groupChatManager.chat(effectivePrompt, (sentence) => {
          // 3. Pass ttsSteps to speak
          speakAndVisualize(sentence, agent.id, pacing.ttsSteps)

          contentSpan.textContent = contentSpan.textContent === '...' ? sentence + ' ' : contentSpan.textContent + sentence + ' '
          chatLog.scrollTop = chatLog.scrollHeight
        }, { maxTokens: pacing.maxTokens })

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
