/**
 * Lifecycle ownership for long-lived app resources.
 *
 * A `Scope` owns listeners, timers, animation frames and arbitrary disposers.
 * `dispose()` releases everything in LIFO order (children first), and is
 * idempotent. Pass child scopes down to services so a whole subtree — e.g. one
 * `initApp()` attempt — can be torn down before a retry or re-init.
 *
 * Prefer `scope.listen` / `scope.interval` / `scope.raf` over bare
 * `addEventListener` / `setInterval` / `requestAnimationFrame` in app code;
 * ESLint enforces this in `src/app`, `src/visuals` and `src/Director`.
 * Lives in `utils/` (no dependencies) so Director and Stage can use it without importing `app/`.
 */

export type Disposer = () => void | Promise<void>

export class Scope {
  private readonly controller = new AbortController()
  private disposers: Disposer[] = []
  private disposing: Promise<void> | null = null

  /** Aborted when the scope is disposed. Pass to fetch()/addEventListener()/your own loops. */
  get signal(): AbortSignal {
    return this.controller.signal
  }

  get disposed(): boolean {
    return this.controller.signal.aborted
  }

  /** Registers a disposer. If the scope is already disposed, the disposer runs immediately. */
  add(disposer: Disposer): void {
    if (this.disposed) {
      void Promise.resolve()
        .then(disposer)
        .catch((err: unknown) => console.warn('[Scope] late disposer failed:', err))
      return
    }
    this.disposers.push(disposer)
  }

  /** `addEventListener` bound to this scope's signal (removed automatically on dispose). */
  listen<E = Event>(
    target: EventTarget,
    type: string,
    fn: (event: E) => void,
    opts: AddEventListenerOptions = {},
  ): void {
    if (this.disposed) return
    const signal = opts.signal ? AbortSignal.any([opts.signal, this.signal]) : this.signal
    target.addEventListener(type, fn as unknown as EventListener, { ...opts, signal })
  }

  interval(fn: () => void, ms: number): number {
    if (this.disposed) return 0
    const id = setInterval(fn, ms) as unknown as number
    this.add(() => clearInterval(id))
    return id
  }

  timeout(fn: () => void, ms: number): number {
    if (this.disposed) return 0
    const id = setTimeout(fn, ms) as unknown as number
    this.add(() => clearTimeout(id))
    return id
  }

  /**
   * Runs `fn` every animation frame until the scope is disposed. Unlike a bare
   * `requestAnimationFrame` recursion, the loop can actually be stopped.
   */
  raf(fn: (time: number) => void): void {
    if (this.disposed) return
    let handle = 0
    const tick = (time: number) => {
      if (this.disposed) return
      handle = requestAnimationFrame(tick)
      fn(time)
    }
    handle = requestAnimationFrame(tick)
    this.add(() => cancelAnimationFrame(handle))
  }

  /** A scope that is disposed together with (and before the rest of) this one. */
  child(): Scope {
    const child = new Scope()
    if (this.disposed) {
      void child.dispose()
      return child
    }
    this.add(() => child.dispose())
    return child
  }

  /**
   * Aborts the signal, then runs disposers last-in-first-out. Leading
   * synchronous disposers complete before this returns. A throwing
   * disposer is logged and does not stop the rest. Safe to call repeatedly;
   * concurrent callers share one teardown.
   */
  dispose(): Promise<void> {
    if (this.disposing) return this.disposing
    this.controller.abort()
    const disposers = this.disposers
    this.disposers = []
    this.disposing = (async () => {
      for (let i = disposers.length - 1; i >= 0; i--) {
        try {
          // Synchronous disposers run synchronously (timers are cleared before
          // dispose() returns); only promise-returning ones are awaited.
          const result = disposers[i]()
          if (result && typeof (result as Promise<void>).then === 'function') await result
        } catch (err) {
          console.warn('[Scope] disposer failed:', err)
        }
      }
    })()
    return this.disposing
  }
}
