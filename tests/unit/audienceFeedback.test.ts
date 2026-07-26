import { describe, expect, it, vi } from 'vitest'
import {
  AudienceFeedbackDriver,
  DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS,
  mapScoreToAudienceFeedback,
  scoreTextToAudienceFeedback,
} from '../../src/comedy/audienceFeedback'

describe('mapScoreToAudienceFeedback (pure score → event mapping)', () => {
  it('maps a high score to a cheer with an applause/rimshot sfx', () => {
    const lowPick = () => 0.1 // < 0.5 → applause
    const highPick = () => 0.9 // >= 0.5 → rimshot

    expect(mapScoreToAudienceFeedback(9, undefined, lowPick)).toEqual({
      reaction: 'cheer',
      sfx: 'applause',
      score: 9,
    })
    expect(mapScoreToAudienceFeedback(10, undefined, highPick)).toEqual({
      reaction: 'cheer',
      sfx: 'rimshot',
      score: 10,
    })
  })

  it('treats the cheer threshold as inclusive', () => {
    const { cheerAt } = DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS
    expect(mapScoreToAudienceFeedback(cheerAt, undefined, () => 0).reaction).toBe('cheer')
  })

  it('maps a low score to a groan with a boo sfx', () => {
    const { groanBelow } = DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS
    expect(mapScoreToAudienceFeedback(groanBelow - 1)).toEqual({
      reaction: 'groan',
      sfx: 'boo',
      score: groanBelow - 1,
    })
  })

  it('treats the groan threshold as exclusive (score === groanBelow is not a groan)', () => {
    const { groanBelow } = DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS
    expect(mapScoreToAudienceFeedback(groanBelow, undefined, () => 1).reaction).toBe('neutral')
  })

  it('maps a mid-band score to neutral, with an occasional chuckle just below the cheer line', () => {
    const { cheerAt } = DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS
    const nearCheerScore = cheerAt - 1

    const chuckle = mapScoreToAudienceFeedback(nearCheerScore, undefined, () => 0.1) // < 0.35 → chuckle
    expect(chuckle).toEqual({ reaction: 'neutral', sfx: 'laugh', score: nearCheerScore })

    const quiet = mapScoreToAudienceFeedback(nearCheerScore, undefined, () => 0.9) // >= 0.35 → no sfx
    expect(quiet).toEqual({ reaction: 'neutral', sfx: null, score: nearCheerScore })
  })

  it('never adds a chuckle sfx for a merely-mid-band (not near-cheer) score', () => {
    const { cheerAt, groanBelow } = DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS
    const midScore = Math.floor((cheerAt + groanBelow) / 2)
    // Even with a pick() that would satisfy the 0.35 chuckle chance, a score too far
    // from the cheer threshold should never get a chuckle.
    expect(mapScoreToAudienceFeedback(midScore, undefined, () => 0)).toEqual({
      reaction: 'neutral',
      sfx: midScore >= cheerAt - 2 ? 'laugh' : null,
      score: midScore,
    })
  })

  it('respects custom thresholds', () => {
    const thresholds = { cheerAt: 5, groanBelow: 5 }
    expect(mapScoreToAudienceFeedback(5, thresholds, () => 1).reaction).toBe('cheer')
    expect(mapScoreToAudienceFeedback(4, thresholds).reaction).toBe('groan')
  })
})

describe('scoreTextToAudienceFeedback', () => {
  it('rates text via qualityFilter.rateJoke and maps the resulting score', () => {
    const event = scoreTextToAudienceFeedback('meh')
    expect(event.score).toBeGreaterThanOrEqual(1)
    expect(event.score).toBeLessThanOrEqual(10)
    expect(['cheer', 'neutral', 'groan']).toContain(event.reaction)
  })
})

describe('AudienceFeedbackDriver (rate-limited dispatch, Stage/SFX mocked)', () => {
  it('dispatches the first event to both sinks', () => {
    const triggerReaction = vi.fn()
    const playSfx = vi.fn()
    let now = 0
    const driver = new AudienceFeedbackDriver({ triggerReaction, playSfx }, 2000, () => now)

    const fired = driver.handleEvent({ reaction: 'cheer', sfx: 'applause', score: 9 })

    expect(fired).toBe(true)
    expect(triggerReaction).toHaveBeenCalledWith('cheer')
    expect(playSfx).toHaveBeenCalledWith('applause')
  })

  it('does not call playSfx when the event has no sfx, but still triggers the reaction', () => {
    const triggerReaction = vi.fn()
    const playSfx = vi.fn()
    let now = 0
    const driver = new AudienceFeedbackDriver({ triggerReaction, playSfx }, 2000, () => now)

    driver.handleEvent({ reaction: 'neutral', sfx: null, score: 6 })

    expect(triggerReaction).toHaveBeenCalledWith('neutral')
    expect(playSfx).not.toHaveBeenCalled()
  })

  it('rate-limits: a second event within minIntervalMs is dropped entirely (no stage/sfx calls)', () => {
    const triggerReaction = vi.fn()
    const playSfx = vi.fn()
    let now = 0
    const driver = new AudienceFeedbackDriver({ triggerReaction, playSfx }, 2000, () => now)

    expect(driver.handleEvent({ reaction: 'cheer', sfx: 'applause', score: 9 })).toBe(true)

    now = 500 // still within the 2000ms cooldown
    expect(driver.handleEvent({ reaction: 'groan', sfx: 'boo', score: 2 })).toBe(false)

    expect(triggerReaction).toHaveBeenCalledTimes(1)
    expect(playSfx).toHaveBeenCalledTimes(1)
  })

  it('fires again once minIntervalMs has elapsed', () => {
    const triggerReaction = vi.fn()
    const playSfx = vi.fn()
    let now = 0
    const driver = new AudienceFeedbackDriver({ triggerReaction, playSfx }, 2000, () => now)

    expect(driver.handleEvent({ reaction: 'cheer', sfx: 'applause', score: 9 })).toBe(true)

    now = 2000
    expect(driver.handleEvent({ reaction: 'groan', sfx: 'boo', score: 2 })).toBe(true)

    expect(triggerReaction).toHaveBeenNthCalledWith(2, 'groan')
    expect(playSfx).toHaveBeenNthCalledWith(2, 'boo')
  })

  it('handleSpokenText scores raw text and dispatches through the same rate limiter', () => {
    const triggerReaction = vi.fn()
    const playSfx = vi.fn()
    const driver = new AudienceFeedbackDriver({ triggerReaction, playSfx })

    const fired = driver.handleSpokenText('An absolutely mediocre observation about traffic.')
    expect(fired).toBe(true)
    expect(triggerReaction).toHaveBeenCalledTimes(1)
  })
})
