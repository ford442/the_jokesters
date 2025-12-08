import { GroupChatManager } from './GroupChatManager'
import type { Agent } from './GroupChatManager'

export interface ImprovScene {
  title: string
  description: string
  suggestedTopics?: string[]
}

export class ImprovSceneManager {
  private groupChatManager: GroupChatManager
  private currentScene: ImprovScene | null = null
  private isRunning = false
  private turnCount = 0
  private maxTurns = 10 // Default max turns per scene

  constructor(groupChatManager: GroupChatManager) {
    this.groupChatManager = groupChatManager
  }

  /**
   * Start an improv scene where agents converse with each other
   */
  async startScene(
    scene: ImprovScene,
    maxTurns: number = 10,
    onAgentStartSpeaking?: (agentId: string, agentName: string, color: string) => HTMLElement,
    onSentence?: (agentId: string, sentence: string, messageElement: HTMLElement) => void,
    onSceneComplete?: () => void
  ): Promise<void> {
    if (this.isRunning) {
      console.warn('Scene already running')
      return
    }

    this.currentScene = scene
    this.isRunning = true
    this.maxTurns = maxTurns
    this.turnCount = 0

    // Reset conversation to start fresh
    this.groupChatManager.resetConversation()

    console.log(`Starting improv scene: ${scene.title}`)
    console.log(`Description: ${scene.description}`)

    try {
      // Initial prompt to set the stage
      const initialPrompt = this.createScenePrompt(scene, true)
      
      // Run the conversation loop
      while (this.isRunning && this.turnCount < this.maxTurns) {
        const currentAgent = this.groupChatManager.getCurrentAgent()
        const agents = this.groupChatManager.getAgents()
        
        // Create the prompt for this turn
        const prompt = this.turnCount === 0 
          ? initialPrompt 
          : this.createTurnPrompt(scene, currentAgent, agents)

        console.log(`[Turn ${this.turnCount + 1}] ${currentAgent.name} speaks...`)

        try {
          // Notify that agent is starting to speak and get message element
          let messageElement: HTMLElement | null = null
          if (onAgentStartSpeaking) {
            messageElement = onAgentStartSpeaking(
              currentAgent.id,
              currentAgent.name,
              currentAgent.color
            )
          }

          // Get response from current agent
          await this.groupChatManager.chat(
            prompt,
            (sentence: string) => {
              // Callback for sentence-by-sentence audio/visual
              if (onSentence && messageElement) {
                onSentence(currentAgent.id, sentence, messageElement)
              }
            }
          )

          this.turnCount++

          // Small delay between turns to make it feel more natural
          await this.delay(1000)

        } catch (error) {
          console.error('Error during agent turn:', error)
          this.stop()
          throw error
        }
      }

      console.log('Scene completed')
      this.isRunning = false
      
      if (onSceneComplete) {
        onSceneComplete()
      }

    } catch (error) {
      console.error('Error running scene:', error)
      this.isRunning = false
      throw error
    }
  }

  /**
   * Stop the current scene
   */
  stop(): void {
    this.isRunning = false
    console.log('Scene stopped')
  }

  /**
   * Check if a scene is currently running
   */
  isSceneRunning(): boolean {
    return this.isRunning
  }

  /**
   * Get the current scene
   */
  getCurrentScene(): ImprovScene | null {
    return this.currentScene
  }

  /**
   * Create the initial scene-setting prompt
   */
  private createScenePrompt(scene: ImprovScene, isFirst: boolean): string {
    if (isFirst) {
      const topicsLine = scene.suggestedTopics 
        ? `Topics to explore: ${scene.suggestedTopics.join(', ')}\n` 
        : ''
      
      return `You are participating in an improv comedy scene with other characters.\n` +
        `Scene: "${scene.title}"\n` +
        `Description: ${scene.description}\n` +
        topicsLine +
        `\nStart the scene with your character's perspective. Be creative, stay in character, and keep your response brief (2-3 sentences). React naturally to what others say.`
    }
    
    return `Continue the improv scene. Stay in character and respond naturally to what was just said. Keep it brief and entertaining.`
  }

  /**
   * Create a prompt for a turn, including context about other agents
   */
  private createTurnPrompt(scene: ImprovScene, currentAgent: Agent, allAgents: Agent[]): string {
    const otherAgents = allAgents
      .filter(a => a.id !== currentAgent.id)
      .map(a => a.name)
      .join(' and ')

    return `Continue the improv comedy scene about "${scene.title}".\n` +
      `You are ${currentAgent.name} talking with ${otherAgents}.\n` +
      `Respond naturally to the previous comment, stay in character, and keep your response brief and entertaining (2-3 sentences).\n` +
      `You can agree, disagree, add humor, or take the scene in a creative direction while staying on theme.`
  }

  /**
   * Helper to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
