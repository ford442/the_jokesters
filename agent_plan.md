# Implementation Roadmap

## Project Velocity
tasks_per_run: 2

## Phase 1: Configuration & Execution
- [x] 1. Create agent_plan.md to track execution
- [x] 2. Update agent_plan.md
- [x] 6. Make code changes
- [x] 7. Full agent_plan.md updated
- [x] 8. Implement Corporate Jargon Translator Mode
- [x] 9. Implement Browser History Interrogation Mode

## Phase 2: Architectural Expansion (The "Dream" Phase)
- [x] 3. Brainstorm new Director Modes or humor capabilities
    - Added "Pitch Meeting Mode" - Agents play Founder, Investor, and Sycophant to pitch terrible product ideas.
    - Added "Browser History Interrogation Mode" - A chaotic mode where agents interrogate the user about their bizarre internet history.
    - **NEW:** Added "Corporate Mascot Crisis Mode" - A chaotic PR mode where a disgraced corporate mascot tries to justify their actions alongside the CEO and PR manager.
- [x] 4. Define specific LLM pairings for new modes
    - Founder: Comedian (Energetic and delusional, Hermes-3)
    - Investor: Scientist (Logical and skeptical, Qwen2.5)
    - Sycophant: Philosopher (Deep agreement, Phi-3)
    - Interrogator 1: Scientist (Logical deduction)
    - Interrogator 2: Comedian (Wild leaps of judgment)
    - **NEW:** Mascot: Comedian (Unhinged, defensive, Hermes-3)
    - **NEW:** CEO: Philosopher (Dodging responsibility with deep, empty platitudes, Phi-3)
    - **NEW:** PR Manager: Scientist (Cold, calculated spin-doctor, Qwen2.5)
- [x] 5. Outline Cloud Persistence roadmap for Hugging Face storage_manager
    - **Authentication:** Validate tokens via `/whoami-v2` and store in `localStorage`.
    - **Episode Pushing:** Implement a Web Worker to manage syncing local IndexedDB to private Hugging Face Datasets via background upload (JSON format) of generated scripts, avoiding blocking the main UI thread.
    - **Summary Fetching:** At boot, fetch previous `latest.json` episode summaries to prime the `GroupChatManager` context window for continuity. Save it to IndexedDB to allow offline reads.
    - **Sync Queue Management:** Implement a queue to manage chunked file uploads and retries using exponential backoff to handle HTTP 429 errors. Web Worker polls the queue.
    - **Community Scripts Hub:** Enable sharing and importing community presets via public HF Datasets.
    - **IndexedDB Caching for Offline Play:** Use `jokestersDB` IndexedDB layer to cache downloaded episodes, `summary.json`, and assets for robust offline support when HF API is unreachable.

## Output Requirements
- [x] 10. Updated Plan updated with completed items, new velocity, and newly brainstormed mode & storage features.
