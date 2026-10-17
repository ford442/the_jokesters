/**
 * Tiny GBNF interpreter for tests: parses the subset jsonSchemaToGbnf emits and checks whether
 * a whole string is accepted. Not a llama.cpp replacement — just enough to prove the grammar
 * is well-formed and admits / rejects the right JSON.
 */
type Node =
  | { kind: 'lit'; text: string }
  | { kind: 'class'; negate: boolean; ranges: Array<[number, number]> }
  | { kind: 'ref'; name: string }
  | { kind: 'seq'; items: Node[] }
  | { kind: 'alt'; options: Node[] }
  | { kind: 'rep'; node: Node; min: number; max: number }

function unescape(ch: string, src: string, i: number): [number, number] {
  // returns [codepoint, consumed]
  if (ch !== '\\') return [ch.codePointAt(0)!, 1]
  const next = src[i + 1]
  if (next === 'x') return [parseInt(src.slice(i + 2, i + 4), 16), 4]
  const map: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', ']': ']', '[': '[', '-': '-', '/': '/' }
  return [(map[next] ?? next).codePointAt(0)!, 2]
}

function parseBody(src: string): Node {
  let i = 0
  const ws = () => {
    while (i < src.length && /\s/.test(src[i])) i++
  }
  const parseAlt = (): Node => {
    const options = [parseSeq()]
    ws()
    while (src[i] === '|') {
      i++
      options.push(parseSeq())
      ws()
    }
    return options.length === 1 ? options[0] : { kind: 'alt', options }
  }
  const parseSeq = (): Node => {
    const items: Node[] = []
    for (;;) {
      ws()
      if (i >= src.length || src[i] === '|' || src[i] === ')') break
      items.push(parsePostfix())
    }
    return items.length === 1 ? items[0] : { kind: 'seq', items }
  }
  const parsePostfix = (): Node => {
    let node = parseAtom()
    for (;;) {
      const c = src[i]
      if (c === '*') { i++; node = { kind: 'rep', node, min: 0, max: Infinity } }
      else if (c === '+') { i++; node = { kind: 'rep', node, min: 1, max: Infinity } }
      else if (c === '?') { i++; node = { kind: 'rep', node, min: 0, max: 1 } }
      else if (c === '{') {
        const end = src.indexOf('}', i)
        const [a, b] = src.slice(i + 1, end).split(',')
        i = end + 1
        node = { kind: 'rep', node, min: Number(a), max: b === undefined ? Number(a) : b === '' ? Infinity : Number(b) }
      } else break
    }
    return node
  }
  const parseAtom = (): Node => {
    ws()
    const c = src[i]
    if (c === '(') {
      i++
      const inner = parseAlt()
      ws()
      if (src[i] !== ')') throw new Error(`expected ) at ${i}: ${src}`)
      i++
      return inner
    }
    if (c === '"') {
      i++
      let text = ''
      while (src[i] !== '"') {
        const [cp, used] = unescape(src[i], src, i)
        text += String.fromCodePoint(cp)
        i += used
      }
      i++
      return { kind: 'lit', text }
    }
    if (c === '[') {
      i++
      let negate = false
      if (src[i] === '^') { negate = true; i++ }
      const ranges: Array<[number, number]> = []
      while (src[i] !== ']') {
        const [lo, used] = unescape(src[i], src, i)
        i += used
        if (src[i] === '-' && src[i + 1] !== ']') {
          i++
          const [hi, used2] = unescape(src[i], src, i)
          i += used2
          ranges.push([lo, hi])
        } else ranges.push([lo, lo])
      }
      i++
      return { kind: 'class', negate, ranges }
    }
    const m = /^[a-zA-Z0-9-]+/.exec(src.slice(i))
    if (!m) throw new Error(`unexpected ${c} at ${i}: ${src}`)
    i += m[0].length
    return { kind: 'ref', name: m[0] }
  }
  const node = parseAlt()
  ws()
  if (i !== src.length) throw new Error(`trailing input at ${i}: ${src}`)
  return node
}

export function compileGbnf(grammar: string): (input: string) => boolean {
  const rules = new Map<string, Node>()
  for (const line of grammar.split('\n')) {
    if (!line.trim()) continue
    const idx = line.indexOf('::=')
    if (idx < 0) throw new Error(`bad rule line: ${line}`)
    rules.set(line.slice(0, idx).trim(), parseBody(line.slice(idx + 3).trim()))
  }
  for (const [, node] of rules) {
    const check = (n: Node): void => {
      if (n.kind === 'ref' && !rules.has(n.name)) throw new Error(`undefined rule ${n.name}`)
      if (n.kind === 'seq') n.items.forEach(check)
      if (n.kind === 'alt') n.options.forEach(check)
      if (n.kind === 'rep') check(n.node)
    }
    check(node)
  }
  if (!rules.has('root')) throw new Error('missing root rule')

  return (input: string) => {
    const memo = new Map<string, Set<number>>()
    const match = (n: Node, pos: number): Set<number> => {
      switch (n.kind) {
        case 'lit':
          return input.startsWith(n.text, pos) ? new Set([pos + n.text.length]) : new Set()
        case 'class': {
          if (pos >= input.length) return new Set()
          const cp = input.codePointAt(pos)!
          const hit = n.ranges.some(([lo, hi]) => cp >= lo && cp <= hi)
          return hit !== n.negate ? new Set([pos + String.fromCodePoint(cp).length]) : new Set()
        }
        case 'ref': {
          const key = `${n.name}@${pos}`
          const cached = memo.get(key)
          if (cached) return cached
          memo.set(key, new Set())
          const out = match(rules.get(n.name)!, pos)
          memo.set(key, out)
          return out
        }
        case 'seq': {
          let positions = new Set([pos])
          for (const item of n.items) {
            const next = new Set<number>()
            for (const p of positions) for (const q of match(item, p)) next.add(q)
            positions = next
            if (positions.size === 0) break
          }
          return positions
        }
        case 'alt': {
          const out = new Set<number>()
          for (const o of n.options) for (const q of match(o, pos)) out.add(q)
          return out
        }
        case 'rep': {
          const out = new Set<number>()
          let frontier = new Set([pos])
          if (n.min === 0) out.add(pos)
          for (let count = 1; count <= n.max && frontier.size > 0; count++) {
            const next = new Set<number>()
            for (const p of frontier) for (const q of match(n.node, p)) if (q !== p) next.add(q)
            if (count >= n.min) for (const q of next) out.add(q)
            frontier = next
            if (count > input.length + 1) break
          }
          return out
        }
      }
    }
    return match({ kind: 'ref', name: 'root' }, 0).has(input.length)
  }
}
