import type { Agent, ProfanityLevel } from '../GroupChatManager'
import type { AgentModelMapping } from '../AgentModelManager'
import { hermesModelConfig } from './models'

// Import persona prompts from text files
import techBroPrompt from '../prompts/techBro.txt?raw'
import robotPrompt from '../prompts/robot.txt?raw'

export const profanityLevels: { level: ProfanityLevel, label: string, color: string }[] = [
  { level: 'PG', label: 'Safe', color: '#4ecdc4' },
  { level: 'CASUAL', label: 'PG-13', color: '#ffd700' },
  { level: 'GRITTY', label: 'R-Rated', color: '#ff6b6b' },
  { level: 'UNCENSORED', label: 'Uncensored', color: '#ff0000' }
]

// Define our agents with different personalities and sampling parameters
export const agents: Agent[] = [
  {
    id: 'comedian',
    name: 'The Comedian',
    systemPrompt:
      'You are a frantic, high-energy female comedian who talks incredibly fast. You are aware that you ramble at high speed and sometimes apologize for it. You mix highbrow references with lowbrow physical humor. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.95,
    top_p: 0.95,
    color: '#ff6b6b',
  },
  {
    id: 'philosopher',
    name: 'The Philosopher',
    systemPrompt:
      'You are a cynical philosopher who speaks... very... slowly... to... ensure... your... profound... thoughts... are... understood. You judge the comedian for her speed. You are highbrow but petty. DO NOT start sentences with your name. End your response with "###"',
    temperature: 0.75,
    top_p: 0.9,
    color: '#4ecdc4',
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    systemPrompt:
      'You are a scientist who treats every joke as a serious hypothesis. You are dry and devoid of humor, which makes you unintentionally funny. You analyze crass jokes with mathematical precision. DO NOT use your name. End your response with "###"',
    temperature: 0.6,
    top_p: 0.85,
    color: '#45b7d1',
  },
  // Wave 1: New personas
  {
    id: 'techBro',
    name: 'Chad Vanderblock',
    systemPrompt: techBroPrompt + '\n\nDO NOT start sentences with your name. End your response with "###"',
    temperature: 0.9,
    top_p: 0.92,
    color: '#FF6B35', // Orange as specified
  },
  {
    id: 'robot',
    name: 'Unit-734',
    systemPrompt: robotPrompt + '\n\nDO NOT start sentences with your name. End your response with "###"',
    temperature: 0.5,
    top_p: 0.8,
    color: '#C0C0C0', // Silver as specified
  },
]

// Default model mappings: Use the uploaded Hermes model for all agents
export const defaultAgentModelMappings: AgentModelMapping[] = [
  { agentId: 'comedian', modelId: hermesModelConfig.model_id },
  { agentId: 'philosopher', modelId: hermesModelConfig.model_id },
  { agentId: 'scientist', modelId: hermesModelConfig.model_id },
  { agentId: 'techBro', modelId: hermesModelConfig.model_id },
  { agentId: 'robot', modelId: hermesModelConfig.model_id },
]

// Helper function to get agent by ID
export function getAgentById(id: string): Agent | undefined {
  return agents.find(agent => agent.id === id)
}

// Helper function to get all available agent IDs
export function getAgentIds(): string[] {
  return agents.map(agent => agent.id)
}

// Helper to check if an agent ID is valid
export function isValidAgentId(id: string): boolean {
  return agents.some(agent => agent.id === id)
}
