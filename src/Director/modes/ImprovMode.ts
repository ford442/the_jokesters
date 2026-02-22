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
import { CallbackEngine, getGlobalCallbackEngine, resetGlobalCallbackEngine } from '../../comedy/callbackEngine';
import { rateJoke } from '../../comedy/qualityFilter';
import { getRandomJoke } from '../../comedy/jokeLoader';
import type { JokeBit } from '../../comedy/jokeLoader';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_IMPROV_TURNS = 10;
const QUALITY_THRESHOLD = 6;

// ============================================================================
// SENTIMENT TRACKING
// ============================================================================

/**
 * Tracks sentiment events from audience reactions and routes them to both
 * the branching system and callback engine.
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
    
    // Update the conversation tree
    if (this.tree) {
      recordSentiment(this.tree, event);
    }
    
    // Keep only last 10 events
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
// QUALITY GATE
// ============================================================================

/**
 * Quality gate that filters responses through the quality filter.
 * If a response scores below threshold, attempts to get alternative content.
 */
class QualityGate {
  private fallbackAttempts = 0;
  private maxFallbacks = 3;
  
  /**
   * Rate a joke/response and return quality assessment
   */
  async assessQuality(text: string): Promise<{ passed: boolean; score: number; alternative?: JokeBit }> {
    const rating = rateJoke(text);
    const passed = rating.score >= QUALITY_THRESHOLD;
    
    if (!passed && this.fallbackAttempts < this.maxFallbacks) {
      this.fallbackAttempts++;
      const alternative = await getRandomJoke();
      return { passed: false, score: rating.score, alternative };
    }
    
    // Reset counter on pass
    if (passed) {
      this.fallbackAttempts = 0;
    }
    
    return { passed, score: rating.score };
  }
  
  /**
   * Get a prompt to inject when quality is low
   */
  getQualityPrompt(score: number): string {
    if (score < 4) {
      return "(SYSTEM: That was weak. Punch it up with something surprising or unexpected!)";
    } else if (score < 6) {
      return "(SYSTEM: Add a twist or subvert expectations. Make it land harder!)";
    }
    return "";
  }
  
  reset(): void {
    this.fallbackAttempts = 0;
  }
}

// ============================================================================
// CALLBACK MANAGER
// ============================================================================

/**
 * Manages running gags across the improv session using the CallbackEngine.
 */
class CallbackManager {
  private engine: CallbackEngine;
  private registeredJokes: Set<string> = new Set();
  private ctx: ModeContext | null = null;
  
  constructor(ctx?: ModeContext) {
    this.engine = getGlobalCallbackEngine();
    this.ctx = ctx || null;
  }
  
  /**
   * Set the mode context for visual feedback
   */
  setContext(ctx: ModeContext): void {
    this.ctx = ctx;
  }
  
  /**
   * Register a joke theme for callback tracking
   */
  registerJoke(jokeId: string, themes: string[], context?: string): void {
    if (!this.registeredJokes.has(jokeId)) {
      this.engine.registerJoke(jokeId, themes, context);
      this.registeredJokes.add(jokeId);
    }
  }
  
  /**
   * Record that a callback/reference was made to a joke
   * Triggers visual feedback if context is available
   */
  recordCallback(jokeId: string, agentId?: string): void {
    this.engine.recordCallback(jokeId);
    
    // Get updated metrics after recording
    const updatedMetrics = this.engine.getCallbackMetrics(jokeId);
    
    // Trigger visual feedback if context is available
    if (this.ctx && updatedMetrics && agentId) {
      this.ctx.recordCallbackVisual(agentId, jokeId, updatedMetrics.timesUsed, updatedMetrics.status);
    }
  }
  
  /**
   * Get the best callback recommendation for a theme
   */
  getBestCallback(theme: string): { id: string; context: string[] } | null {
    const joke = this.engine.getBestCallbackForTheme(theme);
    if (joke && joke.callbackCount < 5) { // Avoid dead jokes
      return {
        id: joke.id,
        context: joke.contextSnippets,
      };
    }
    return null;
  }
  
  /**
   * Get prompt injection for callback suggestions
   */
  getCallbackPrompt(): string {
    const peakCallbacks = this.engine.getPeakCallbacks();
    if (peakCallbacks.length > 0) {
      const callback = peakCallbacks[0];
      const contexts = callback.contextSnippets.slice(-1);
      if (contexts.length > 0) {
        return `(SYSTEM: Reference this earlier bit: "${contexts[0]}" - bring it back for a callback!)`;
      }
    }
    return "";
  }
  
  /**
   * Get summary of running gags for logging
   */
  getSummary(): string {
    return this.engine.getSummary();
  }
  
  /**
   * Reset for new session
   */
  reset(): void {
    resetGlobalCallbackEngine();
    this.engine = getGlobalCallbackEngine();
    this.registeredJokes.clear();
  }
}

// ============================================================================
// MAIN IMPROV LOOP
// ============================================================================

export async function runImprovLoop(scenario: Scenario, ctx: ModeContext) {
  // Initialize systems
  const initialTopic = scenario.config?.initialPrompt || scenario.title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?';
  const tree = createConversationTree(initialTopic);
  const sentimentTracker = new SentimentTracker(tree);
  const qualityGate = new QualityGate();
  const callbackManager = new CallbackManager(ctx);
  
  // Reset callback engine for new session
  callbackManager.reset();
  
  let turnCount = 0;
  
  if (ctx.manager.getHistoryLength() === 0) {
    let seed = initialTopic;

    const recall = await ctx.searchAndRecall(seed);
    if (recall) {
      ctx.callbacks.onMessage('System', '🧠 Memory Recall Active', '#4ecdc4');
      seed += '\n' + recall;
    }

    ctx.callbacks.onMessage('Director', `Action! "${seed}"`, '#888');
    
    // Quality check the seed response
    const response = await processTurnWithQuality(ctx, seed, qualityGate);
    if (response) {
      // Register themes from the response
      const currentAgent = ctx.manager.getCurrentAgent();
      extractAndRegisterThemes(response, callbackManager, turnCount, currentAgent?.id);
    }
    
    turnCount++;
  }

  while (ctx.isRunning() && turnCount < MAX_IMPROV_TURNS) {
    // Handle heckles/interrupts
    if (ctx.interruptQueue.length > 0) {
      const heckle = ctx.interruptQueue.shift()!;
      ctx.callbacks.onMessage('Director', `📢 HECKLER INTERRUPT: "${heckle}"`, '#ff6b6b');
      
      // Record heckle as negative sentiment
      sentimentTracker.recordEvent('heckle', 0.6);
      
      await ctx.processTurn(`(A HECKLER just shouted: "${heckle}". Stop what you are doing and ROAST them immediately!)`);
      turnCount++;
      continue;
    }

    await new Promise(r => setTimeout(r, 800));
    if (!ctx.isRunning()) break;

    // Evaluate sentiment every 2 turns or when strong reaction detected
    const recentEvents = sentimentTracker.getRecentEvents(5);
    const shouldEvaluate = turnCount % 2 === 0 || recentEvents.some(e => e.intensity > 0.6);
    
    let prompt = '(Reply naturally to the last thing said)';
    
    if (shouldEvaluate) {
      const decision = evaluateSentiment(tree, recentEvents);
      prompt = decision.suggestedPrompt;
      
      // Log the decision
      ctx.callbacks.onMessage(
        'Director',
        `${getStrategyEmoji(decision.strategy)} ${decision.reason}`,
        '#888'
      );
      
      // Advance the tree
      advanceTree(tree, decision);
    }

    // Check for callback opportunities
    const callbackPrompt = callbackManager.getCallbackPrompt();
    if (callbackPrompt && Math.random() < 0.3) { // 30% chance to inject callback
      prompt += ' ' + callbackPrompt;
    }

    // Inject chaos based on depth and chaos level
    const currentDepth = tree.currentNode.depth;
    if (ctx.chaosLevel > 0 && Math.random() * 100 < ctx.chaosLevel) {
      const depthModifier = currentDepth > 1 ? 'really wild' : 'unexpected';
      prompt += ` (Something ${depthModifier} happens!)`;
    }

    // Process turn with quality gating
    const response = await processTurnWithQuality(ctx, prompt, qualityGate);
    if (response) {
      const currentAgent = ctx.manager.getCurrentAgent();
      extractAndRegisterThemes(response, callbackManager, turnCount, currentAgent?.id);
    }

    // Mark topic as exhausted if we've spent too many turns on it
    if (tree.currentNode.turnCount >= 4) {
      tree.currentNode.exhausted = true;
    }

    turnCount++;
  }

  // Log final stats
  const stats = getTreeStats(tree);
  ctx.callbacks.onMessage(
    'Director',
    `🎬 Scene ended after ${turnCount} turns. Tree: ${stats.totalNodes} nodes, depth ${stats.maxDepth}, avg sentiment: ${stats.averageSentiment.toFixed(2)}`,
    '#888'
  );
  
  // Log callback summary
  const callbackSummary = callbackManager.getSummary();
  console.log('[CallbackEngine]', callbackSummary);
}

// ============================================================================
// AUTONOMOUS LOOP WITH BRANCHING SUPPORT
// ============================================================================

export async function runAutonomousLoop(scenario: Scenario, ctx: ModeContext) {
  // Initialize branching system
  const initialTopic = scenario.config?.initialPrompt || getRandomAutonomousTopic();
  const tree = createConversationTree(initialTopic);
  const sentimentTracker = new SentimentTracker(tree);
  const qualityGate = new QualityGate();
  const callbackManager = new CallbackManager(ctx);
  
  callbackManager.reset();

  let turnCount = 0;
  ctx.callbacks.onMessage('Director', '🤖 Autonomous Mode Activated', '#4ecdc4');
  ctx.callbacks.onMessage('Director', `🌳 Branching Mode: Root topic "${initialTopic}"`, '#4ecdc4');

  if (ctx.manager.getHistoryLength() === 0) {
    ctx.callbacks.onMessage('Director', `Topic: "${initialTopic}"`, '#888');
    
    const response = await processTurnWithQuality(ctx, initialTopic, qualityGate);
    if (response) {
      extractAndRegisterThemes(response, callbackManager, turnCount);
    }
    
    tree.currentNode.turnCount++;
    turnCount++;
  }

  while (ctx.isRunning() && turnCount < MAX_IMPROV_TURNS) {
    // Handle interrupts
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

    // Evaluate sentiment and determine strategy
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

    // Topic rotation every 5 turns (overridden by sentiment evaluation)
    if (turnCount > 0 && turnCount % 5 === 0 && !shouldEvaluate) {
      const newTopic = getRandomAutonomousTopic();
      prompt = `(SYSTEM: The conversation is getting stale. Smoothly transition the topic to: "${newTopic}")`;
      ctx.callbacks.onMessage('Director', `➡️ Shift to: ${newTopic}`, '#888');
    }

    // Chaos injection
    if (ctx.chaosLevel > 0 && Math.random() * 100 < ctx.chaosLevel && turnCount % 3 === 0) {
      prompt += ' (SYSTEM: Something unexpected happens or someone makes a controversial statement. React!)';
    }

    // Process with quality gating
    const response = await processTurnWithQuality(ctx, prompt, qualityGate);
    if (response) {
      const currentAgent = ctx.manager.getCurrentAgent();
      extractAndRegisterThemes(response, callbackManager, turnCount, currentAgent?.id);
    }

    // Mark exhausted after 4 turns
    if (tree.currentNode.turnCount >= 4) {
      tree.currentNode.exhausted = true;
    }

    turnCount++;
  }

  // Final stats
  const stats = getTreeStats(tree);
  ctx.callbacks.onMessage(
    'Director',
    `🎬 Session ended after ${turnCount} turns. Tree: ${stats.totalNodes} nodes, depth ${stats.maxDepth}`,
    '#888'
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process a turn with quality gating - checks response quality and may retry
 */
async function processTurnWithQuality(
  ctx: ModeContext,
  prompt: string,
  qualityGate: QualityGate
): Promise<string | null> {
  // Pre-check: if prompt suggests a joke, inject quality guidance
  const qualityPrompt = prompt; // The LLM will generate the content
  
  // Track the actual response for quality assessment
  let responseText = '';
  
  const originalOnSentence = ctx.callbacks.onMessage;
  
  // Wrap the message callback to capture responses
  const wrappedCallbacks = {
    ...ctx.callbacks,
    onMessage: (sender: string, text: string, color: string) => {
      if (sender !== 'Director' && sender !== 'System' && sender !== 'Audience') {
        responseText += text + ' ';
      }
      originalOnSentence(sender, text, color);
    }
  };
  
  // Create a modified context with wrapped callbacks
  const modifiedCtx = {
    ...ctx,
    callbacks: wrappedCallbacks
  };
  
  await modifiedCtx.processTurn(qualityPrompt);
  
  // Assess quality of the generated response
  if (responseText.trim()) {
    const assessment = await qualityGate.assessQuality(responseText.trim());
    
    if (!assessment.passed && assessment.alternative) {
      // Inject alternative content if quality is too low
      const qualityPrompt = qualityGate.getQualityPrompt(assessment.score);
      if (qualityPrompt) {
        await ctx.processTurn(qualityPrompt);
      }
    }
    
    return responseText.trim();
  }
  
  return null;
}

/**
 * Extract themes from a response and register with callback engine
 */
function extractAndRegisterThemes(
  response: string,
  callbackManager: CallbackManager,
  turnCount: number,
  agentId?: string
): void {
  // Extract potential themes/tags from the response
  const responseLower = response.toLowerCase();
  
  // Common comedy themes to look for
  const themePatterns: Record<string, RegExp[]> = {
    'tech': [/tech/, /computer/, /ai/, /algorithm/, /code/, /app/],
    'relationships': [/dating/, /marriage/, /boyfriend/, /girlfriend/, /single/],
    'work': [/job/, /boss/, /office/, /work/, /career/, /startup/],
    'money': [/money/, /rich/, /poor/, /expensive/, /cheap/],
    'food': [/food/, /eat/, /restaurant/, /cook/, /meal/],
    'existential': [/life/, /death/, /meaning/, /purpose/, /universe/],
  };
  
  const matchedThemes: string[] = [];
  
  for (const [theme, patterns] of Object.entries(themePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(responseLower)) {
        matchedThemes.push(theme);
        break;
      }
    }
  }
  
  // Register the joke with extracted themes
  if (matchedThemes.length > 0) {
    const jokeId = `turn_${turnCount}_${Date.now()}`;
    callbackManager.registerJoke(jokeId, matchedThemes, response.substring(0, 100));
    
    // Also record it as a first-time callback to trigger visual feedback
    if (agentId) {
      callbackManager.recordCallback(jokeId, agentId);
    }
  }
}

/**
 * Get a random topic for autonomous mode
 */
function getRandomAutonomousTopic(): string {
  const topics = [
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
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Get emoji representation for a strategy
 */
function getStrategyEmoji(strategy: string): string {
  switch (strategy) {
    case 'double_down': return '📈';
    case 'pivot': return '🔄';
    case 'continue': return '➡️';
    case 'escalate': return '⬆️';
    default: return '➡️';
  }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy improv loop without branching (for backwards compatibility)
 */
export async function runLegacyImprovLoop(scenario: Scenario, ctx: ModeContext) {
  if (ctx.manager.getHistoryLength() === 0) {
    let seed = scenario.config?.initialPrompt || scenario.title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?';

    const recall = await ctx.searchAndRecall(seed);
    if (recall) {
      ctx.callbacks.onMessage('System', '🧠 Memory Recall Active', '#4ecdc4');
      seed += '\n' + recall;
    }

    ctx.callbacks.onMessage('Director', `Action! "${seed}"`, '#888');
    await ctx.processTurn(seed);
  }

  while (ctx.isRunning()) {
    if (ctx.interruptQueue.length > 0) {
      const heckle = ctx.interruptQueue.shift()!;
      ctx.callbacks.onMessage('Director', `📢 HECKLER INTERRUPT: "${heckle}"`, '#ff6b6b');
      await ctx.processTurn(`(A HECKLER just shouted: "${heckle}". Stop what you are doing and ROAST them immediately!)`);
      continue;
    }

    await new Promise(r => setTimeout(r, 800));
    if (!ctx.isRunning()) break;

    const turnCount = ctx.manager.getHistoryLength();
    let prompt = '(Reply naturally to the last thing said)';

    if (ctx.interruptQueue.length > 0) {
      const heckle = ctx.interruptQueue.shift();
      prompt = `(SYSTEM: SUDDEN INTERRUPTION! The audience yells: "${heckle}". React to this IMMEDIATELY and integrate it into the scene!)`;
      ctx.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
    } else {
      if (turnCount % 3 === 0 && Math.random() * 100 < ctx.chaosLevel) {
        prompt = '(Suddenly, a physical disaster happens. React with panic and crass humor!)';
      } else if (turnCount % 4 === 0 && Math.random() * 100 < ctx.chaosLevel) {
        prompt = '(Make a highbrow reference to history that completely misses the point.)';
      }
    }

    await ctx.processTurn(prompt);
  }
}
