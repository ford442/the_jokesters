import { afterEach, describe, expect, it, vi } from 'vitest'
import { Scope } from '../../src/utils/lifecycle'

describe('Scope', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('removes listeners registered through listen() on dispose', async () => {
    const target = new EventTarget()
    const scope = new Scope()
    const fn = vi.fn()
    scope.listen(target, 'ping', fn)

    target.dispatchEvent(new Event('ping'))
    expect(fn).toHaveBeenCalledTimes(1)

    await scope.dispose()
    target.dispatchEvent(new Event('ping'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('clears intervals and timeouts on dispose', async () => {
    vi.useFakeTimers()
    const scope = new Scope()
    const tick = vi.fn()
    const once = vi.fn()
    scope.interval(tick, 100)
    scope.timeout(once, 250)

    vi.advanceTimersByTime(200)
    expect(tick).toHaveBeenCalledTimes(2)

    await scope.dispose()
    vi.advanceTimersByTime(1000)
    expect(tick).toHaveBeenCalledTimes(2)
    expect(once).not.toHaveBeenCalled()
  })

  it('stops a raf() loop on dispose', async () => {
    const queue: Array<(t: number) => void> = []
    let nextId = 1
    const cancelled = new Set<number>()
    const ids = new Map<number, (t: number) => void>()
    vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
      const id = nextId++
      ids.set(id, cb)
      queue.push(cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      cancelled.add(id)
      const cb = ids.get(id)
      const i = cb ? queue.indexOf(cb) : -1
      if (i >= 0) queue.splice(i, 1)
    })
    const flushFrame = () => queue.splice(0).forEach((cb) => cb(0))

    const scope = new Scope()
    const frame = vi.fn()
    scope.raf(frame)
    flushFrame()
    flushFrame()
    expect(frame).toHaveBeenCalledTimes(2)

    await scope.dispose()
    flushFrame()
    expect(frame).toHaveBeenCalledTimes(2)
    expect(queue).toHaveLength(0)
  })

  it('runs disposers LIFO, disposes children, is idempotent and survives a throwing disposer', async () => {
    const order: string[] = []
    const scope = new Scope()
    scope.add(() => { order.push('first') })
    const child = scope.child()
    child.add(() => { order.push('child') })
    scope.add(() => { throw new Error('boom') })
    scope.add(async () => { order.push('last') })

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await Promise.all([scope.dispose(), scope.dispose()])
    await scope.dispose()

    expect(order).toEqual(['last', 'child', 'first'])
    expect(child.disposed).toBe(true)
    expect(scope.signal.aborted).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('runs a disposer added after dispose immediately, and ignores new listeners/timers', async () => {
    vi.useFakeTimers()
    const scope = new Scope()
    await scope.dispose()
    const late = vi.fn()
    scope.add(late)
    await Promise.resolve()
    await Promise.resolve()
    expect(late).toHaveBeenCalledTimes(1)

    const tick = vi.fn()
    scope.interval(tick, 10)
    vi.advanceTimersByTime(100)
    expect(tick).not.toHaveBeenCalled()
  })
})

describe('Scope.dispose timing', () => {
  it('clears every timer synchronously, before dispose() returns', () => {
    vi.useFakeTimers()
    const scope = new Scope()
    const a = vi.fn()
    const b = vi.fn()
    scope.interval(a, 10)
    scope.interval(b, 10)
    void scope.dispose()
    vi.advanceTimersByTime(100)
    expect(a).not.toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
