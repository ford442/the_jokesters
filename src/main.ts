import './style.css'
import { GroupChatManager } from './GroupChatManager'
import type { Agent } from './GroupChatManager'
import { SceneManager } from './SceneManager'
import * as webllm from '@mlc-ai/web-llm'

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
  const sceneManager = new SceneManager(canvas)

  // Add agents to scene
  sceneManager.addAgents(agents)
  sceneManager.animate()

  try {
    // Initialize the chat manager with progress callback
    await groupChatManager.initialize((progress: webllm.InitProgressReport) => {
      const percentage = Math.round(progress.progress * 100)
      progressBar.style.width = `${percentage}%`
      statusText.textContent = progress.text
    })

    // Hide loading, show chat
    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'

    // Update next agent info
    const nextAgent = groupChatManager.getCurrentAgent()
    nextAgentSpan.textContent = nextAgent.name
    nextAgentSpan.style.color = nextAgent.color

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
        // Get response from current agent
        const result = await groupChatManager.chat(message)

        // Make agent jump
        sceneManager.makeAgentJump(result.agentId)

        // Find agent info
        const agent = agents.find((a) => a.id === result.agentId)!

        // Add agent response to log
        addMessage(agent.name, result.response, agent.color)

        // Update next agent info
        const nextAgent = groupChatManager.getCurrentAgent()
        nextAgentSpan.textContent = nextAgent.name
        nextAgentSpan.style.color = nextAgent.color
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
    statusText.textContent = 'Error initializing WebLLM. Please check console.'
    console.error('Initialization error:', error)
  }
}

initApp()
