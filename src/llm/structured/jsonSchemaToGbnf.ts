/**
 * Minimal JSON Schema → GBNF converter for wllama `sampling.grammar` (#400 C).
 *
 * Covers the subset `z.toJSONSchema` emits for our output schemas: objects (properties in
 * declaration order, required + optional), strings (incl. `enum` / `const`), integers, numbers,
 * booleans, null, arrays (`items`, `minItems`, small `maxItems`) and `anyOf` / `oneOf`.
 * The grammar is also valid xgrammar EBNF, so MLC can take it via `type: 'grammar'`.
 */

type JsonSchema = {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  minItems?: number
  maxItems?: number
  enum?: unknown[]
  const?: unknown
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
}

const PRIMITIVES: Record<string, string> = {
  ws: '[ \\t\\n]{0,4}',
  string: '"\\"" char* "\\"" ws',
  char: '[^"\\\\\\x7F\\x00-\\x1F] | "\\\\" (["\\\\/bfnrt] | "u" hex hex hex hex)',
  hex: '[0-9a-fA-F]',
  integer: '"-"? ([0-9] | [1-9] [0-9]{0,15}) ws',
  number: '"-"? ([0-9] | [1-9] [0-9]{0,15}) ("." [0-9]{1,16})? ([eE] [-+]? [0-9]{1,3})? ws',
  boolean: '("true" | "false") ws',
  null: '"null" ws',
}

/** Cap for unrolling `maxItems`; larger bounds fall back to an unbounded tail. */
const MAX_UNROLL = 24

function literal(value: unknown): string {
  // GBNF string literal of the JSON encoding of `value`.
  return JSON.stringify(JSON.stringify(value))
}

export function jsonSchemaToGbnf(schema: Record<string, unknown>): string {
  const rules = new Map<string, string>()
  const used = new Set<string>()
  let counter = 0

  const prim = (name: string): string => {
    used.add(name)
    if (name === 'string') used.add('char').add('hex')
    return name
  }

  const addRule = (hint: string, body: string): string => {
    const name = `${hint.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() || 'r'}-${counter++}`
    rules.set(name, body)
    return name
  }

  const visit = (node: JsonSchema, hint: string): string => {
    if (node.const !== undefined) {
      prim('ws')
      return addRule(hint, `${literal(node.const)} ws`)
    }
    if (node.enum) {
      prim('ws')
      return addRule(hint, `(${node.enum.map(literal).join(' | ')}) ws`)
    }
    const alts = node.anyOf ?? node.oneOf
    if (alts) {
      return addRule(hint, alts.map((a, i) => visit(a, `${hint}-${i}`)).join(' | '))
    }
    const type = Array.isArray(node.type) ? node.type : node.type ? [node.type] : []
    if (type.length > 1) {
      return addRule(hint, type.map((t, i) => visit({ ...node, type: t }, `${hint}-${i}`)).join(' | '))
    }

    switch (type[0]) {
      case 'string':
        prim('ws')
        return prim('string')
      case 'integer':
        prim('ws')
        return prim('integer')
      case 'number':
        prim('ws')
        return prim('number')
      case 'boolean':
        prim('ws')
        return prim('boolean')
      case 'null':
        prim('ws')
        return prim('null')
      case 'array':
        return visitArray(node, hint)
      case 'object':
      case undefined:
        if (node.properties || type[0] === 'object') return visitObject(node, hint)
        throw new Error(`jsonSchemaToGbnf: unsupported schema node ${JSON.stringify(node)}`)
      default:
        throw new Error(`jsonSchemaToGbnf: unsupported type ${type[0]}`)
    }
  }

  const visitArray = (node: JsonSchema, hint: string): string => {
    prim('ws')
    const item = node.items ? visit(node.items, `${hint}-item`) : prim('string')
    const min = Math.max(0, node.minItems ?? 0)
    const max = node.maxItems
    const sep = `"," ws ${item}`
    let body: string
    if (min === 0) {
      const rest =
        max !== undefined && max <= MAX_UNROLL ? `(${sep}){0,${Math.max(0, max - 1)}}` : `(${sep})*`
      body = `"[" ws (${item} ${rest})? "]" ws`
    } else {
      const head = [item, ...Array.from({ length: min - 1 }, () => `"," ws ${item}`)].join(' ')
      const tail =
        max !== undefined && max <= MAX_UNROLL ? (max > min ? ` (${sep}){0,${max - min}}` : '') : ` (${sep})*`
      body = `"[" ws ${head}${tail} "]" ws`
    }
    return addRule(hint, body)
  }

  const visitObject = (node: JsonSchema, hint: string): string => {
    prim('ws')
    const props = Object.entries(node.properties ?? {})
    const required = new Set(node.required ?? [])
    const kv = (key: string, value: JsonSchema) =>
      `${literal(key)} ws ":" ws ${visit(value, `${hint}-${key}`)}`

    const req = props.filter(([k]) => required.has(k))
    const opt = props.filter(([k]) => !required.has(k))

    let inner: string
    if (req.length > 0) {
      inner = req.map(([k, v]) => kv(k, v)).join(' "," ws ')
      for (const [k, v] of opt) inner += ` ("," ws ${kv(k, v)})?`
    } else if (opt.length > 0) {
      // No required key: any ordered, non-empty subset of the optional keys (or none).
      const kvs = opt.map(([k, v]) => kv(k, v))
      const chains = kvs.map((first, i) =>
        [first, ...kvs.slice(i + 1).map((later) => `("," ws ${later})?`)].join(' '),
      )
      inner = `(${chains.map((c) => `(${c})`).join(' | ')})?`
    } else {
      inner = ''
    }
    return addRule(hint, `"{" ws ${inner} "}" ws`)
  }

  const rootBody = visit(schema as JsonSchema, 'root')
  const lines = [`root ::= ${rules.has(rootBody) ? rules.get(rootBody)! : rootBody}`]
  for (const [name, body] of rules) {
    if (name === rootBody) continue
    lines.push(`${name} ::= ${body}`)
  }
  for (const name of Object.keys(PRIMITIVES)) {
    if (used.has(name)) lines.push(`${name} ::= ${PRIMITIVES[name]}`)
  }
  return lines.join('\n') + '\n'
}
