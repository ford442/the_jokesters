/**
 * Callback Engine - Tracks jokes by theme and calculates running gag decay.
 * 
 * Comedy theory: Callbacks get funnier up to a point (3rd callback = peak),
 * then become annoying (5th+ = overdone).
 * 
 * Usage:
 *   const engine = new CallbackEngine();
 *   engine.registerJoke('banana-peel', ['slapstick', 'fruit', 'falling']);
 *   const value = engine.getCallbackValue('banana-peel'); // 1.0 on first call
 *   engine.recordCallback('banana-peel');
 */

export interface JokeEntry {
  id: string;
  themes: string[];
  callbackCount: number;
  firstSeenAt: number;
  lastCallbackAt: number;
  contextSnippets: string[];
}

export interface CallbackMetrics {
  value: number;        // 0.0 to 1.5, current comedic value
  status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead';
  timesUsed: number;
  recommended: boolean; // Should we use this callback now?
}

export interface ThemeStats {
  theme: string;
  jokeCount: number;
  totalCallbacks: number;
  hottestJokeId: string | null;
}

/**
 * Calculates running gag decay using a bell curve:
 * - 1st callback: 1.0 (fresh, establishing)
 * - 2nd callback: 1.2 (building momentum)
 * - 3rd callback: 1.5 (PEAK - maximum hilarity)
 * - 4th callback: 1.1 (still good but fading)
 * - 5th callback: 0.6 (getting annoying)
 * - 6th+ callback: 0.2 (dead horse, stop beating)
 */
function calculateDecayCurve(count: number): number {
  if (count <= 0) return 1.0;
  
  // Bell curve centered at 3rd callback
  const peak = 3;
  const curve = Math.exp(-Math.pow(count - peak, 2) / 4);
  
  // Scale: peak at 1.5, minimum at 0.2
  return 0.2 + 1.3 * curve;
}

function getStatusFromCount(count: number): CallbackMetrics['status'] {
  if (count === 0) return 'fresh';
  if (count === 1) return 'building';
  if (count === 2) return 'building';
  if (count === 3) return 'peak';
  if (count === 4) return 'declining';
  return 'dead';
}

export class CallbackEngine {
  private jokes: Map<string, JokeEntry> = new Map();
  private themeIndex: Map<string, Set<string>> = new Map();
  private maxContextSnippets = 3;

  /**
   * Register a new joke with associated themes/tags.
   * @param jokeId Unique identifier for the joke
   * @param themes Array of theme tags (e.g., ['slapstick', 'banana'])
   * @param context Optional context snippet for recall
   */
  public registerJoke(jokeId: string, themes: string[], context?: string): void {
    const now = Date.now();
    
    if (this.jokes.has(jokeId)) {
      // Update themes for existing joke
      const existing = this.jokes.get(jokeId)!;
      const newThemes = themes.filter(t => !existing.themes.includes(t));
      existing.themes.push(...newThemes);
      
      // Index new themes
      newThemes.forEach(theme => this.indexTheme(theme, jokeId));
      
      // Add context if provided
      if (context) {
        this.addContextSnippet(jokeId, context);
      }
      return;
    }

    // Create new joke entry
    this.jokes.set(jokeId, {
      id: jokeId,
      themes,
      callbackCount: 0,
      firstSeenAt: now,
      lastCallbackAt: now,
      contextSnippets: context ? [context] : []
    });

    // Index themes
    themes.forEach(theme => this.indexTheme(theme, jokeId));
  }

  /**
   * Record that a callback was used for a joke.
   * @param jokeId The joke that was referenced
   */
  public recordCallback(jokeId: string): void {
    const joke = this.jokes.get(jokeId);
    if (!joke) {
      console.warn(`[CallbackEngine] Attempted to record callback for unknown joke: ${jokeId}`);
      return;
    }

    joke.callbackCount++;
    joke.lastCallbackAt = Date.now();
  }

  /**
   * Get the current comedic value and status of a potential callback.
   * @param jokeId The joke to evaluate
   * @returns CallbackMetrics with value, status, and recommendation
   */
  public getCallbackMetrics(jokeId: string): CallbackMetrics | null {
    const joke = this.jokes.get(jokeId);
    if (!joke) return null;

    const value = calculateDecayCurve(joke.callbackCount);
    const status = getStatusFromCount(joke.callbackCount);
    
    // Recommend callbacks that are building, at peak, or just declining
    const recommended = status === 'building' || status === 'peak' || 
                       (status === 'declining' && Math.random() > 0.5);

    return {
      value,
      status,
      timesUsed: joke.callbackCount,
      recommended
    };
  }

  /**
   * Find all jokes related to a given theme.
   * @param theme Theme to search for
   * @returns Array of matching joke entries
   */
  public findByTheme(theme: string): JokeEntry[] {
    const jokeIds = this.themeIndex.get(theme);
    if (!jokeIds) return [];

    return Array.from(jokeIds)
      .map(id => this.jokes.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get the best callback recommendation for a given theme.
   * Returns the joke with highest current value that hasn't peaked yet.
   * @param theme Theme to find callbacks for
   * @returns Best joke entry or null
   */
  public getBestCallbackForTheme(theme: string): JokeEntry | null {
    const jokes = this.findByTheme(theme);
    if (jokes.length === 0) return null;

    // Sort by callback value, preferring building/peak jokes
    const scored = jokes.map(joke => ({
      joke,
      metrics: this.getCallbackMetrics(joke.id)!
    }));

    scored.sort((a, b) => {
      // Prioritize recommended jokes
      if (a.metrics.recommended && !b.metrics.recommended) return -1;
      if (!a.metrics.recommended && b.metrics.recommended) return 1;
      return b.metrics.value - a.metrics.value;
    });

    return scored[0]?.joke || null;
  }

  /**
   * Get all themes currently tracked.
   */
  public getAllThemes(): string[] {
    return Array.from(this.themeIndex.keys());
  }

  /**
   * Get statistics for a specific theme.
   */
  public getThemeStats(theme: string): ThemeStats | null {
    const jokes = this.findByTheme(theme);
    if (jokes.length === 0) return null;

    const totalCallbacks = jokes.reduce((sum, j) => sum + j.callbackCount, 0);
    
    // Find the joke with most callbacks (the "hottest" running gag)
    const hottest = jokes.reduce((max, j) => 
      j.callbackCount > max.callbackCount ? j : max
    );

    return {
      theme,
      jokeCount: jokes.length,
      totalCallbacks,
      hottestJokeId: hottest.callbackCount > 0 ? hottest.id : null
    };
  }

  /**
   * Get all jokes that are at peak callback value (3rd use).
   * These are prime callback opportunities.
   */
  public getPeakCallbacks(): JokeEntry[] {
    return Array.from(this.jokes.values())
      .filter(j => j.callbackCount === 2); // Will be 3rd when used
  }

  /**
   * Get all "dead" jokes (6+ callbacks) that should be retired.
   */
  public getDeadJokes(): JokeEntry[] {
    return Array.from(this.jokes.values())
      .filter(j => j.callbackCount >= 5);
  }

  /**
   * Get context snippets for a joke to help with callback writing.
   */
  public getContextSnippets(jokeId: string): string[] {
    return this.jokes.get(jokeId)?.contextSnippets || [];
  }

  /**
   * Clear all tracked jokes (use between episodes/scenes).
   */
  public clear(): void {
    this.jokes.clear();
    this.themeIndex.clear();
  }

  /**
   * Export current state for persistence.
   */
  public export(): Record<string, JokeEntry> {
    const result: Record<string, JokeEntry> = {};
    this.jokes.forEach((entry, id) => {
      result[id] = { ...entry };
    });
    return result;
  }

  /**
   * Import state from persistence.
   */
  public import(data: Record<string, JokeEntry>): void {
    this.clear();
    Object.entries(data).forEach(([id, entry]) => {
      this.jokes.set(id, entry);
      entry.themes.forEach(theme => this.indexTheme(theme, id));
    });
  }

  /**
   * Get a summary report of all running gags.
   */
  public getSummary(): string {
    const jokes = Array.from(this.jokes.values());
    if (jokes.length === 0) return 'No jokes tracked yet.';

    const lines: string[] = ['📊 Callback Engine Summary:'];
    
    const byStatus: Record<string, JokeEntry[]> = {
      fresh: [],
      building: [],
      peak: [],
      declining: [],
      dead: []
    };

    jokes.forEach(joke => {
      const status = getStatusFromCount(joke.callbackCount);
      byStatus[status].push(joke);
    });

    if (byStatus.peak.length > 0) {
      lines.push(`  🔥 Peak (ready for callback): ${byStatus.peak.map(j => j.id).join(', ')}`);
    }
    if (byStatus.building.length > 0) {
      lines.push(`  📈 Building: ${byStatus.building.map(j => j.id).join(', ')}`);
    }
    if (byStatus.declining.length > 0) {
      lines.push(`  📉 Declining: ${byStatus.declining.map(j => j.id).join(', ')}`);
    }
    if (byStatus.dead.length > 0) {
      lines.push(`  💀 Dead (retire these): ${byStatus.dead.map(j => j.id).join(', ')}`);
    }

    return lines.join('\n');
  }

  private indexTheme(theme: string, jokeId: string): void {
    const normalized = theme.toLowerCase().trim();
    if (!this.themeIndex.has(normalized)) {
      this.themeIndex.set(normalized, new Set());
    }
    this.themeIndex.get(normalized)!.add(jokeId);
  }

  private addContextSnippet(jokeId: string, snippet: string): void {
    const joke = this.jokes.get(jokeId);
    if (!joke) return;

    joke.contextSnippets.unshift(snippet);
    if (joke.contextSnippets.length > this.maxContextSnippets) {
      joke.contextSnippets.pop();
    }
  }
}

/**
 * Singleton instance for global callback tracking.
 */
let globalEngine: CallbackEngine | null = null;

export function getGlobalCallbackEngine(): CallbackEngine {
  if (!globalEngine) {
    globalEngine = new CallbackEngine();
  }
  return globalEngine;
}

export function resetGlobalCallbackEngine(): void {
  globalEngine = new CallbackEngine();
}
