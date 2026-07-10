import { getCallbackBadgeLabel, type ComedyCallbackStatus } from '../comedy/ComedySession';

export interface CallbackBadgeOptions {
  status: ComedyCallbackStatus;
  count: number;
  agentId?: string;
}

/**
 * Create a callback status badge element for chat messages.
 */
export function createCallbackBadge(options: CallbackBadgeOptions): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = `callback-badge callback-badge--${options.status}`;
  badge.dataset.status = options.status;
  if (options.agentId) {
    badge.dataset.agentId = options.agentId;
  }
  badge.title = `Running gag: ${options.status}`;
  badge.textContent = getCallbackBadgeLabel(options.status, options.count);
  return badge;
}

/**
 * Attach a callback badge to the most recent agent message in #chat-log.
 */
export function attachCallbackBadgeToLastAgentMessage(
  chatLog: HTMLElement,
  agentId: string,
  status: ComedyCallbackStatus,
  count: number,
): void {
  const messages = chatLog.querySelectorAll('.message[data-agent-id]');
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i] as HTMLElement;
    if (message.dataset.agentId === agentId) {
      const existing = message.querySelector('.callback-badge');
      existing?.remove();
      message.appendChild(createCallbackBadge({ status, count, agentId }));
      break;
    }
  }
}

/**
 * Mark a message div with agent metadata for badge targeting.
 */
export function tagMessageWithAgent(messageDiv: HTMLElement, agentId: string): void {
  messageDiv.dataset.agentId = agentId;
}
