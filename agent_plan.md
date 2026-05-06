# Implementation Roadmap

## Project Velocity
tasks_per_run: 1

## Phase 1: Configuration & Execution
- [x] 1. Create agent_plan.md to track execution
- [x] 2. Update agent_plan.md

## Phase 2: Architectural Expansion (The "Dream" Phase)
- [x] 3. Brainstorm new Director Modes or humor capabilities
    - Added "Pitch Meeting Mode" - Agents play Founder, Investor, and Sycophant to pitch terrible product ideas.
- [x] 4. Define specific LLM pairings for new modes
    - Founder: Comedian (Energetic and delusional, Hermes-3)
    - Investor: Scientist (Logical and skeptical, Qwen2.5)
    - Sycophant: Philosopher (Deep agreement, Phi-3)
- [x] 5. Outline Cloud Persistence roadmap for Hugging Face storage_manager
    - **Authentication:** Validate tokens via `/whoami-v2` and store in `localStorage`.
    - **Episode Pushing:** Background upload generated scripts (JSON format) to private Hugging Face Datasets without blocking the main UI thread.
    - **Summary Fetching:** At boot, fetch previous episode summaries to prime the `GroupChatManager` context window for continuity.
    - **Sync Queue Management:** Implement a queue to manage chunked file uploads and retries using exponential backoff to handle HTTP 429 errors.
    - **Community Scripts Hub:** Enable sharing and importing community presets via public HF Datasets.

## Output Requirements
- [x] 6. Make code changes
- [x] 7. Full agent_plan.md updated
