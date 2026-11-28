/**
 * Prints JSON [{ id, kind, url }] for every selectable preset (blessed list + launch
 * dropdown): MLC model_lib + mlc-chat-config, Transformers config, GGUF files.
 * Used by `scripts/smoke.mjs --flows presets`.
 */
import { BLESSED_PRESETS } from '../../src/config/blessedPresets'
import { getModelInfo, getUnifiedModelById } from '../../src/config/models'
import { wasmLibFallbackChain } from '../../src/config/loadFailover'
import fs from 'node:fs'

const template = fs.readFileSync(new URL('../../src/app/appTemplate.ts', import.meta.url), 'utf8')
const dropdown = [...template.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1])
const ids = new Set([...BLESSED_PRESETS.map((p) => p.id), ...dropdown])

const out: Array<{ id: string; kind: string; url: string; fallbacks?: string[] }> = []
for (const id of ids) {
  const mlc = getModelInfo(id) as { model?: string; model_lib?: string } | undefined
  if (mlc?.model_lib) {
    // The app tries these in order (resolveModelLibUrl); the preset loads if any resolves.
    out.push({ id, kind: 'model_lib', url: mlc.model_lib, fallbacks: wasmLibFallbackChain(mlc.model_lib) })
    if (mlc.model) {
      const base = mlc.model.replace(/\/$/, '')
      const cfg = base.includes('huggingface.co') ? `${base}/resolve/main/mlc-chat-config.json` : `${base}/mlc-chat-config.json`
      out.push({ id, kind: 'config', url: cfg })
    }
    continue
  }
  const u = getUnifiedModelById(id) as Record<string, any> | undefined
  if (!u) continue // engine names etc. from other <select>s
  if (u.transformers?.model_id) {
    out.push({ id, kind: 'config', url: `https://huggingface.co/${u.transformers.model_id}/resolve/main/config.json` })
  }
  if (u.llamaCpp?.gguf_url) out.push({ id, kind: 'gguf', url: u.llamaCpp.gguf_url })
  if (u.llamaCpp?.mmprojUrl) out.push({ id, kind: 'mmproj', url: u.llamaCpp.mmprojUrl })
}
process.stdout.write(JSON.stringify(out))
