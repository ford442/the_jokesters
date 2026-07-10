import type { GroupChatManager } from '../GroupChatManager'
import { createCallbackBadge, tagMessageWithAgent, attachCallbackBadgeToLastAgentMessage } from '../ui/callbackBadge'
import type { ComedyCallbackStatus } from '../comedy/ComedySession'

export interface ChatLogApi {
  addMessage: (
    sender: string,
    message: string,
    color: string,
    agentId?: string,
    callbackBadge?: { status: ComedyCallbackStatus; count: number },
  ) => void
  attachComedyCallbackBadge: (
    agentId: string,
    jokeId: string,
    count: number,
    status: ComedyCallbackStatus,
  ) => void
}

export function createChatLog(chatLog: HTMLElement, groupChatManager: GroupChatManager): ChatLogApi {
  const addMessage = (
    sender: string,
    message: string,
    color: string,
    agentId?: string,
    callbackBadge?: { status: ComedyCallbackStatus; count: number },
  ) => {
    const messageDiv = document.createElement('div')
    messageDiv.className = 'message'
    messageDiv.innerHTML = `
      <strong style="color: ${color}">${sender}:</strong> ${message}
    `
    if (agentId) {
      tagMessageWithAgent(messageDiv, agentId)
      const feedbackDiv = document.createElement('div')
      feedbackDiv.className = 'feedback-controls'
      feedbackDiv.style.cssText = 'display: inline-block; margin-left: 10px; font-size: 0.8em; opacity: 0.5; cursor: pointer;'
      feedbackDiv.innerHTML = `<span class="thumb-up">👍</span> <span class="thumb-down">👎</span>`

      feedbackDiv.querySelector('.thumb-up')?.addEventListener('click', () => {
        groupChatManager.evolvePersonality(agentId, 'positive')
        feedbackDiv.innerHTML = '✨'
      })
      feedbackDiv.querySelector('.thumb-down')?.addEventListener('click', () => {
        groupChatManager.evolvePersonality(agentId, 'negative')
        feedbackDiv.innerHTML = '📉'
      })

      messageDiv.appendChild(feedbackDiv)

      if (callbackBadge) {
        messageDiv.appendChild(createCallbackBadge({ ...callbackBadge, agentId }))
      }
    }
    chatLog.appendChild(messageDiv)
    chatLog.scrollTop = chatLog.scrollHeight
  }

  const attachComedyCallbackBadge = (
    agentId: string,
    _jokeId: string,
    count: number,
    status: ComedyCallbackStatus,
  ) => {
    attachCallbackBadgeToLastAgentMessage(chatLog, agentId, status, count)
  }

  ;(window as any).attachComedyCallbackBadge = attachComedyCallbackBadge

  return { addMessage, attachComedyCallbackBadge }
}

export function createFeedbackControls(
  groupChatManager: GroupChatManager,
  agentId: string,
): HTMLDivElement {
  const feedbackDiv = document.createElement('div')
  feedbackDiv.className = 'feedback-controls'
  feedbackDiv.style.cssText = 'display: inline-block; margin-left: 10px; font-size: 0.8em; opacity: 0.5; cursor: pointer;'
  feedbackDiv.innerHTML = `<span class="thumb-up">👍</span> <span class="thumb-down">👎</span>`

  feedbackDiv.querySelector('.thumb-up')?.addEventListener('click', () => {
    groupChatManager.evolvePersonality(agentId, 'positive')
    feedbackDiv.innerHTML = '✨'
  })
  feedbackDiv.querySelector('.thumb-down')?.addEventListener('click', () => {
    groupChatManager.evolvePersonality(agentId, 'negative')
    feedbackDiv.innerHTML = '📉'
  })

  return feedbackDiv
}

export const CHARACTER_SPEEDS: Record<string, number> = {
  comedian: 1.5,
  philosopher: 0.6,
  scientist: 1.0,
}
