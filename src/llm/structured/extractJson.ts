/**
 * Tolerant JSON extraction for engines without grammar support (Transformers.js, API, mocks).
 *
 * Strips code fences and surrounding chatter, takes the first balanced `{…}` / `[…]`
 * (string-aware), and forgives trailing commas. Returns `undefined` when nothing parses.
 */
export function extractJson(text: string): unknown {
  if (!text) return undefined
  const unfenced = text.replace(/```(?:json)?/gi, '')

  for (let start = 0; start < unfenced.length; start++) {
    const ch = unfenced[start]
    if (ch !== '{' && ch !== '[') continue
    const end = findBalancedEnd(unfenced, start)
    if (end < 0) continue
    const candidate = unfenced.slice(start, end + 1)
    const parsed = tryParse(candidate) ?? tryParse(candidate.replace(/,\s*([}\]])/g, '$1'))
    if (parsed !== undefined) return parsed
  }
  return undefined
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function findBalancedEnd(text: string, start: number): number {
  const stack: string[] = []
  let inString = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') {
      if (stack.pop() !== ch) return -1
      if (stack.length === 0) return i
    }
  }
  return -1
}
