import type { GroupChatManager } from '../GroupChatManager'
import type { AudioEngine, SynthesisOptions } from '../audio/AudioEngine'
import type { SpeechQueue } from '../audio/SpeechQueue'
import { estimateAvailableVRAM } from '../utils/dynamicContext'
import { stripSfxTokens } from '../audio/sfxTokens'
import { computePrerenderDepth, median, type PrerenderDepthBudget } from './adaptiveDepth'

export interface PrerenderedTurn {
  agentId: string
  agentName: string
  response: string
  sentences: string[]
  /** Epoch when this turn was generated — discard if generation invalidated */
  generation: number
  /** TTS promises keyed by sentence index (filled eagerly after LLM) */
  audioPromises: Promise<Float32Array | null>[]
}

export interface PrerenderMetricsSnapshot {
  queueDepth: number
  generation: number
  filling: boolean
  cancelled: boolean
  depth: PrerenderDepthBudget
  /** Median gap between turn starts (ms), when queue was used */
  medianInterTurnGapMs: number | null
  /** Median time from turn start to first audio enqueue (ms) */
  medianTtfaMs: number | null
  lastInterTurnGapMs: number | null
  lastTtfaMs: number | null
  lastSource: 'prerender' | 'live' | null
  samples: number
}

type TurnOptions = { maxTokens?: number; seed?: number; hiddenInstruction?: string }

/**
 * Coordinates LLM turn prerender + TTS sentence prep with cancel/epoch safety.
 *
 * Flow: fillInitial / refill → turns[] with audioPromises → takeTurn → play
 * Cancel bumps generation so in-flight work is dropped (no double history).
 */
export class PrerenderCoordinator {
  private turns: PrerenderedTurn[] = []
  private generation = 0
  private filling = false
  private cancelled = false
  private depth: PrerenderDepthBudget = computePrerenderDepth(4096)
  private refillPromise: Promise<void> | null = null

  private interTurnGaps: number[] = []
  private ttfaSamples: number[] = []
  private lastTurnEndAt: number | null = null
  private lastInterTurnGapMs: number | null = null
  private lastTtfaMs: number | null = null
  private lastSource: 'prerender' | 'live' | null = null

  private readonly maxMetricSamples = 40

  constructor(
    private readonly manager: GroupChatManager,
    private readonly audioEngine: AudioEngine,
    private readonly speechQueue: SpeechQueue,
  ) {}

  getDepth(): PrerenderDepthBudget {
    return this.depth
  }

  getQueueDepth(): number {
    return this.turns.length
  }

  isFilling(): boolean {
    return this.filling
  }

  /** Probe VRAM and set adaptive depth (call once per scene start). */
  async configureForDevice(): Promise<PrerenderDepthBudget> {
    let vram = 0
    try {
      vram = await estimateAvailableVRAM()
    } catch {
      vram = 0
    }
    this.depth = computePrerenderDepth(vram)
    console.log(`[Prerender] Adaptive depth: ${this.depth.reason}`)
    return this.depth
  }

  /**
   * Invalidate all queued turns + TTS cache. In-flight LLM/TTS results with
   * old generation ids are dropped when they complete.
   */
  cancel(reason = 'cancel'): void {
    this.generation++
    this.cancelled = true
    this.turns = []
    this.filling = false
    this.refillPromise = null
    this.speechQueue.clearPrerendered()
    console.log(`[Prerender] Cancelled (gen=${this.generation}): ${reason}`)
  }

  /** Soft reset for a new scene without discarding metrics history. */
  beginScene(): void {
    this.cancel('new scene')
    this.cancelled = false
    this.lastTurnEndAt = null
  }

  /**
   * Blocking initial fill at scene start. Returns how many turns are ready.
   * Graceful: returns 0 on failure / depth 0 (caller uses live generation).
   */
  async fillInitial(
    initialPrompt: string,
    options: TurnOptions = {},
  ): Promise<number> {
    if (this.depth.initialTurns <= 0) {
      console.log('[Prerender] Skipping initial fill (adaptive depth 0)')
      return 0
    }

    const gen = this.generation
    this.cancelled = false
    this.filling = true

    try {
      const raw = await this.manager.prerenderTurns(
        initialPrompt,
        this.depth.initialTurns,
        options,
      )
      if (gen !== this.generation || this.cancelled) {
        console.log('[Prerender] Initial fill discarded (stale generation)')
        return 0
      }

      const prepared = raw.map((t) => this.attachAudio(t, gen, options))
      this.turns.push(...prepared)
      // Kick TTS for first turn aggressively
      if (this.turns[0]) {
        void Promise.all(this.turns[0].audioPromises)
      }
      return this.turns.length
    } catch (e) {
      console.error('[Prerender] Initial fill failed — live fallback:', e)
      return 0
    } finally {
      if (gen === this.generation) this.filling = false
    }
  }

  /**
   * Non-blocking refill when queue is low. Safe to call every turn end.
   */
  refillInBackground(continuePrompt: string, options: TurnOptions = {}): void {
    if (this.depth.batchSize <= 0) return
    if (this.turns.length >= this.depth.minQueue && this.depth.minQueue > 0) return
    if (this.turns.length >= Math.max(this.depth.minQueue, 1) && this.depth.minQueue === 0) {
      // Already have something and no min — skip
      if (this.turns.length > 0) return
    }
    if (this.filling || this.refillPromise) return
    if (this.cancelled) return

    const gen = this.generation
    this.filling = true
    this.refillPromise = (async () => {
      try {
        const raw = await this.manager.prerenderTurns(
          continuePrompt,
          this.depth.batchSize,
          options,
        )
        if (gen !== this.generation || this.cancelled) {
          console.log('[Prerender] Background refill discarded (stale)')
          return
        }
        const prepared = raw.map((t) => this.attachAudio(t, gen, options))
        this.turns.push(...prepared)
        console.log(
          `[Prerender] Refilled +${prepared.length} (queue=${this.turns.length})`,
        )
      } catch (e) {
        console.error('[Prerender] Background refill failed:', e)
      } finally {
        if (gen === this.generation) this.filling = false
        this.refillPromise = null
      }
    })()
  }

  /**
   * Pop next ready turn, or null → caller should live-generate.
   * Filters stale generation ids.
   */
  takeTurn(): PrerenderedTurn | null {
    while (this.turns.length > 0) {
      const t = this.turns.shift()!
      if (t.generation === this.generation && !this.cancelled) {
        this.lastSource = 'prerender'
        return t
      }
    }
    this.lastSource = null
    return null
  }

  /** Mark that live generation was used (metrics). */
  markLiveSource(): void {
    this.lastSource = 'live'
  }

  /** Call when a turn's first audio is enqueued. */
  recordTtfa(startedAt: number): void {
    const ms = performance.now() - startedAt
    this.lastTtfaMs = ms
    this.ttfaSamples.push(ms)
    if (this.ttfaSamples.length > this.maxMetricSamples) this.ttfaSamples.shift()
  }

  /**
   * Call at the start of each turn after the previous finished.
   * Records gap from previous turn end → this start.
   */
  markTurnStart(): number {
    const now = performance.now()
    if (this.lastTurnEndAt != null) {
      const gap = now - this.lastTurnEndAt
      this.lastInterTurnGapMs = gap
      this.interTurnGaps.push(gap)
      if (this.interTurnGaps.length > this.maxMetricSamples) this.interTurnGaps.shift()
    }
    return now
  }

  markTurnEnd(): void {
    this.lastTurnEndAt = performance.now()
  }

  getMetrics(): PrerenderMetricsSnapshot {
    return {
      queueDepth: this.turns.length,
      generation: this.generation,
      filling: this.filling,
      cancelled: this.cancelled,
      depth: this.depth,
      medianInterTurnGapMs: median(this.interTurnGaps),
      medianTtfaMs: median(this.ttfaSamples),
      lastInterTurnGapMs: this.lastInterTurnGapMs,
      lastTtfaMs: this.lastTtfaMs,
      lastSource: this.lastSource,
      samples: this.interTurnGaps.length,
    }
  }

  /**
   * Resolve audio for a sentence: use turn's prerender promise if present,
   * else SpeechQueue keyed cache / live synth.
   */
  async resolveSentenceAudio(
    turn: PrerenderedTurn | null,
    sentenceIndex: number,
    text: string,
    agentId: string,
    options: SynthesisOptions,
  ): Promise<Float32Array | null> {
    const clean = stripSfxTokens(text).trim()
    if (!clean) return null

    if (turn && turn.generation === this.generation && sentenceIndex < turn.audioPromises.length) {
      try {
        const buf = await turn.audioPromises[sentenceIndex]
        if (buf) return buf
      } catch {
        /* fall through to live */
      }
    }

    return this.speechQueue.synthesizeOrTakeCached(clean, agentId, options)
  }

  private attachAudio(
    t: { agentId: string; agentName: string; response: string; sentences: string[] },
    gen: number,
    options: TurnOptions,
  ): PrerenderedTurn {
    const synthOpts: SynthesisOptions = {
      steps: 16,
      seed: options.seed,
      speed: 1.0,
    }
    const sentences = t.sentences.length > 0 ? t.sentences : [t.response].filter(Boolean)
    const limited = sentences.slice(0, Math.max(1, this.depth.maxSentences))
    // Also queue remainder as live-on-demand but still list full sentences for display
    const audioPromises = sentences.map((s, i) => {
      if (i >= limited.length) {
        return Promise.resolve(null) // synthesize at play time
      }
      const clean = stripSfxTokens(s).trim()
      if (!clean) return Promise.resolve(null)
      return this.speechQueue.prerenderOne(clean, t.agentId, synthOpts)
    })

    return {
      agentId: t.agentId,
      agentName: t.agentName,
      response: t.response,
      sentences,
      generation: gen,
      audioPromises,
    }
  }
}
