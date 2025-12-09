# The Jokesters — Roadmap & Future Features

This document tracks planned enhancements, feature ideas, and technical improvements for the project.

---

## ✅ Implemented Features

### Smart Director (Silent Coach)
- Director analyzes scene flow every turn (based on Chaos slider probability)
- Judges scene as **FLOWING** (good momentum) or **STAGNANT** (boring/repetitive)
- Injects a hidden instruction to the next agent to steer the scene
- Color-coded Director messages in chat log (teal = flowing, red = action needed)

### Gritty Style Guide
- "Gritty but Safe" style instruction injected into every agent turn
- Allows casual profanity (shit, hell, damn, f*ck) for realism
- Strictly forbids sexual violence, graphic gore, and hate speech
- Applied automatically — no toggle required

### Context Window Limiting
- Agent turns use last **15 messages** from conversation history
- Director critique uses last **6 messages** for focused momentum judgment
- Keeps inference fast and token usage manageable

---

## 🚧 Planned Features

### Configurable Context Window Size
**Priority:** Medium  
**Status:** Planned

Allow the context window size to be adjusted dynamically:

1. **Director-controlled window**
   - Director can request "zoom in" (smaller window, focus on immediate exchange)
   - Director can request "zoom out" (larger window, recall earlier context)
   - Example: If scene feels disconnected, Director says "Recall the earlier joke about X"

2. **Scene setup configuration**
   - Scene description could include a `contextDepth` parameter
   - Short sketches use smaller windows (fast, punchy)
   - Long-form improv uses larger windows (callbacks, arcs)

3. **UI slider for context window**
   - Add a "Memory Depth" slider in the settings panel
   - Range: 4–30 messages
   - Affects both agent turns and Director analysis proportionally

**Implementation notes:**
- Add `contextWindowSize` parameter to `GroupChatManager.chat()` options
- Director could return a `memoryHint` field alongside critique
- Store default window size in scene config object

---

### Grittiness Level Presets
**Priority:** Low  
**Status:** Idea

Add selectable style presets:
- **PG** — No swearing, family-friendly
- **PG-13** — Mild swearing (damn, hell)
- **R** — Full casual profanity (current default)

Could be a dropdown in the settings panel or per-scene config.

---

### Runtime Content Filter
**Priority:** Low  
**Status:** Idea

Add a post-generation safety classifier to catch forbidden content that slips through the prompt-based guardrails. Could use a small classifier model or keyword blocklist.

---

### Director Memory / Scene Arc Tracking
**Priority:** Medium  
**Status:** Idea

Track high-level scene beats and callbacks:
- Director maintains a short "scene summary" that persists across turns
- Can reference earlier jokes/moments for callbacks
- Helps create satisfying narrative arcs in longer scenes

---

## 💡 Other Ideas

- **Per-agent grittiness** — Some characters swear more than others
- **Audience reactions** — Simulated laugh track or emoji reactions based on joke quality
- **Scene templates** — Pre-built scene setups (talk show, courtroom, etc.)
- **Export scene** — Save completed improv as transcript or video
- **Character-triggered Sound Effects (SFX)** — Allow characters to trigger sound effects from within their dialogue.
   - **Trigger format:** Recognize inline tokens (e.g., `[sfx:laugh]`) or JSON-like structured outputs from Director.
   - **SFX Manager:** Add a new `SfxManager` to preload and play sounds from `public/sfx/`.
   - **Playback modes:** overlay (play alongside TTS), interrupt (stop/pause TTS), or duck (lower TTS volume while SFX plays).
   - **Per-agent mapping:** Allow agent-specific SFX mappings (e.g., `comedian` -> `comedian_laugh.ogg`).
   - **UI:** Add SFX toggle and volume controls in settings, and a button to preview agent SFX.
   - **Director SFX:** Allow the Director to inject SFX via hidden instruction (e.g., `SFX:explosion`) and map those to audio events.
   - **Implementation notes:**
      - Extend `GroupChatManager.chat()` to include `onSfx?: (sfxName: string, agentId?: string)` callback or detect tokens in the existing streaming loop.
      - Create `src/audio/SfxManager.ts` to manage preloading and playing, and connect it to existing `SpeechQueue` and `AudioEngine` for ducking.
      - Preload a small core SFX set at init and lazy-load extras on-demand.
   - **Safety:** Use a whitelist for allowed SFX names to avoid path traversal or arbitrary fetches.

---

## Contributing

Feel free to pick up any planned feature! Open an issue first to discuss approach.
