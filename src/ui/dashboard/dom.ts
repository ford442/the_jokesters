/**
 * Tiny DOM builder for the dashboard. Children are appended as text nodes, so
 * remote strings (HF dataset paths, commit messages, delta ids) can never be
 * parsed as HTML. There is deliberately no `innerHTML` escape hatch.
 */
export type Child = Node | string | number | null | undefined | false

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { style?: Partial<CSSStyleDeclaration>; className?: string; type?: string } = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (props.style) Object.assign(el.style, props.style)
  if (props.className) el.className = props.className
  if (props.type) el.setAttribute('type', props.type)
  appendChildren(el, children)
  return el
}

/** Replace all children of `parent` (text-safe). */
export function setChildren(parent: Element, ...children: Child[]): void {
  parent.replaceChildren()
  appendChildren(parent, children)
}

/** Nodes are appended as-is; everything else becomes a text node via `append(string)`. */
function appendChildren(parent: Element, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue
    if (typeof child === 'object') parent.append(child)
    else parent.append(String(child))
  }
}

/** A one-line status message in `color`. */
export function note(text: string, color = '#888'): HTMLDivElement {
  return h('div', { style: { color } }, text)
}

export const CARD_STYLE: Partial<CSSStyleDeclaration> = {
  background: 'rgba(255,255,255,0.05)',
  padding: '10px',
  borderRadius: '4px',
}

export function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}
