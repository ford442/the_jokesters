import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import {
  createConversationTree,
  evaluateSentiment,
  advanceTree,
  recordSentiment,
  getTreeStats,
} from '../../improv/branching';
import type { SentimentEvent, SentimentType, ConversationTree } from '../../improv/branching';
import { processTurnWithComedy } from '../../comedy/comedyModeHelpers';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_IMPROV_TURNS = 10;

// ============================================================================
// SENTIMENT TRACKING
// ============================================================================

/**
 * Tracks sentiment events from audience reactions and routes them to the branching system.
 */
class SentimentTracker {
  private events: SentimentEvent[] = [];
  private tree: ConversationTree | null = null;

  constructor(tree: ConversationTree) {
    this.tree = tree;
  }

  recordEvent(type: SentimentType, intensity: number): void {
    const event: SentimentEvent = {
      type,
      intensity: Math.max(0, Math.min(1, intensity)),
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (this.tree) {
      recordSentiment(this.tree, event);
    }

    if (this.events.length > 10) {
      this.events.splice(0, this.events.length - 10);
    }
  }

  getRecentEvents(count: number = 5): SentimentEvent[] {
    return this.events.slice(-count);
  }

  getAllEvents(): SentimentEvent[] {
    return [...this.events];
  }
}

// ============================================================================
// MAIN IMPROV LOOP
// ============================================================================

export async function runImprovLoop(scenario: Scenario, ctx: ModeContext) {
  const initialTopic = scenario.config?.initialPrompt || scenario.title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?';
  const tree = createConversationTree(initialTopic);
  const sentimentTracker = new SentimentTracker(tree);

  let turnCount = 0;

  if (ctx.manager.getHistoryLength() === 0) {
    let seed = initialTopic;

    const recall = await ctx.searchAndRecall(seed);
    if (recall) {
      ctx.callbacks.onMessage('System', '🧠 Memory Recall Active', '#4ecdc4');
      seed += '\n' + recall;
    }

    ctx.callbacks.onMessage('Director', `Action! "${seed}"`, '#888');
    await processTurnWithComedy(ctx, seed);
    turnCount++;
  }

  while (ctx.isRunning() && turnCount < MAX_IMPROV_TURNS) {
    if (ctx.interruptQueue.length > 0) {
      const heckle = ctx.interruptQueue.shift()!;
      ctx.callbacks.onMessage('Director', `📢 HECKLER INTERRUPT: "${heckle}"`, '#ff6b6b');
      sentimentTracker.recordEvent('heckle', 0.6);
      await ctx.processTurn(`(A HECKLER just shouted: "${heckle}". Stop what you are doing and ROAST them immediately!)`);
      turnCount++;
      continue;
    }

    await new Promise(r => setTimeout(r, 800));
    if (!ctx.isRunning()) break;

    const recentEvents = sentimentTracker.getRecentEvents(5);
    const shouldEvaluate = turnCount % 2 === 0 || recentEvents.some(e => e.intensity > 0.6);

    let prompt = '(Reply naturally to the last thing said)';

    if (shouldEvaluate) {
      const decision = evaluateSentiment(tree, recentEvents);
      prompt = decision.suggestedPrompt;

      ctx.callbacks.onMessage(
        'Director',
        `${getStrategyEmoji(decision.strategy)} ${decision.reason}`,
        '#888'
      );

      advanceTree(tree, decision);
    }

    const currentDepth = tree.currentNode.depth;
    if (ctx.chaosLevel > 0 && Math.random() * 100 < ctx.chaosLevel) {
      const depthModifier = currentDepth > 1 ? 'really wild' : 'unexpected';
      prompt += ` (Something ${depthModifier} happens!)`;
    }

    await processTurnWithComedy(ctx, prompt);

    if (tree.currentNode.turnCount >= 4) {
      tree.currentNode.exhausted = true;
    }

    turnCount++;
  }

  const stats = getTreeStats(tree);
  ctx.callbacks.onMessage(
    'Director',
    `🎬 Scene ended after ${turnCount} turns. Tree: ${stats.totalNodes} nodes, depth ${stats.maxDepth}, avg sentiment: ${stats.averageSentiment.toFixed(2)}`,
    '#888'
  );

  if (ctx.comedy) {
    console.log('[CallbackEngine]', ctx.comedy.getSummary());
  }
}

// ============================================================================
// AUTONOMOUS LOOP WITH BRANCHING SUPPORT
// ============================================================================

export async function runAutonomousLoop(scenario: Scenario, ctx: ModeContext) {
  const initialTopic = scenario.config?.initialPrompt || getRandomAutonomousTopic();
  const tree = createConversationTree(initialTopic);
  const sentimentTracker = new SentimentTracker(tree);

  let turnCount = 0;
  ctx.callbacks.onMessage('Director', '🤖 Autonomous Mode Activated', '#4ecdc4');
  ctx.callbacks.onMessage('Director', `🌳 Branching Mode: Root topic "${initialTopic}"`, '#4ecdc4');

  if (ctx.manager.getHistoryLength() === 0) {
    ctx.callbacks.onMessage('Director', `Topic: "${initialTopic}"`, '#888');
    await processTurnWithComedy(ctx, initialTopic);
    tree.currentNode.turnCount++;
    turnCount++;
  }

  while (ctx.isRunning() && turnCount < MAX_IMPROV_TURNS) {
    if (ctx.interruptQueue.length > 0) {
      const heckle = ctx.interruptQueue.shift()!;
      ctx.callbacks.onMessage('Director', `📢 INTERRUPT: "${heckle}"`, '#ff6b6b');
      sentimentTracker.recordEvent('heckle', 0.5);
      await ctx.processTurn(`(SYSTEM: SUDDEN INTERRUPTION! Someone said: "${heckle}". React to this naturally.)`);
      turnCount++;
      continue;
    }

    await new Promise(r => setTimeout(r, 1000));
    if (!ctx.isRunning()) break;

    const recentEvents = sentimentTracker.getRecentEvents(5);
    const shouldEvaluate = turnCount % 2 === 0 || recentEvents.some(e => e.intensity > 0.6);

    let prompt: string;

    if (shouldEvaluate) {
      const decision = evaluateSentiment(tree, recentEvents);
      prompt = decision.suggestedPrompt;

      ctx.callbacks.onMessage(
        'Director',
        `${getStrategyEmoji(decision.strategy)} ${decision.reason}`,
        '#888'
      );

      advanceTree(tree, decision);
    } else {
      prompt = '(Continue the conversation naturally. Be funny or insightful.)';
      tree.currentNode.turnCount++;
    }

    if (turnCount > 0 && turnCount % 5 === 0 && !shouldEvaluate) {
      const newTopic = getRandomAutonomousTopic();
      prompt = `(SYSTEM: The conversation is getting stale. Smoothly transition the topic to: "${newTopic}")`;
      ctx.callbacks.onMessage('Director', `➡️ Shift to: ${newTopic}`, '#888');
    }

    if (ctx.chaosLevel > 0 && Math.random() * 100 < ctx.chaosLevel && turnCount % 3 === 0) {
      prompt += ' (SYSTEM: Something unexpected happens or someone makes a controversial statement. React!)';
    }

    await processTurnWithComedy(ctx, prompt);

    if (tree.currentNode.turnCount >= 4) {
      tree.currentNode.exhausted = true;
    }

    turnCount++;
  }

  const stats = getTreeStats(tree);
  ctx.callbacks.onMessage(
    'Director',
    `🎬 Session ended after ${turnCount} turns. Tree: ${stats.totalNodes} nodes, depth ${stats.maxDepth}`,
    '#888'
  );

  if (ctx.comedy) {
    console.log('[CallbackEngine]', ctx.comedy.getSummary());
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRandomAutonomousTopic(): string {
  const topics = [
    "What if we are all living in a simulation?",
    "The pros and cons of owning a pet dragon.",
    "Why is pizza the perfect food?",
    "Explain quantum physics using only food metaphors.",
    "The worst possible time to start a dance party.",
    "If animals could talk, which one would be the rudest?",
    "Time travel: tourist destination or disaster waiting to happen?",
    "The hidden agenda of garden gnomes.",
    "Why do we park on driveways and drive on parkways?",
    "The existential dread of autocorrect.",
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

function getStrategyEmoji(strategy: string): string {
  switch (strategy) {
    case 'escalate': return '🔥';
    case 'pivot': return '🔄';
    case 'callback': return '🔗';
    case 'deepen': return '🔍';
    case 'reset': return '🆕';
    default: return '🎭';
  }
}

// Legacy loop for backward compatibility
export async function runLegacyImprovLoop(scenario: Scenario, ctx: ModeContext) {
  return runImprovLoop(scenario, ctx);
}
