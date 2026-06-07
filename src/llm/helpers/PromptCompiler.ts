import type { Agent, ProfanityLevel } from '../../types/chat'
import { PROFANITY_INSTRUCTIONS } from '../../config/chatConfig'

export function buildSystemMessage(
  agent: Agent,
  sceneConfig?: { title?: string; description?: string; setup?: string; customInstructions?: string },
  profanityLevel: ProfanityLevel = 'GRITTY',
  hiddenInstruction?: string,
  extraContext?: string
): string {
  let prompt = agent.systemPrompt + `\n\n[STYLE: ${PROFANITY_INSTRUCTIONS[profanityLevel]}]`

  if (sceneConfig) {
    if (sceneConfig.title) {
      prompt += `\n[SCENE: ${sceneConfig.title}]`
    }
    if (sceneConfig.description) {
      prompt += `\n[CONTEXT: ${sceneConfig.description}]`
    }
    if (sceneConfig.setup) {
      prompt += `\n[SETUP: ${sceneConfig.setup}]`
    }
    if (sceneConfig.customInstructions) {
      prompt += `\n[DIRECTOR NOTES: ${sceneConfig.customInstructions}]`
    }
  }

  if (extraContext) {
    prompt += `\n[EXTRA CONTEXT: ${extraContext}]`
  }

  if (hiddenInstruction) {
    prompt += `\n[HIDDEN INSTRUCTION: ${hiddenInstruction}]`
  }

  return prompt
}
