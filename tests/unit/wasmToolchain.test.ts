import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { VPS_FP32_MODELS, WASM_LIBS } from '../../src/config/models'
import { MLC_WEB_LLM_LIB_VERSION } from '../../src/config/loadFailover'

const root = path.resolve(__dirname, '../..')
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')

function parseEnv(text: string): Record<string, string> {
  return Object.fromEntries(
    text
      .split('\n')
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => l.split('=') as [string, string]),
  )
}

const toolchain = parseEnv(read('scripts/wasm-toolchain.env'))
const presets = JSON.parse(read('scripts/wasm-presets.json')) as {
  model_prefix: string
  presets: Record<string, { context_window_size: number; prefill_chunk_size: number }>
}
const notebook = JSON.parse(read('public/Jokesters_WebLLM_Compile.ipynb')) as {
  cells: Array<{ source: string[] }>
}
const notebookSource = notebook.cells.map((c) => c.source.join('')).join('\n')

describe('wasm toolchain pins', () => {
  it('target the pinned web-llm release and its model_lib ABI', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies['@mlc-ai/web-llm']).toBe(toolchain.WEB_LLM_VERSION)
    expect(toolchain.MLC_LIB_ABI).toBe(MLC_WEB_LLM_LIB_VERSION)
    expect(toolchain.MLC_LIB_ABI).toBe(`v${toolchain.WEB_LLM_VERSION.replace(/\./g, '_')}`)
  })

  it('are mirrored in the Colab notebook', () => {
    const expectPin = (name: string, value: string) =>
      expect(notebookSource).toContain(`${name} = "${value}"`)
    expectPin('WEB_LLM_VERSION', toolchain.WEB_LLM_VERSION)
    expectPin('EMSDK_VERSION', toolchain.EMSDK_VERSION)
    expectPin('MLC_LLM_COMMIT', toolchain.MLC_LLM_COMMIT)
    expectPin('MLC_AI_NIGHTLY_VERSION', toolchain.MLC_AI_NIGHTLY_VERSION)
    expectPin('MLC_LLM_NIGHTLY_VERSION', toolchain.MLC_LLM_NIGHTLY_VERSION)
    expectPin('MLC_WHEEL_FLAVOR', toolchain.MLC_WHEEL_FLAVOR)
  })

  it('are real pins: a full commit sha and exact versions, never tot/latest', () => {
    expect(toolchain.MLC_LLM_COMMIT).toMatch(/^[0-9a-f]{40}$/)
    expect(toolchain.EMSDK_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    expect(toolchain.MLC_AI_NIGHTLY_VERSION).toMatch(/^\d+\.\d+\.dev\d+$/)
    expect(toolchain.MLC_LLM_NIGHTLY_VERSION).toMatch(/^\d+\.\d+\.dev\d+$/)
  })
})

describe('custom Vicuna parameter sets', () => {
  const cases = [
    { ctx: '512', model: VPS_FP32_MODELS.VPS_VICUNA_7B_CTX512, lib: WASM_LIBS.VICUNA_7B_CTX512 },
    { ctx: '1024', model: VPS_FP32_MODELS.VPS_VICUNA_7B_CTX1024, lib: WASM_LIBS.VICUNA_7B_CTX1024 },
  ]

  for (const { ctx, model, lib } of cases) {
    it(`ctx${ctx}: models.ts overrides and file name match scripts/wasm-presets.json`, () => {
      const preset = presets.presets[ctx]
      expect(model.overrides.context_window_size).toBe(preset.context_window_size)
      expect(model.overrides.prefill_chunk_size).toBe(preset.prefill_chunk_size)
      expect(lib.endsWith(
        `/${presets.model_prefix}-q4f32_1-ctx${ctx}_cs${preset.prefill_chunk_size}-webgpu.wasm`,
      )).toBe(true)
    })
  }

  it('never bake a sliding window next to a context window (web-llm rejects it, #398)', () => {
    for (const preset of Object.values(presets.presets)) {
      expect(preset).not.toHaveProperty('sliding_window_size')
    }
    const presetsBlock = notebookSource.slice(
      notebookSource.indexOf('PRESETS = {'),
      notebookSource.indexOf('CONV_TEMPLATES'),
    )
    expect(presetsBlock).not.toMatch(/sliding_window_size"/)
    expect(presetsBlock).not.toMatch(/attention_sink_size"/)
    expect(read('scripts/build-vicuna-wasm.sh')).not.toMatch(/sliding_window_size=|attention_sink_size=/)
  })

  it('build script passes sizes through --overrides instead of patching JSON', () => {
    const script = read('scripts/build-vicuna-wasm.sh')
    expect(script).toContain('--overrides "context_window_size=${CONTEXT_SIZE};prefill_chunk_size=${PREFILL_CHUNK_SIZE}"')
    expect(script).toContain('export MLC_LLM_SOURCE_DIR=')
    // symlink step must come after prep_emcc_deps.sh
    expect(script.indexOf('./web/prep_emcc_deps.sh')).toBeLessThan(script.indexOf('ln -sf mlc_wasm_runtime.bc'))
    expect(script).not.toContain('_cs1k-webgpu.wasm"')
  })
})

describe('build-vicuna-wasm workflow', () => {
  const workflow = read('.github/workflows/build-vicuna-wasm.yml')

  it('uses real action names', () => {
    expect(workflow).toContain('dtolnay/rust-toolchain@stable')
    expect(workflow).not.toContain('dtolnay/rust-action')
  })

  it('only uploads to Hugging Face when the boolean input is true', () => {
    expect(workflow).toContain("HF_UPLOAD: ${{ inputs.hf_upload == true && '1' || '0' }}")
    expect(workflow).not.toMatch(/inputs\.hf_upload && /)
  })

  it('installs pinned versions, not tot/latest', () => {
    expect(workflow).not.toMatch(/emsdk install tot|emsdk activate tot/)
    expect(workflow).toContain('==${MLC_LLM_NIGHTLY_VERSION}')
    expect(workflow).toContain('==${MLC_AI_NIGHTLY_VERSION}')
    expect(workflow).toContain('"${EMSDK_VERSION}"')
  })
})
