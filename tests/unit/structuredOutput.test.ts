import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  BeatOutlineSchema,
  DirectorDecisionSchema,
  nextSpeakerSchema,
  toEngineJsonSchema,
} from '../../src/llm/structured/schemas'
import { jsonSchemaToGbnf } from '../../src/llm/structured/jsonSchemaToGbnf'
import { extractJson } from '../../src/llm/structured/extractJson'
import {
  buildResponseFormat,
  completeStructured,
  parseStructured,
} from '../../src/llm/structured/completeStructured'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { toMlcResponseFormat } from '../../src/llm/MlcEngineAdapter'
import { LlamaCppEngineAdapter } from '../../src/llm/LlamaCppEngineAdapter'
import { compileGbnf } from './helpers/gbnfMatcher'

const nextSpeaker = nextSpeakerSchema(['comedian', 'philosopher', 'robot'])

const SCHEMAS = {
  director: {
    schema: DirectorDecisionSchema,
    valid: [
      { status: 'FLOWING', instruction: 'Whisper the next line.' },
      { status: 'STAGNANT', instruction: 'A meteor hits the stage!', memory: 'recall:hotdogs' },
      { status: 'FLOWING' },
    ],
    invalid: [{ status: 'BORED' }, { instruction: 'no status' }, { status: 'FLOWING', instruction: 3 }],
  },
  nextSpeaker: {
    schema: nextSpeaker,
    valid: [{ speaker: 'robot' }, { speaker: 'comedian', reason: 'callback' }],
    invalid: [{ speaker: 'scientist' }, {}],
  },
  beats: {
    schema: BeatOutlineSchema,
    valid: [{ beats: [{ speaker: 'comedian', line: 'Why the long face?' }] }],
    invalid: [{ beats: [] }, { beats: [{ speaker: 'comedian' }] }],
  },
} as const

describe('structured output schemas', () => {
  for (const [name, { schema, valid, invalid }] of Object.entries(SCHEMAS)) {
    it(`${name}: valid values round-trip through JSON and the schema`, () => {
      for (const value of valid) {
        const parsed = schema.safeParse(JSON.parse(JSON.stringify(value)))
        expect(parsed.success).toBe(true)
        expect(parsed.data).toEqual(value)
      }
    })

    it(`${name}: invalid values are rejected`, () => {
      for (const value of invalid) expect(schema.safeParse(value).success).toBe(false)
    })

    it(`${name}: GBNF grammar accepts valid JSON and rejects invalid JSON`, () => {
      const grammar = jsonSchemaToGbnf(toEngineJsonSchema(schema as z.ZodType))
      const accepts = compileGbnf(grammar)
      for (const value of valid) {
        expect(accepts(JSON.stringify(value)), JSON.stringify(value)).toBe(true)
        expect(accepts(JSON.stringify(value, null, 1)), 'pretty-printed').toBe(true)
      }
      for (const value of invalid) expect(accepts(JSON.stringify(value)), JSON.stringify(value)).toBe(false)
      expect(accepts('FLOWING: be weirder')).toBe(false)
    })
  }

  it('engine JSON schema has no $schema marker and keeps enums', () => {
    const json = toEngineJsonSchema(DirectorDecisionSchema)
    expect(json.$schema).toBeUndefined()
    expect(json).toMatchObject({
      type: 'object',
      required: ['status'],
      properties: { status: { enum: ['FLOWING', 'STAGNANT'] } },
    })
  })

  it('GBNF handles objects with only optional keys', () => {
    const accepts = compileGbnf(
      jsonSchemaToGbnf(toEngineJsonSchema(z.object({ a: z.string().optional(), b: z.boolean().optional() }))),
    )
    for (const ok of ['{}', '{"a":"x"}', '{"b":true}', '{"a":"x","b":false}']) expect(accepts(ok), ok).toBe(true)
    for (const bad of ['{"b":true,"a":"x"}', '{"a":"x",}', '{"c":1}']) expect(accepts(bad), bad).toBe(false)
  })
})

describe('tolerant JSON extraction', () => {
  it('extracts from fences, prose and trailing commas', () => {
    expect(extractJson('```json\n{"status":"FLOWING"}\n```')).toEqual({ status: 'FLOWING' })
    expect(extractJson('Sure! Here you go: {"status": "STAGNANT", "instruction": "Add a {twist}."} Hope that helps')).toEqual({
      status: 'STAGNANT',
      instruction: 'Add a {twist}.',
    })
    expect(extractJson('{"beats": [{"speaker": "robot", "line": "Beep."},],}')).toEqual({
      beats: [{ speaker: 'robot', line: 'Beep.' }],
    })
  })

  it('rejects malformed output', () => {
    expect(extractJson('STAGNANT: raise the stakes')).toBeUndefined()
    expect(extractJson('{"status": "FLOWING", "instruction": "cut off')).toBeUndefined()
    expect(parseStructured(DirectorDecisionSchema, 'FLOWING: keep going').ok).toBe(false)
    expect(parseStructured(DirectorDecisionSchema, '{"status":"meh"}').ok).toBe(false)
    expect(parseStructured(DirectorDecisionSchema, '{"status":"FLOWING"}').ok).toBe(true)
  })
})

describe('completeStructured', () => {
  async function mockEngine(...responses: string[]) {
    const engine = new MockLLMEngine()
    await engine.initialize({ id: 'mock', name: 'Mock', vram_required_MB: 0, context_window_size: 2048 })
    engine.queueResponses(...responses)
    return engine
  }

  it('retries once with the parse error when the first reply is invalid', async () => {
    const engine = await mockEngine('FLOWING: be weirder', '{"status": "FLOWING", "instruction": "Be weirder."}')
    const result = await completeStructured(engine, [{ role: 'user', content: 'judge' }], DirectorDecisionSchema)
    expect(result).toMatchObject({ ok: true, attempts: 2, constrained: false, data: { status: 'FLOWING' } })
    const retryMessages = engine.chatCalls[1].messages
    expect(retryMessages.at(-1)?.content).toContain('not valid')
    // Schema hint reaches the prompt for engines without grammar support.
    expect(String(engine.chatCalls[0].messages[0].content)).toContain('"STAGNANT"')
    expect(engine.chatCalls[0].options.response_format).toBeUndefined()
  })

  it('reports failure after the retry budget', async () => {
    const engine = await mockEngine('nope', 'still nope')
    const result = await completeStructured(engine, [{ role: 'user', content: 'judge' }], DirectorDecisionSchema)
    expect(result.ok).toBe(false)
    expect(result.attempts).toBe(2)
  })

  it('maps response_format to web-llm xgrammar options', () => {
    const format = buildResponseFormat(DirectorDecisionSchema)
    const mlc = toMlcResponseFormat(format).response_format!
    expect(mlc.type).toBe('json_object')
    expect(JSON.parse(mlc.schema!)).toEqual(toEngineJsonSchema(DirectorDecisionSchema))
    expect(toMlcResponseFormat({ type: 'grammar', grammar: 'root ::= "x"' }).response_format).toEqual({
      type: 'grammar',
      grammar: 'root ::= "x"',
    })
    expect(toMlcResponseFormat(undefined)).toEqual({})
  })

  it('passes GBNF to wllama sampling.grammar and reuses the KV cache', async () => {
    const adapter = new LlamaCppEngineAdapter() as unknown as {
      wllama: { createChatCompletion: ReturnType<typeof vi.fn> }
      initialized: boolean
      chatComplete: LlamaCppEngineAdapter['chatComplete']
    }
    adapter.wllama = { createChatCompletion: vi.fn().mockResolvedValue('{"status":"FLOWING"}') }
    adapter.initialized = true
    const format = buildResponseFormat(DirectorDecisionSchema)
    await adapter.chatComplete([{ role: 'user', content: 'judge' }], { response_format: format })
    const opts = adapter.wllama.createChatCompletion.mock.calls[0][1]
    expect(opts.sampling.grammar).toBe(format.type === 'json_schema' ? format.grammar : undefined)
    expect(opts.useCache).toBe(true)
  })
})
