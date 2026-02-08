# Avatar Interaction System: Expansion Plan

## Project Velocity
* **tasks_per_run**: 2
* **status**: On Track

## 1. System Philosophy: "The Digital Director"
Our architecture relies on a **Centralized Director / Stateless Actor** model.
- **The Agents** (`Comedian`, `Philosopher`, `Scientist`) are stateless configurations (Prompts + Visual Params). They do not "think" independently; they react to the context provided to them.
- **The Director** is the main loop (currently in `main.ts`) that orchestrates the scene. It holds the state, decides who speaks, determines the pacing, and injects environmental context.

**Goal:** To perfect interactions, we will move logic *out* of the random loop and *into* structured "Director Modes."

---

## 2. Core Architecture Enhancements

### A. Formalize the Director
Currently, the Director is a `while` loop in `main.ts`. We must refactor this into a dedicated `Director` class.
* **Responsibility:** Manage the "Game Loop" of the conversation.
* **Input:** A `Scenario` object (Improv, Script, or Reaction).
* **Output:** Orchestrates `GroupChatManager.chat()` calls and `Stage` visual cues.

### B. The Context Injection Pipeline
To support new modes, we need a standard way to inject "World Info" into the LLM prompt without breaking character.
* **Mechanism:** Append "Stage Directions" to the prompt, hidden from the user.
* **Format:** `(SYSTEM_INJECTION: [Context])`
* **Example:** `(SYSTEM_INJECTION: You are looking at a photo of a cat. It is ugly. React.)`

---

## 3. New Interaction Modes

### Mode A: Scripted Vignettes ("The Writer's Room")
*Description: Agents perform a pre-written or AI-generated script instead of improvising.*

**Workflow:**
1.  **Generation:** An external high-IQ model (Gemini/GPT-4) generates a "Beat Sheet" JSON.
2.  **Parsing:** The Director loads this JSON.
3.  **Execution:** Feed the `line` to the LLM as an instruction.

### Mode B: Media Reaction ("The MST3K Protocol")
*Description: Agents watch a video or look at images and comment on them in real-time.*

### Mode C: The Reporter (Dynamic Context / RAG)
*Description: Agents act as experts on specific live topics (Olympics, Science).*

### Mode D: Serialized Memory ("TV Show Logic")
*Description: Agents remember past interactions across sessions.*

### Mode E: Creative Expansion (New)
*   **Roast Battle Mode**: Agents take turns roasting each other or the user.
    *   *Model Pairing*: Hermes-3 (Uncensored) or Llama-3 (Instruct) for maximum creativity and bite.
    *   *Mechanic*: Score tracking based on "Oooooh" reactions from other agents.
*   **Collaborative Storytelling**: Agents build a story sentence by sentence.
    *   *Model Pairing*: Phi-3 (High logic/coherence) to keep the plot on rails.
*   **The Debate Club**: Two agents debate an absurd topic, while the third moderates.
    *   *Model Pairing*: Qwen2.5-Coder (Logic) vs. Hermes-3 (Creativity).
    *   *Mechanic*: Moderator tracks time and assigns points.
*   **Heckler Interaction**: User interrupts, agents must handle it dynamically.

---

## 4. Infrastructure & Storage (HF Integration)

### Goal: Cloud Persistence
Move heavy data (scripts, memories) to Hugging Face storage (Datasets/Hub).

1.  **Authentication**: Implement HF OAuth or Token input in UI.
2.  **Episode Storage**: Push finished "Episode Scripts" (JSON) to a private HF Dataset.
    *   `Dataset: user/jokesters-episodes`
3.  **Continuity**: Fetch "Previous Episode Summaries" at boot to seed the context window.
    *   *Logic*: Check for `summary.json` in the dataset, inject into system prompt.

---

## 5. Implementation Roadmap

### Phase 1: The Refactor (Foundation)
* [x] Extract `Director` logic from `main.ts` into `src/Director/Director.ts`.
* [x] Create `Director.playScenario(scenario)` interface.

### Phase 2: The "Watcher" (MST3K)
* [x] Add a video player to the UI (hidden or behind agents).
* [x] Create `MediaReactionManager` to poll video time and dispatch events.
* [x] Test with a hardcoded video + JSON description file.

### Phase 3: The "Writer" (Scripts)
* [x] Create `ScriptParser` to read JSON scripts.
* [ ] Connect to a "Script Generator" (External LLM API hook).
    *   *Idea*: Use a lightweight local model to generate short scripts on the fly.

### Phase 4: Persistence (HF Integration)
* [ ] Implement `MemoryManager` (Local `localStorage` wrapper first).
* [ ] Add HF Token Input in Settings Modal.
* [ ] Implement `HFStorageManager` class using `@huggingface/hub` (or REST API).
    *   `authenticate(token)`
    *   `saveEpisode(data)`
    *   `loadLastEpisode()`
* [ ] Add "Save/Load" buttons to the UI.

### Phase 5: New Creative Modes
* [ ] Implement "Roast Battle" Scenario logic in `Director`.
* [ ] Implement "Collaborative Storytelling" Scenario logic.
* [ ] Implement "The Debate Club" Scenario logic.
* [ ] Implement "Heckler Interaction" handling in `Director` loop.
