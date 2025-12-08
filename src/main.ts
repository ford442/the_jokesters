import './style.css'
import { GroupChatManager } from './GroupChatManager'
import type { Agent } from './GroupChatManager'
import { Stage } from './visuals/Stage'
import { LipSync } from './visuals/LipSync'
import { AudioEngine } from './audio/AudioEngine'
import { SpeechQueue } from './audio/SpeechQueue'
import * as webllm from '@mlc-ai/web-llm'

console.log('Available prebuilt models:', webllm.prebuiltAppConfig.model_list.map((m) => m.model_id))

// --- ADJUSTED AGENTS FOR SPECIFIC HUMOR ---
const agents: Agent[] = [
  {
    id: 'comedian',
    name: 'The Comedian',
    // Highbrow + Lowbrow + Self-Deprecating + Crass (but not dark)
    systemPrompt:
      'You are a farcical, chaotic comedian. Your humor alternates wildly between highbrow satire and lowbrow crassness. You are dry, wry, and deeply self-deprecating. You act out physical comedy in text. Avoid dark or depressing topics; keep it absurd and silly. Keep responses brief.',
    temperature: 0.95, // High temp for "Farcical" unpredictability
    top_p: 0.95,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    // Satirical + Highbrow + Dry
    systemPrompt:
      'You are a cynical, satirical philosopher. You analyze everything with dry, wry wit. You look down on lowbrow humor but often accidentally make lowbrow jokes yourself while trying to be highbrow. Keep responses brief and judgmental.',
    temperature: 0.75, // Slightly higher for "Satirical" edge
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    // Dry + Literal (The "Straight Man")
    systemPrompt:
      'You are a literal-minded scientist who accidentally says crass things without realizing it. You take everything the others say completely seriously, which makes it farcical. You are dry and precise. Keep responses brief.',
    temperature: 0.6,
    top_p: 0.85,
    color: '#45b7d1',
  },
]

// ... (Rest of the file remains the same: initApp, startImprovLoop, etc.)

async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  app.innerHTML = `
    <div class="container">
      <h1>The Jokesters</h1>
      <p class="subtitle">Farcical Multi-Agent Chat (WebGPU)</p>
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
              placeholder="Give them a topic..."
              autocomplete="off"
            />
            <button id="send-btn">Start Improv</button>
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
    const groupChatManager = new GroupChatManager(agents)
    const audioEngine = new AudioEngine()
    const speechQueue = new SpeechQueue(audioEngine)

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) {
      throw new Error('WebGL 2 is not supported or is disabled in this environment.');
    }

    const stage = new Stage(canvas, gl as WebGLRenderingContext)
    const lipSync = new LipSync(speechQueue.getAudioContext())

    speechQueue.setDestination(lipSync.analyser)
    lipSync.analyser.connect(speechQueue.getAudioContext().destination)

    stage.setLipSync(lipSync)
    stage.render()

    statusText.textContent = "Initializing Audio Engine..."
    await audioEngine.init('assets');

    statusText.textContent = "Initializing WebLLM..."
    await groupChatManager.initialize((progress: webllm.InitProgressReport) => {
      const percentage = Math.round(progress.progress * 100)
      progressBar.style.width = `${percentage}%`
      statusText.textContent = progress.text
    })

    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'

    const updateNextAgentUI = () => {
      const nextAgent = groupChatManager.getCurrentAgent()
      nextAgentSpan.textContent = nextAgent.name
      nextAgentSpan.style.color = nextAgent.color
    }
    updateNextAgentUI()

    const addMessage = (sender: string, message: string, color: string) => {
      const messageDiv = document.createElement('div')
      messageDiv.className = 'message'
      messageDiv.innerHTML = `<strong style="color: ${color}">${sender}:</strong> ${message}`
      chatLog.appendChild(messageDiv)
      chatLog.scrollTop = chatLog.scrollHeight
    }

    const speakAndVisualize = async (text: string, agentId: string) => {
      try {
        stage.setActiveActor(agentId);
        const audioData = await audioEngine.synthesize(text, agentId);
        speechQueue.add(audioData);
      } catch (e) {
        console.error("Speech synthesis failed", e);
      }
    }

    // --- IMPROV LOOP LOGIC ---
    let isImprovRunning = false;

    const processTurn = async (inputText: string) => {
        try {
            let currentAgentId = groupChatManager.getCurrentAgent().id;
            const agent = agents.find(a => a.id === currentAgentId)!;

            stage.setActiveActor(currentAgentId);

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content">...</span>`;
            chatLog.appendChild(messageDiv);
            const contentSpan = messageDiv.querySelector('.content')!;

            await groupChatManager.chat(inputText, (sentence) => {
              speakAndVisualize(sentence, agent.id);
              contentSpan.textContent = contentSpan.textContent === '...' ? sentence + " " : contentSpan.textContent + sentence + " ";
              chatLog.scrollTop = chatLog.scrollHeight;
            });

            await speechQueue.waitUntilFinished();
            updateNextAgentUI();

        } catch (error) {
            console.error("Turn Error:", error);
            isImprovRunning = false;
            stopImprovLoop();
        }
    };

    const stopImprovLoop = () => {
      isImprovRunning = false;
      sendBtn.textContent = "Start Improv";
      sendBtn.disabled = false;
      userInput.disabled = false;
      sendBtn.onclick = startImprovLoop;
    };

    const startImprovLoop = async () => {
      if (isImprovRunning) return;
      isImprovRunning = true;

      userInput.disabled = true;
      sendBtn.disabled = false;
      sendBtn.textContent = "Stop Improv";
      sendBtn.onclick = stopImprovLoop;

      if (groupChatManager.getHistoryLength() === 0) {
         const seed = userInput.value.trim() || "The comedians are arguing about a rubber chicken.";
         addMessage('Director', `Action! "${seed}"`, '#888');
         await processTurn(seed);
      }

      while (isImprovRunning) {
        await new Promise(r => setTimeout(r, 1000));
        if (!isImprovRunning) break;

        // This directional prompt reinforces the humor style every turn
        await processTurn("(Respond with farcical, dry wit. Be satirical but silly.)");
      }
    };

    sendBtn.onclick = startImprovLoop;
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') startImprovLoop();
    })

    userInput.focus()

  } catch (error: any) {
    console.error('Initialization error:', error)
    statusText.textContent = "Error: " + error.message;
    statusText.style.color = '#ff6b6b'
  }
}

initApp()
