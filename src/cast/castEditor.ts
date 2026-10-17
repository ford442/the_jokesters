import type { Agent } from '../types/chat'
import type { GroupChatManager } from '../GroupChatManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import { setVoiceOverride, voiceFor, type SupertonicStyleId } from '../audio/voiceMap'
import { downloadTextFile } from '../episode'
import type { AvatarTier } from '../visuals/avatarTier'
import type { Director } from '../Director/Director'
import type { ChatLogApi } from '../app/chatLog'
import { CHARACTER_SPEEDS } from '../app/chatLog'
import { updateNextAgentUI } from '../app/statusBar'
import { wireVoiceUi } from '../app/voiceUi'
import { applyCastAvatars, applyCastToRoster, type AvatarStage } from './castApply'
import {
  builtInPersona,
  checkPersona,
  CAST_SLOT_IDS,
  defaultCast,
  looksLikeGlb,
  MAX_NAME_CHARS,
  MAX_PERSONA_CHARS,
  parseCastCard,
  validateCastCard,
  type CastCard,
  type CastSlot,
  type CastSlotId,
} from './castCard'
import { exportCastCard, IdbAvatarStore, importCastCard, loadActiveCard, saveActiveCard } from './castStore'

export interface CastEditorDeps {
  roster: Agent[]
  groupChatManager: GroupChatManager
  speechQueue: SpeechQueue
  stage: AvatarStage
  chatLog: ChatLogApi
  getDirector: () => Director | null
  tier: AvatarTier
}

const VOICE_LABELS: Record<SupertonicStyleId, string> = { M1: 'Male 1 (M1)', M2: 'Male 2 (M2, deep)', F1: 'Female 1 (F1)', F2: 'Female 2 (F2)' }
const PREVIEW_LINE = 'Good evening, ladies and gentlemen. Try the veal.'
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024
const MAX_IMPORT_BYTES = 80 * 1024 * 1024

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string>> = {},
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) node.setAttribute(k, v)
  for (const c of children) node.append(c)
  return node
}

/** Open the cast editor modal. Edits are a draft until "Apply". */
export function openCastEditor(deps: CastEditorDeps): void {
  if (document.getElementById('cast-editor-overlay')) return
  const store = new IdbAvatarStore()
  let draft: CastCard = structuredClone(loadActiveCard() ?? defaultCast())
  const profanity = () => deps.groupChatManager.getProfanityLevel()

  const overlay = el('div', { id: 'cast-editor-overlay', class: 'cast-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Cast editor' })
  const panel = el('div', { class: 'cast-panel' })
  overlay.append(panel)

  const status = el('div', { class: 'cast-status', 'aria-live': 'polite' })
  const say = (msg: string, bad = false) => {
    status.textContent = msg
    status.style.color = bad ? '#ff6b6b' : '#4ecdc4'
  }

  const titleInput = el('input', { type: 'text', class: 'cast-title', maxlength: '60', 'aria-label': 'Cast title' })
  const slotsWrap = el('div', { class: 'cast-slots' })

  const close = () => {
    for (const id of CAST_SLOT_IDS) {
      // Preview voices revert to whatever is applied.
      const applied = loadActiveCard()?.slots.find((s) => s.id === id)?.voice ?? defaultCast().slots.find((s) => s.id === id)!.voice
      setVoiceOverride(id, applied)
    }
    overlay.remove()
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
  document.addEventListener('keydown', onKey)

  function renderSlot(slot: CastSlot): HTMLElement {
    const optional = slot.id === 'techBro' || slot.id === 'robot'
    const card = el('section', { class: 'cast-slot', 'data-slot': slot.id })

    const name = el('input', { type: 'text', maxlength: String(MAX_NAME_CHARS), value: slot.name, 'aria-label': `${slot.id} name` })
    name.addEventListener('input', () => { slot.name = name.value })
    const color = el('input', { type: 'color', value: slot.color, 'aria-label': `${slot.id} colour` })
    color.addEventListener('input', () => { slot.color = color.value })
    const head = el('div', { class: 'cast-slot-head' }, color, name)
    card.append(head)

    if (optional) {
      const on = el('input', { type: 'checkbox' })
      on.checked = slot.enabled
      on.addEventListener('change', () => { slot.enabled = on.checked })
      card.append(el('label', { class: 'cast-row' }, on, ' On stage (joins the chat rotation)'))
    }

    // Persona
    const builtIn = el('input', { type: 'checkbox' })
    builtIn.checked = slot.persona === null
    const persona = el('textarea', { rows: '4', maxlength: String(MAX_PERSONA_CHARS), 'aria-label': `${slot.id} persona` })
    const meter = el('div', { class: 'cast-meter' })
    const refreshPersona = () => {
      const useBuiltIn = builtIn.checked
      persona.disabled = useBuiltIn
      if (useBuiltIn) {
        slot.persona = null
        persona.value = builtInPersona(slot.id)
        meter.textContent = 'Built-in persona'
        meter.style.color = '#888'
        return
      }
      const check = checkPersona(persona.value, profanity())
      if (check.truncated) persona.value = check.text
      slot.persona = check.text
      const parts = [`${check.text.length}/${MAX_PERSONA_CHARS} chars · ≈${check.approxTokens} tokens`]
      if (check.flagged > 0) parts.push(`${check.flagged} word(s) will be masked at the current ${profanity()} setting`)
      meter.textContent = parts.join(' · ')
      meter.style.color = check.flagged > 0 ? '#ffd700' : '#888'
    }
    builtIn.addEventListener('change', () => {
      if (!builtIn.checked && !slot.persona) persona.value = ''
      refreshPersona()
    })
    persona.value = slot.persona ?? builtInPersona(slot.id)
    persona.addEventListener('input', refreshPersona)
    card.append(
      el('label', { class: 'cast-row' }, builtIn, ' Use built-in persona'),
      persona,
      meter,
    )
    refreshPersona()

    // Voice
    const voice = el('select', { 'aria-label': `${slot.id} voice` })
    for (const [id, label] of Object.entries(VOICE_LABELS)) {
      const o = el('option', { value: id }, label)
      if (id === slot.voice) o.selected = true
      voice.append(o)
    }
    const preview = el('button', { type: 'button', class: 'episode-btn', title: 'Hear this voice' }, '▶ Preview')
    voice.addEventListener('change', () => { slot.voice = voice.value as SupertonicStyleId })
    preview.addEventListener('click', () => {
      setVoiceOverride(slot.id, slot.voice)
      const speed = CHARACTER_SPEEDS[slot.id] ?? 1.0
      deps.speechQueue
        .synthesizeOrTakeCached(PREVIEW_LINE, slot.id, { speed })
        .then((r) => deps.speechQueue.add(r.audioData, r.sampleRate, { agentId: slot.id, text: PREVIEW_LINE, visemes: r.visemes }))
        .catch((e) => say(`Voice preview failed: ${(e as Error).message}`, true))
      void voiceFor(slot.id)
    })
    card.append(el('div', { class: 'cast-row' }, 'Voice ', voice, preview))

    // Avatar
    const avatarLabel = el('span', { class: 'cast-avatar-label' })
    const describeAvatar = () => {
      avatarLabel.textContent =
        slot.avatar.kind === 'upload' ? `Custom: ${slot.avatar.name}`
        : slot.avatar.kind === 'url' ? `URL: ${slot.avatar.url}`
        : slot.avatar.kind === 'embedded' ? `Embedded: ${slot.avatar.name}`
        : deps.tier === 'vrm' ? 'Default VRM avatar' : 'Default capsule (this GPU keeps primitive actors)'
    }
    describeAvatar()
    const file = el('input', { type: 'file', accept: '.vrm,model/gltf-binary', style: 'display:none' })
    const upload = el('button', { type: 'button', class: 'episode-btn' }, '⬆ Upload .vrm')
    const reset = el('button', { type: 'button', class: 'episode-btn episode-btn-ghost' }, 'Default')
    upload.addEventListener('click', () => file.click())
    file.addEventListener('change', async () => {
      const f = file.files?.[0]
      file.value = ''
      if (!f) return
      if (f.size > MAX_UPLOAD_BYTES) return say(`${f.name} is too large (max ${MAX_UPLOAD_BYTES / 1048576} MB).`, true)
      const head = new Uint8Array(await f.slice(0, 16).arrayBuffer())
      if (!looksLikeGlb(head)) return say(`${f.name} is not a .vrm/.glb model.`, true)
      try {
        await store.put(slot.id, f.name, f)
        slot.avatar = { kind: 'upload', name: f.name }
        describeAvatar()
        say(`${f.name} stored for ${slot.id} — press Apply to put it on stage.`)
      } catch (err) {
        say(`Could not store avatar: ${(err as Error).message}`, true)
      }
    })
    reset.addEventListener('click', () => {
      slot.avatar = { kind: 'default' }
      describeAvatar()
    })
    card.append(el('div', { class: 'cast-row' }, 'Avatar ', avatarLabel, upload, reset, file))

    // Sampling
    const temp = el('input', { type: 'range', min: '0', max: '1.5', step: '0.05', value: String(slot.temperature), 'aria-label': `${slot.id} temperature` })
    const tempVal = el('span', {}, slot.temperature.toFixed(2))
    temp.addEventListener('input', () => { slot.temperature = parseFloat(temp.value); tempVal.textContent = slot.temperature.toFixed(2) })
    const topP = el('input', { type: 'range', min: '0.1', max: '1', step: '0.05', value: String(slot.top_p), 'aria-label': `${slot.id} top_p` })
    const topPVal = el('span', {}, slot.top_p.toFixed(2))
    topP.addEventListener('input', () => { slot.top_p = parseFloat(topP.value); topPVal.textContent = slot.top_p.toFixed(2) })
    card.append(
      el('div', { class: 'cast-row' }, 'Temperature ', temp, tempVal),
      el('div', { class: 'cast-row' }, 'Top-p ', topP, topPVal),
    )
    return card
  }

  function render() {
    titleInput.value = draft.title
    slotsWrap.replaceChildren(...[...draft.slots].sort((a, b) => CAST_SLOT_IDS.indexOf(a.id) - CAST_SLOT_IDS.indexOf(b.id)).map(renderSlot))
  }
  titleInput.addEventListener('input', () => { draft.title = titleInput.value || 'My cast' })

  const embed = el('input', { type: 'checkbox', id: 'cast-embed' })
  const importInput = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' })

  const btn = (label: string, cls = 'episode-btn') => el('button', { type: 'button', class: cls }, label)
  const applyBtn = btn('✅ Apply', 'episode-btn episode-btn-primary')
  const resetBtn = btn('↺ Default cast')
  const exportBtn = btn('⬇ Export card')
  const importBtn = btn('📥 Import card')
  const closeBtn = btn('Close', 'episode-btn episode-btn-ghost')

  applyBtn.addEventListener('click', async () => {
    const v = validateCastCard(draft)
    if (!v.ok) return say(`Cannot apply: ${v.errors.join('; ')}`, true)
    if (deps.getDirector()?.isSceneRunning()) return say('Stop the running scene before changing the cast.', true)
    applyBtn.disabled = true
    try {
      const { rosterChanged } = applyCastToRoster(deps.roster, draft)
      if (rosterChanged) deps.groupChatManager.resetConversation()
      saveActiveCard(draft)
      deps.speechQueue.clearPrerendered()
      updateNextAgentUI(deps.groupChatManager)
      wireVoiceUi(deps.speechQueue, deps.roster)
      const result = await applyCastAvatars(draft, { stage: deps.stage, store, tier: deps.tier })
      const failed = result.failed.map((f) => `${f.id} (${f.reason})`)
      deps.chatLog.addMessage('System', `🎭 Cast applied: ${deps.roster.map((a) => a.name).join(', ')}${failed.length ? ` · avatar fallback: ${failed.join(', ')}` : ''}`, failed.length ? '#ffd700' : '#4ecdc4')
      say(failed.length ? `Applied. Some avatars fell back to the capsule: ${failed.join(', ')}` : 'Applied.', failed.length > 0)
    } catch (err) {
      say(`Apply failed: ${(err as Error).message}`, true)
    } finally {
      applyBtn.disabled = false
    }
  })

  resetBtn.addEventListener('click', () => {
    draft = defaultCast()
    render()
    say('Default cast loaded — press Apply to use it.')
  })

  exportBtn.addEventListener('click', async () => {
    const v = validateCastCard(draft)
    if (!v.ok) return say(`Cannot export: ${v.errors.join('; ')}`, true)
    try {
      const text = await exportCastCard(draft, store, { embedAvatars: embed.checked })
      const safe = draft.title.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'cast'
      downloadTextFile(`${safe}.jokesters-cast.json`, text, 'application/json')
      say(`Exported ${safe}.jokesters-cast.json${embed.checked ? ' (with avatars)' : ''}`)
    } catch (err) {
      say(`Export failed: ${(err as Error).message}`, true)
    }
  })

  importBtn.addEventListener('click', () => importInput.click())
  importInput.addEventListener('change', async () => {
    const f = importInput.files?.[0]
    importInput.value = ''
    if (!f) return
    if (f.size > MAX_IMPORT_BYTES) return say('That file is too large to be a cast card.', true)
    const parsed = parseCastCard(await f.text())
    if (!parsed.ok || !parsed.card) return say(`Import failed: ${parsed.errors.join('; ')}`, true)
    try {
      const { card, rejectedAvatars } = await importCastCard(parsed.card, store)
      draft = structuredClone(card)
      render()
      say(`Imported "${card.title}"${rejectedAvatars.length ? ` (rejected avatars: ${rejectedAvatars.join(', ')})` : ''} — press Apply to use it.`, rejectedAvatars.length > 0)
    } catch (err) {
      say(`Import failed: ${(err as Error).message}`, true)
    }
  })
  closeBtn.addEventListener('click', close)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })

  panel.append(
    el('div', { class: 'cast-header' }, el('h2', {}, '🎭 Cast editor'), titleInput),
    el('p', { class: 'cast-help' }, 'Edit the five performers. Changes take effect when you press Apply. Persona text is capped to protect the token budget and is masked according to the show’s profanity setting.'),
    slotsWrap,
    status,
    el('div', { class: 'cast-footer' }, applyBtn, resetBtn, exportBtn, el('label', { class: 'cast-row' }, embed, ' embed avatars (large file)'), importBtn, closeBtn, importInput),
  )
  render()
  document.body.append(overlay)
  titleInput.focus()
}
