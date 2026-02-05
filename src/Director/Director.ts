import type { GroupChatManager } from '../GroupChatManager'
import type { AgentModelManager } from '../AgentModelManager'
import type { Stage } from '../visuals/Stage'
import type { AudioEngine } from '../audio/AudioEngine'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Agent } from '../GroupChatManager'

// Configuration interface for the Director
export interface DirectorConfig {
  chaosLevel: number      // 0-100
  ttsSteps: number        // 1-50
  userSeed?: number       // Optional manual seed
}

// Simple interface for a Scenario (to be expanded later)
export interface Scenario {
  mode: 'improv' | 'script' | 'reaction'
  title: string
  description: string
}

export class Director {
  private groupChatManager: GroupChatManager
  private agentModelManager: AgentModelManager
  private stage: Stage
  private audioEngine: AudioEngine
  private speechQueue: SpeechQueue

  // State
  private isRunning: boolean = false
  private config: DirectorConfig

  // Callbacks for UI updates
  private onAgentChange: (agent: Agent) => void
  private onLogMessage: (sender: string, message: string, color: string) => void
  private onStop: () => void

  constructor(
    groupChatManager: GroupChatManager,
    agentModelManager: AgentModelManager,
    stage: Stage,
    audioEngine: AudioEngine,
    speechQueue: SpeechQueue,
    callbacks: {
      onAgentChange: (agent: Agent) => void,
      onLogMessage: (sender: string, message: string, color: string) => void,
      onStop: () => void
    }
  ) {
    this.groupChatManager = groupChatManager
    this.agentModelManager = agentModelManager
    this.stage = stage
    this.audioEngine = audioEngine
    this.speechQueue = speechQueue
    this.onAgentChange = callbacks.onAgentChange
    this.onLogMessage = callbacks.onLogMessage
    this.onStop = callbacks.onStop

    // Default config
    this.config = {
      chaosLevel: 30,
      ttsSteps: 10
    }
  }

  public updateConfig(config: Partial<DirectorConfig>) {
    this.config = { ...this.config, ...config }
  }

  public getIsRunning(): boolean {
    return this.isRunning
  }

  public stop() {
    this.isRunning = false
    this.onStop()
  }

  public async startScenario(scenario: Scenario) {
    if (this.isRunning) return
    this.isRunning = true

    this.onLogMessage('System', `🎬 Starting ${scenario.mode} scene: "${scenario.title}"`, '#4ecdc4')
    this.onLogMessage('System', scenario.description, '#4ecdc4')

    try {
      // 1. Reset Conversation
      this.groupChatManager.resetConversation()

      // 2. Initial Prompt (The "Slate")
      if (this.groupChatManager.getHistoryLength() === 0) {
        const seed = scenario.title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?'
        this.onLogMessage('Director', `Action! "${seed}"`, '#888')
        await this.processTurn(seed)
      }

      // 3. The Main Loop
      while (this.isRunning) {
        // Pause between turns for dramatic effect
        await new Promise(r => setTimeout(r, 800))
        if (!this.isRunning) break

        // Determine the prompt for this turn
        const nextPrompt = this.generateDirectorPrompt()

        await this.processTurn(nextPrompt)
      }
    } catch (error) {
      console.error('Director Error:', error)
      this.onLogMessage('System', 'Error running scene. Check console.', '#ff0000')
      this.stop()
    } finally {
      // Ensure we clean up if the loop exits naturally
      if (this.isRunning) this.stop()
    }
  }

  // Decides what instruction to give the agent next (Chaos Logic)
  private generateDirectorPrompt(): string {
    const turnCount = this.groupChatManager.getHistoryLength()
    const chaosRoll = Math.random() * 100

    // Default: Just reply
    let prompt = '(Reply naturally to the last thing said)'

    // Chaos: Inject disaster or weirdness based on slider
    if (turnCount % 3 === 0 && chaosRoll < this.config.chaosLevel) {
      prompt = '(Suddenly, a physical disaster happens. React with panic and crass humor!)'
    } else if (turnCount % 4 === 0 && chaosRoll < this.config.chaosLevel) {
      prompt = '(Make a highbrow reference to history that completely misses the point.)'
    }

    return prompt
  }

  // Calculates how verbose/fast the turn should be
  private calculatePacing() {
    const roll = Math.random()
    // 30% Chance: "The One-Liner"
    if (roll > 0.7) {
      return {
        maxTokens: 60,
        ttsSteps: Math.min(25, this.config.ttsSteps * 2), // Higher quality for short lines
        promptSuffix: ' (Reply with a single, joking sentence. Be very brief.)'
      }
    }
    // 50% Chance: "The Standard"
    else if (roll > 0.2) {
      return {
        maxTokens: 150,
        ttsSteps: this.config.ttsSteps,
        promptSuffix: ' (Keep the conversation flowing. 1-2 sentences.)'
      }
    }
    // 20% Chance: "The Rant"
    else {
      return {
        maxTokens: 256,
        ttsSteps: Math.max(5, Math.floor(this.config.ttsSteps / 2)), // Lower quality for speed
        promptSuffix: ' (Go on a funny, passionate rant. Be expressive!)'
      }
    }
  }

  private async processTurn(instruction: string) {
    if (!this.isRunning) return

    // 1. Identify Actor
    const currentAgent = this.groupChatManager.getCurrentAgent()

    // 2. Ensure Model is Loaded
    await this.agentModelManager.ensureModelForAgent(currentAgent.id)

    // 3. Calculate Pacing
    const pacing = this.calculatePacing()
    console.log(`[Director] Pacing for ${currentAgent.name}: Tokens=${pacing.maxTokens}`)

    // 4. Update Visuals
    this.stage.setActiveActor(currentAgent.id)
    this.onAgentChange(currentAgent)

    // 5. UI: Add placeholder message
    // We'll let the main app handle the fine-grained UI, but here we emit the log
    // For now, we are passing a callback `onLogMessage` that handles the "..."
    // NOTE: Ideally, the Director emits events. For now, we'll keep it simple.

    // 6. Execute Chat
    const userSeed = this.config.userSeed
    const turnSeed = userSeed !== undefined ? userSeed + this.groupChatManager.getHistoryLength() : undefined
    const effectivePrompt = instruction + pacing.promptSuffix + ' ###'

    const characterSpeeds: Record<string, number> = {
      'comedian': 1.5,
      'philosopher': 0.6,
      'scientist': 1.0
    }

    // We capture the full text to log it properly after generation
    let fullResponse = ""

    await this.groupChatManager.chat(
      effectivePrompt,
      (sentence) => {
        // On Sentence Generated: Speak & Animate
        if (!this.isRunning) return

        fullResponse += sentence + " "

        this.speakAndVisualize(
          sentence,
          currentAgent.id,
          {
            steps: pacing.ttsSteps,
            speed: characterSpeeds[currentAgent.id] || 1.0,
            seed: turnSeed
          }
        )

        // Update Log (Streamed) - We trigger the callback with the partial?
        // For simplicity in this refactor, we let the external UI handle the "streaming" appearance
        // OR we just log the final result.
        // Let's rely on the onLogMessage to print the FINAL line for now to keep it clean,
        // or we can emit a specific "Stream" event.
        // Given the previous code, let's just log the sentence for debug or handle it in the UI.
        console.log(`[${currentAgent.name}]: ${sentence}`)
      },
      { maxTokens: pacing.maxTokens, seed: turnSeed }
    )

    // Log the full turn to the UI
    this.onLogMessage(currentAgent.name, fullResponse, currentAgent.color)

    // 7. Wait for audio to finish before next turn
    await this.speechQueue.waitUntilFinished()

    // 8. Update state for next turn
    this.onAgentChange(this.groupChatManager.getCurrentAgent())
  }

  private async speakAndVisualize(text: string, agentId: string, options: { steps?: number; seed?: number; speed?: number } = {}) {
    try {
      this.stage.setActiveActor(agentId);
      const audioData = await this.audioEngine.synthesize(text, agentId, options);
      this.speechQueue.add(audioData);
    } catch (e) {
      console.error("Speech synthesis failed", e);
    }
  }
}
