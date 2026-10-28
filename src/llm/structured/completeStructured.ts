/**
 * Schema-constrained completion across engines (#400 C).
 *
 * - MLC / llama.cpp: grammar-constrained decoding via `response_format` (adapters map it to
 *   xgrammar JSON schema / GBNF). Output is still validated with `safeParse`.
 * - Other engines: schema hint in the prompt, tolerant extraction, `safeParse`, one retry.
 */
import type { z } from 'zod'
import type { ChatMessage, GenerationOptions, LLMEngine, StructuredResponseFormat } from '../LLMEngine'
import { getStreamContent } from '../streamEvents'
import { extractJson } from './extractJson'
import { jsonSchemaToGbnf } from './jsonSchemaToGbnf'
import { toEngineJsonSchema } from './schemas'

export type StructuredResult<T> =
  | { ok: true; data: T; raw: string; attempts: number; constrained: boolean }
  | { ok: false; error: string; raw: string; attempts: number; constrained: boolean }

/** Engines whose adapters honour `response_format` with constrained decoding. */
export function supportsConstrainedDecoding(engine: LLMEngine): boolean {
  const type = engine.getEngineType()
  return type === 'mlc' || type === 'llamacpp'
}

const formatCache = new WeakMap<z.ZodType, StructuredResponseFormat>()

/** JSON schema + equivalent GBNF for one zod schema (memoised per schema object). */
export function buildResponseFormat(schema: z.ZodType): StructuredResponseFormat {
  let format = formatCache.get(schema)
  if (!format) {
    const json = toEngineJsonSchema(schema)
    format = { type: 'json_schema', schema: json, grammar: jsonSchemaToGbnf(json) }
    formatCache.set(schema, format)
  }
  return format
}

/** Parse raw model text against `schema` (tolerant extraction first). */
export function parseStructured<T>(schema: z.ZodType<T>, raw: string): { ok: true; data: T } | { ok: false; error: string } {
  const value = extractJson(raw)
  if (value === undefined) return { ok: false, error: 'no JSON found in model output' }
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') }
  }
  return { ok: true, data: parsed.data }
}

function withSchemaHint(messages: ChatMessage[], format: StructuredResponseFormat): ChatMessage[] {
  if (format.type !== 'json_schema') return messages
  const hint = `Respond with a single JSON object only (no prose, no code fences) matching this JSON Schema:\n${JSON.stringify(format.schema)}`
  const [first, ...rest] = messages
  if (first?.role === 'system' && typeof first.content === 'string') {
    return [{ role: 'system', content: `${first.content}\n\n${hint}` }, ...rest]
  }
  return [{ role: 'system', content: hint }, ...messages]
}

async function collect(engine: LLMEngine, messages: ChatMessage[], options: GenerationOptions): Promise<string> {
  let text = ''
  for await (const event of engine.chat(messages, options)) {
    text += getStreamContent(event)
  }
  return text.trim()
}

export async function completeStructured<T>(
  engine: LLMEngine,
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  options: GenerationOptions & { retries?: number } = {},
): Promise<StructuredResult<T>> {
  const { retries = 1, ...genOpts } = options
  const format = buildResponseFormat(schema)
  const constrained = supportsConstrainedDecoding(engine)
  const prompt = withSchemaHint(messages, format)

  let raw = ''
  let error = ''
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const attemptMessages =
      attempt === 1
        ? prompt
        : [
            ...prompt,
            { role: 'assistant' as const, content: raw || '(empty)' },
            { role: 'user' as const, content: `That was not valid (${error}). Reply again with the JSON object only.` },
          ]
    try {
      raw = await collect(engine, attemptMessages, {
        ...genOpts,
        ...(constrained ? { response_format: format } : {}),
      })
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      continue
    }
    const parsed = parseStructured(schema, raw)
    if (parsed.ok) return { ok: true, data: parsed.data, raw, attempts: attempt, constrained }
    error = parsed.error
  }
  return { ok: false, error, raw, attempts: retries + 1, constrained }
}
