/**
 * Minimal DOM double for node-environment tests (no jsdom in this repo). Supports
 * what the dashboard uses: getElementById, createElement, append/replaceChildren
 * with text nodes, textContent, attributes, style, closest('#id'), and
 * addEventListener with `{ signal }`. Any `innerHTML` write is recorded so tests
 * can assert remote data never goes through the HTML parser.
 */

type Listener = (event: FakeEvent) => void

export interface FakeEvent {
  type: string
  target: FakeElement | null
}

class FakeEventTarget {
  private listeners = new Map<string, Set<Listener>>()

  addEventListener(type: string, fn: Listener, opts?: { signal?: AbortSignal } | boolean): void {
    const signal = typeof opts === 'object' ? opts.signal : undefined
    if (signal?.aborted) return
    let set = this.listeners.get(type)
    if (!set) this.listeners.set(type, (set = new Set()))
    set.add(fn)
    signal?.addEventListener('abort', () => set!.delete(fn), { once: true })
  }

  removeEventListener(type: string, fn: Listener): void {
    this.listeners.get(type)?.delete(fn)
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0
  }

  protected fire(event: FakeEvent): void {
    for (const fn of [...(this.listeners.get(event.type) ?? [])]) fn(event)
  }
}

export class FakeText {
  constructor(public data: string) {}
  get textContent(): string {
    return this.data
  }
}

export class FakeElement extends FakeEventTarget {
  id = ''
  className = ''
  disabled = false
  value = ''
  style: Record<string, string> = {}
  parent: FakeElement | null = null
  children: Array<FakeElement | FakeText> = []
  private attrs = new Map<string, string>()

  constructor(public tagName: string, private doc: FakeDocument) {
    super()
  }

  set innerHTML(html: string) {
    this.doc.innerHTMLWrites.push(html)
    this.children = html ? [new FakeText(html)] : []
  }
  get innerHTML(): string {
    return this.textContent
  }

  get textContent(): string {
    return this.children.map((c) => c.textContent).join('')
  }
  set textContent(text: string) {
    this.children = text ? [new FakeText(text)] : []
  }

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value)
    if (name === 'id') this.id = value
  }
  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null
  }

  append(...nodes: Array<FakeElement | FakeText | string>): void {
    for (const n of nodes) {
      const node = typeof n === 'string' ? new FakeText(n) : n
      if (node instanceof FakeElement) node.parent = this
      this.children.push(node)
    }
  }
  appendChild(node: FakeElement): FakeElement {
    this.append(node)
    return node
  }
  replaceChildren(...nodes: Array<FakeElement | FakeText | string>): void {
    this.children = []
    this.append(...nodes)
  }

  closest(selector: string): FakeElement | null {
    if (!selector.startsWith('#')) throw new Error(`fakeDom: unsupported selector ${selector}`)
    const id = selector.slice(1)
    for (let el: FakeElement | null = this; el; el = el.parent) if (el.id === id) return el
    return null
  }

  /** All descendant elements (depth-first). */
  descendants(): FakeElement[] {
    const out: FakeElement[] = []
    for (const c of this.children) {
      if (c instanceof FakeElement) out.push(c, ...c.descendants())
    }
    return out
  }

  /** Dispatch a click here and bubble it to ancestors and the document. */
  click(): void {
    const event: FakeEvent = { type: 'click', target: this }
    for (let el: FakeElement | null = this; el; el = el.parent) el.fire(event)
    this.doc.dispatch(event)
  }
}

export class FakeDocument extends FakeEventTarget {
  innerHTMLWrites: string[] = []
  private byId = new Map<string, FakeElement>()

  createElement(tag: string): FakeElement {
    return new FakeElement(tag, this)
  }

  /** Create and register an element by id (stands in for markup in index.html / the app template). */
  add(id: string, tag = 'div'): FakeElement {
    const el = this.createElement(tag)
    el.id = id
    this.byId.set(id, el)
    return el
  }

  getElementById(id: string): FakeElement | null {
    return this.byId.get(id) ?? null
  }

  dispatch(event: FakeEvent): void {
    this.fire(event)
  }
}

/** Installs a fresh FakeDocument as `globalThis.document`. Returns it and an uninstall function. */
export function installFakeDom(): { doc: FakeDocument; uninstall: () => void } {
  const g = globalThis as unknown as { document?: unknown }
  const prev = g.document
  const doc = new FakeDocument()
  g.document = doc
  return {
    doc,
    uninstall: () => {
      if (prev === undefined) delete g.document
      else g.document = prev
    },
  }
}
