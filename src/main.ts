import './style.css'
import { GroupChatManager } from './GroupChatManager'
import type { Agent } from './GroupChatManager'
import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
// import { SceneManager } from './SceneManager'
import * as webllm from '@mlc-ai/web-llm'

import { AudioEngine } from './audio/AudioEngine'
import { SpeechQueue } from './audio/SpeechQueue'

// Log available models on startup
console.log('Available prebuilt models:', webllm.prebuiltAppConfig.model_list.map((m) => m.model_id))

// Define our agents with different personalities and sampling parameters
const agents: Agent[] = [
  {
    id: 'comedian',
    name: 'The Comedian',
    systemPrompt:
      'You are a witty comedian who loves to make jokes and puns. Keep responses brief and humorous.',
    temperature: 0.9,
    top_p: 0.95,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    systemPrompt:
      'You are a thoughtful philosopher who provides deep insights. Keep responses brief and profound.',
    temperature: 0.7,
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    systemPrompt:
      'You are a logical scientist who explains things clearly and factually. Keep responses brief and precise.',
    temperature: 0.3,
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
          <div id="chat-log" class="chat-log"></div>
          <div class="input-group">
            <input 
              type="text" 
              id="user-input" 
              placeholder="Type a message..."
              autocomplete="off"
            />
            <button id="send-btn">Send</button>
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

  // Initialize managers
  const groupChatManager = new GroupChatManager(agents)

  const audioEngine = new AudioEngine()
  const speechQueue = new SpeechQueue(audioEngine)

  const stage = new Stage(canvas)
  const lipSync = new LipSync(speechQueue.getAudioContext())

  // Wire up Audio -> Visuals
  // SpeechQueue -> LipSync -> Destination
  speechQueue.setDestination(lipSync.analyser)
  lipSync.analyser.connect(speechQueue.getAudioContext().destination)

  stage.setLipSync(lipSync)
  stage.render()


  try {
    // 1. Initialize Audio Engine (in background or parallel)
    // Assuming models are at /models/supertonic/ (quantized)
    statusText.textContent = "Initializing Audio Engine..."
    await audioEngine.init('/models/supertonic/generator_quantized.onnx', '/models/supertonic/tokenizer.json');

    // 2. Initialize the chat manager with progress callback
    statusText.textContent = "Initializing WebLLM..."
    await groupChatManager.initialize((progress: webllm.InitProgressReport) => {
      const percentage = Math.round(progress.progress * 100)
      progressBar.style.width = `${percentage}%`
      statusText.textContent = progress.text
    })

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

    // Helper to speak and animate
    const speakAndVisualize = async (text: string, agentId: string) => {
      try {
        stage.setActiveActor(agentId);
        const audioData = await audioEngine.synthesize(text, agentId);
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
          speakAndVisualize(sentence, agent.id);

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

    userInput.focus()
  } catch (error) {
    statusText.textContent = 'Error initializing App. Please check console.'
    console.error('Initialization error:', error)
  }
}

initApp()
