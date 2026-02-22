/**
 * Conversation Branching System with Sentiment-Driven Topic Management
 * 
 * Implements a 4-layer conversation tree where audience sentiment
 * (cheer/boo reactions) determines whether to double down on a topic
 * or pivot to something new.
 */

import type { ModeContext } from '../Director/modes/ModeContext';
import type { Scenario } from '../Director/Director';

/** Sentiment reaction types from the audience */
export type SentimentType = 'cheer' | 'boo' | 'neutral' | 'applause' | 'heckle';

/** Sentiment event triggered by audience reaction */
export interface SentimentEvent {
  type: SentimentType;
  intensity: number; // 0.0 to 1.0
  timestamp: number;
}

/** Threshold constants for sentiment triggers */
export const SENTIMENT_THRESHOLDS = {
  /** Cheer intensity > 0.7 triggers "double down" on current topic */
  DOUBLE_DOWN: 0.7,
  /** Boo intensity > 0.5 triggers pivot to new topic */
  PIVOT: 0.5,
  /** Minimum intensity to register as significant reaction */
  MINIMUM_REACTION: 0.3,
} as const;

/** Represents a node in the 4-layer conversation tree */
export interface ConversationNode {
  /** Unique identifier for this node */
  id: string;
  /** The topic or subject being discussed at this node */
  topic: string;
  /** Depth level in the tree (0-3, where 3 is deepest/leaf) */
  depth: number;
  /** Child nodes representing follow-up directions */
  children: ConversationNode[];
  /** Parent node reference (null for root) */
  parent: ConversationNode | null;
  /** Whether this topic has been explored/exhausted */
  exhausted: boolean;
  /** Sentiment score accumulated for this topic */
  sentimentScore: number;
  /** Number of turns spent on this topic */
  turnCount: number;
}

/** The 4-layer conversation tree structure */
export interface ConversationTree {
  /** Root node of the tree */
  root: ConversationNode;
  /** Current active node in the conversation */
  currentNode: ConversationNode;
  /** All nodes flattened for easy lookup */
  allNodes: Map<string, ConversationNode>;
}

/** Strategy for handling sentiment triggers */
export type BranchStrategy = 'double_down' | 'pivot' | 'continue' | 'escalate';

/** Result of evaluating sentiment and determining next action */
export interface SentimentDecision {
  strategy: BranchStrategy;
  reason: string;
  targetNode?: ConversationNode;
  suggestedPrompt: string;
}

/** Topic bank for pivoting when booed */
export const PIVOT_TOPICS = [
  "Why do hotdogs come in packs of 10 but buns in packs of 8?",
  "What if we are all living in a simulation?",
  "The pros and cons of owning a pet dragon.",
  "Why is pizza the perfect food?",
  "Explain quantum physics using only food metaphors.",
  "The worst possible time to start a dance party.",
  "If animals could talk, which one would be the rudest?",
  "Time travel: tourist destination or disaster waiting to happen?",
  "What if gravity just stopped working for 5 seconds?",
  "The social etiquette of cutting in line.",
  "Why do we park on driveways and drive on parkways?",
  "The philosophical implications of socks disappearing in the dryer.",
] as const;

/** Double-down prompts for when audience cheers */
export const DOUBLE_DOWN_PROMPTS = [
  "(SYSTEM: The audience LOVES this. Dig deeper into this topic! Push the boundaries even further!)",
  "(SYSTEM: They're eating this up! Double down on this theme with your hottest take yet!)",
  "(SYSTEM: Huge positive reaction! Really lean into this subject - go wild!)",
  "(SYSTEM: The crowd wants more of THIS specifically! Take it to the next level!)",
] as const;

/** Pivot prompts for when audience boos */
export const PIVOT_PROMPTS = [
  "(SYSTEM: The audience is losing interest. Gracefully pivot to something fresh!)",
  "(SYSTEM: Tough crowd on this one. Let's abandon this topic and find common ground elsewhere!)",
  "(SYSTEM: Not landing? No problem! Smoothly transition to something completely different!)",
  "(SYSTEM: Time to read the room. Leave this subject behind and start something new!)",
] as const;

/**
 * Creates a new 4-layer conversation tree with the given root topic
 */
export function createConversationTree(rootTopic: string): ConversationTree {
  const root: ConversationNode = {
    id: 'root',
    topic: rootTopic,
    depth: 0,
    children: [],
    parent: null,
    exhausted: false,
    sentimentScore: 0,
    turnCount: 0,
  };

  const allNodes = new Map<string, ConversationNode>();
  allNodes.set('root', root);

  return {
    root,
    currentNode: root,
    allNodes,
  };
}

/**
 * Creates a child node at the specified parent
 */
export function createChildNode(
  parent: ConversationNode,
  topic: string,
  id?: string
): ConversationNode {
  const childId = id || `${parent.id}_${parent.children.length}`;
  
  const child: ConversationNode = {
    id: childId,
    topic,
    depth: parent.depth + 1,
    children: [],
    parent,
    exhausted: false,
    sentimentScore: 0,
    turnCount: 0,
  };

  parent.children.push(child);
  return child;
}

/**
 * Records a sentiment event and updates the current node's sentiment score
 */
export function recordSentiment(
  tree: ConversationTree,
  event: SentimentEvent
): void {
  const { currentNode } = tree;
  
  switch (event.type) {
    case 'cheer':
    case 'applause':
      currentNode.sentimentScore += event.intensity;
      break;
    case 'boo':
    case 'heckle':
      currentNode.sentimentScore -= event.intensity;
      break;
    case 'neutral':
    default:
      // Neutral has minimal effect
      currentNode.sentimentScore += event.intensity * 0.1;
      break;
  }
}

/**
 * Evaluates current sentiment and determines the branching strategy
 * 
 * Rules:
 * - If cheer > 0.7: DOUBLE DOWN on current topic
 * - If boo > 0.5: PIVOT to new topic
 * - Otherwise: CONTINUE or ESCALATE based on depth
 */
export function evaluateSentiment(
  tree: ConversationTree,
  recentEvents: SentimentEvent[]
): SentimentDecision {
  const { currentNode } = tree;
  
  // Calculate recent sentiment intensity
  const cheerIntensity = recentEvents
    .filter(e => e.type === 'cheer' || e.type === 'applause')
    .reduce((sum, e) => sum + e.intensity, 0);
  
  const booIntensity = recentEvents
    .filter(e => e.type === 'boo' || e.type === 'heckle')
    .reduce((sum, e) => sum + e.intensity, 0);

  // Apply sentiment triggers
  if (cheerIntensity > SENTIMENT_THRESHOLDS.DOUBLE_DOWN) {
    return {
      strategy: 'double_down',
      reason: `Strong positive reception (${cheerIntensity.toFixed(2)}). Doubling down on: ${currentNode.topic}`,
      suggestedPrompt: getRandomPrompt(DOUBLE_DOWN_PROMPTS),
    };
  }

  if (booIntensity > SENTIMENT_THRESHOLDS.PIVOT) {
    const pivotTopic = getRandomPivotTopic();
    return {
      strategy: 'pivot',
      reason: `Negative reception (${booIntensity.toFixed(2)}). Pivoting away from: ${currentNode.topic}`,
      targetNode: findOrCreatePivotNode(tree, pivotTopic),
      suggestedPrompt: getRandomPrompt(PIVOT_PROMPTS) + ` Transition to: "${pivotTopic}"`,
    };
  }

  // Continue current branch if we're not at max depth
  if (currentNode.depth < 3 && currentNode.turnCount < 3) {
    return {
      strategy: 'continue',
      reason: `Moderate reception. Continuing at depth ${currentNode.depth}.`,
      suggestedPrompt: '(Continue developing this topic naturally.)',
    };
  }

  // Escalate by moving deeper or pivoting
  if (currentNode.depth < 3 && currentNode.children.length > 0) {
    const nextNode = currentNode.children[0];
    return {
      strategy: 'escalate',
      reason: `Max turns at current depth. Escalating deeper into the tree.`,
      targetNode: nextNode,
      suggestedPrompt: `(Take this in a new direction. Explore: "${nextNode.topic}")`,
    };
  }

  // At max depth or exhausted, suggest pivot
  const pivotTopic = getRandomPivotTopic();
  return {
    strategy: 'pivot',
    reason: 'Topic exhausted or at max depth. Pivoting to fresh material.',
    targetNode: findOrCreatePivotNode(tree, pivotTopic),
    suggestedPrompt: getRandomPrompt(PIVOT_PROMPTS) + ` Transition to: "${pivotTopic}"`,
  };
}

/**
 * Advances to the next node in the tree based on strategy
 */
export function advanceTree(
  tree: ConversationTree,
  decision: SentimentDecision
): ConversationNode {
  if (decision.targetNode) {
    tree.currentNode = decision.targetNode;
  } else if (decision.strategy === 'double_down') {
    // Stay on current node but increment turn count
    tree.currentNode.turnCount++;
  } else if (decision.strategy === 'escalate' && tree.currentNode.children.length > 0) {
    // Move to first child
    tree.currentNode = tree.currentNode.children[0];
  } else if (decision.strategy === 'pivot') {
    // Create new branch for pivot
    const pivotNode = createChildNode(tree.root, tree.currentNode.topic + ' (pivoted)');
    tree.currentNode = pivotNode;
  }

  return tree.currentNode;
}

/**
 * Marks the current topic as exhausted and moves up the tree
 */
export function exhaustCurrentTopic(tree: ConversationTree): void {
  tree.currentNode.exhausted = true;
  
  // Try to move to parent or sibling
  if (tree.currentNode.parent) {
    const siblings = tree.currentNode.parent.children.filter(c => !c.exhausted);
    if (siblings.length > 0) {
      tree.currentNode = siblings[0];
    } else {
      tree.currentNode.parent.exhausted = true;
      tree.currentNode = tree.currentNode.parent;
    }
  }
}

/**
 * Gets a random pivot topic from the topic bank
 */
function getRandomPivotTopic(): string {
  return PIVOT_TOPICS[Math.floor(Math.random() * PIVOT_TOPICS.length)];
}

/**
 * Gets a random prompt from an array
 */
function getRandomPrompt(prompts: readonly string[]): string {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Finds an existing node for a topic or creates a new one under root
 */
function findOrCreatePivotNode(tree: ConversationTree, topic: string): ConversationNode {
  // Check if this topic already exists
  for (const node of tree.allNodes.values()) {
    if (node.topic === topic && !node.exhausted) {
      return node;
    }
  }

  // Create new node under root
  const newNode = createChildNode(tree.root, topic, `pivot_${Date.now()}`);
  tree.allNodes.set(newNode.id, newNode);
  return newNode;
}

/**
 * Gets the path from root to current node
 */
export function getCurrentPath(tree: ConversationTree): ConversationNode[] {
  const path: ConversationNode[] = [];
  let current: ConversationNode | null = tree.currentNode;
  
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  
  return path;
}

/**
 * Gets statistics about the conversation tree
 */
export function getTreeStats(tree: ConversationTree): {
  totalNodes: number;
  maxDepth: number;
  exhaustedNodes: number;
  averageSentiment: number;
} {
  let maxDepth = 0;
  let exhaustedCount = 0;
  let totalSentiment = 0;
  
  for (const node of tree.allNodes.values()) {
    maxDepth = Math.max(maxDepth, node.depth);
    if (node.exhausted) exhaustedCount++;
    totalSentiment += node.sentimentScore;
  }

  return {
    totalNodes: tree.allNodes.size,
    maxDepth,
    exhaustedNodes: exhaustedCount,
    averageSentiment: totalSentiment / tree.allNodes.size,
  };
}

/**
 * Branching conversation loop that uses the 4-layer tree
 * with sentiment-based branching decisions
 */
export async function runBranchingConversationLoop(
  scenario: Scenario,
  ctx: ModeContext
): Promise<void> {
  const initialTopic = scenario.config?.initialPrompt || 
    scenario.title || 
    'Why do hotdogs come in packs of 10 but buns in packs of 8?';

  const tree = createConversationTree(initialTopic);
  const sentimentHistory: SentimentEvent[] = [];
  let turnCount = 0;

  ctx.callbacks.onMessage('Director', '🌳 Branching Mode Activated', '#4ecdc4');
  ctx.callbacks.onMessage('Director', `Root topic: "${initialTopic}"`, '#888');

  // Initialize with root topic
  if (ctx.manager.getHistoryLength() === 0) {
    await ctx.processTurn(initialTopic);
    tree.currentNode.turnCount++;
  }

  while (ctx.isRunning()) {
    // Check for interrupts (heckles count as sentiment events)
    if (ctx.interruptQueue.length > 0) {
      const heckle = ctx.interruptQueue.shift()!;
      ctx.callbacks.onMessage('Director', `📢 HECKLER: "${heckle}"`, '#ff6b6b');
      
      // Record heckle as negative sentiment
      sentimentHistory.push({
        type: 'heckle',
        intensity: 0.6,
        timestamp: Date.now(),
      });
      
      await ctx.processTurn(`(A HECKLER just shouted: "${heckle}". React appropriately!)`);
      tree.currentNode.turnCount++;
      continue;
    }

    await new Promise(r => setTimeout(r, 800));
    if (!ctx.isRunning()) break;

    // Evaluate sentiment and determine strategy (every 2 turns or when sentiment spikes)
    const recentEvents = sentimentHistory.slice(-5); // Last 5 events
    const shouldEvaluate = turnCount % 2 === 0 || recentEvents.some(e => e.intensity > 0.6);
    
    let prompt: string;
    let decision: SentimentDecision | null = null;

    if (shouldEvaluate) {
      decision = evaluateSentiment(tree, recentEvents);
      prompt = decision.suggestedPrompt;
      
      // Log the decision
      ctx.callbacks.onMessage(
        'Director', 
        `${getStrategyEmoji(decision.strategy)} ${decision.reason}`, 
        '#888'
      );
      
      // Advance the tree based on decision
      advanceTree(tree, decision);
    } else {
      prompt = '(Continue the conversation naturally.)';
      tree.currentNode.turnCount++;
    }

    // Inject chaos based on current depth
    if (ctx.chaosLevel > 0 && Math.random() * 100 < ctx.chaosLevel) {
      const depthModifier = tree.currentNode.depth > 1 ? 'really wild' : 'unexpected';
      prompt += ` (Something ${depthModifier} happens!)`;
    }

    await ctx.processTurn(prompt);
    turnCount++;

    // Mark as exhausted if we've spent too many turns
    if (tree.currentNode.turnCount >= 4) {
      tree.currentNode.exhausted = true;
    }

    // Clear old sentiment events (keep last 10)
    if (sentimentHistory.length > 10) {
      sentimentHistory.splice(0, sentimentHistory.length - 10);
    }
  }

  // Log final tree stats
  const stats = getTreeStats(tree);
  ctx.callbacks.onMessage(
    'Director', 
    `🎬 Scene ended. Tree stats: ${stats.totalNodes} nodes, depth ${stats.maxDepth}, avg sentiment: ${stats.averageSentiment.toFixed(2)}`, 
    '#888'
  );
}

/**
 * Records an external sentiment event (e.g., from UI button clicks)
 */
export function triggerSentiment(
  tree: ConversationTree,
  type: SentimentType,
  intensity: number
): SentimentDecision | null {
  const event: SentimentEvent = {
    type,
    intensity: Math.max(0, Math.min(1, intensity)),
    timestamp: Date.now(),
  };

  recordSentiment(tree, event);

  // Immediate evaluation for strong reactions
  if (intensity > SENTIMENT_THRESHOLDS.DOUBLE_DOWN || 
      (type === 'boo' && intensity > SENTIMENT_THRESHOLDS.PIVOT)) {
    return evaluateSentiment(tree, [event]);
  }

  return null;
}

/**
 * Gets emoji representation for a strategy
 */
function getStrategyEmoji(strategy: BranchStrategy): string {
  switch (strategy) {
    case 'double_down': return '📈';
    case 'pivot': return '🔄';
    case 'continue': return '➡️';
    case 'escalate': return '⬆️';
    default: return '➡️';
  }
}
