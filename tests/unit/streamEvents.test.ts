import { describe, expect, it } from 'vitest'
import {
  getStreamContent,
  isSentenceBoundaryEvent,
  type ChatStreamEvent,
} from '../../src/llm/streamEvents'

describe('streamEvents', () => {
  it('extracts string content from plain string events', () => {
    expect(getStreamContent('hello')).toBe('hello')
  })

  it('extracts content from chunk objects', () => {
    const event: ChatStreamEvent = { content: 'punchline.', sentenceBoundary: true }
    expect(getStreamContent(event)).toBe('punchline.')
    expect(isSentenceBoundaryEvent(event)).toBe(true)
  })

  it('treats chunks without sentenceBoundary as non-boundary', () => {
    const event: ChatStreamEvent = { content: 'partial' }
    expect(isSentenceBoundaryEvent(event)).toBe(false)
  })
})
