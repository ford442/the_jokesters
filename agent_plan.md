# Avatar Interaction System: Expansion Plan

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
    ```json
    [
      { "speaker": "comedian", "action": "laugh", "line": "Is that a toaster?" },
      { "speaker": "scientist", "action": "analyze", "line": "It appears to be a rudimentary heating element." }
    ]
    ```
3.  **Execution:**
    * **Strict Mode:** Feed the `line` directly to TTS (AudioEngine).
    * **Loose Mode:** Feed the `line` to the LLM as an instruction: `(Say this line in your own style: "It appears to be a rudimentary heating element.")`.

### Mode B: Media Reaction ("The MST3K Protocol")
*Description: Agents watch a video or look at images and comment on them in real-time.*

**Workflow:**
1.  **The Feed:** An HTML `<video>` element or StreetView `<iframe>` runs in the background.
2.  **Time-Synced Metadata:** A JSON file maps timestamps to context descriptions.
    * `00:10`: "The hero trips over a rake."
    * `00:25`: "A giant rubber monster appears."
3.  **The Loop:**
    * The Director monitors video time.
    * When a timestamp is hit, it pauses the video (optional) and triggers an agent turn.
    * **Prompt Injection:** `(CONTEXT: You are watching a movie. On screen: The hero trips over a rake. Make a snarky comment.)`

### Mode C: The Reporter (Dynamic Context / RAG)
*Description: Agents act as experts on specific live topics (Olympics, Science).*

**Workflow:**
1.  **Fetch:** `FetchService` pulls live data (News API) or static knowledge (Wiki Summary).
2.  **Context Loading:**
    * **Scenario:** "Breaking News"
    * **System Prompt Update:** The `GroupChatManager` temporarily appends the data to the *System Prompt*.
    * *Example:* `SYSTEM: You are a sports reporter. DATA: France won Gold. SCORE: 12-0.`
3.  **Interaction:** Agents discuss the injected data as if they just witnessed it.

### Mode D: Serialized Memory ("TV Show Logic")
*Description: Agents remember past interactions across sessions.*

**Workflow:**
1.  **Storage:** Create a `MemoryManager` using `localStorage` or IndexedDB.
2.  **Episode Summaries:** At the end of a session, ask the LLM to "Summarize this conversation in 3 sentences." Save this as `last_episode_summary`.
3.  **Recap Injection:** On app load, inject the summary into the System Prompt.
    * *Prompt:* `(PREVIOUSLY ON THE JOKESTERS: The Comedian admitted she hates pizza. The Scientist built a time machine.)`

---

## 4. Implementation Roadmap

### Phase 1: The Refactor (Foundation)
* [ ] Extract `Director` logic from `main.ts` into `src/Director/Director.ts`.
* [ ] Create `Director.playScenario(scenario)` interface.

### Phase 2: The "Watcher" (MST3K)
* [ ] Add a video player to the UI (hidden or behind agents).
* [ ] Create `MediaReactionManager` to poll video time and dispatch events.
* [ ] Test with a hardcoded video + JSON description file.

### Phase 3: The "Writer" (Scripts)
* [ ] Create `ScriptParser` to read JSON scripts.
* [ ] Connect to a "Script Generator" (could be a simple prompt to the local LLM first: "Write a script about X").

### Phase 4: Persistence
* [ ] Implement `MemoryManager`.
* [ ] Add "Save/Load" buttons to the UI.
