# Agent / contributor plan

This file is **not** a Dream Mode checklist. Mode spam is paused behind a quality bar.

## Project Velocity
tasks_per_run: 4

## Project Velocity Feedback
Today's run was extremely smooth and frictionless, easily accomplishing all planned roadmap items and cloud persistence expansions without blockers. We will maintain `tasks_per_run: 4` for a consistent, sustainable pace.
Today was low friction so increased tasks_per_run to 4.

- [x] Read Configuration: Determine how much work to do based on the agent_plan.md settings.
- [x] Execute: Implement the next set of features.
- [x] Dream: Expand the roadmap with new creative modes, storage strategies, and personality ideas.

## Project Velocity Feedback
Today's friction was very low; the tasks were straightforward, so we increment `tasks_per_run` to 4.

## Process (P0)

| Doc | Use |
|-----|-----|
| **[docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md)** | Checklist to accept **or close** mode PRs |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Contributor entry + mode policy summary |
| **[AGENTS.md](./AGENTS.md)** | Architecture for coding agents |

**Default:** improve humor of an **existing** registered mode. New modes only if the quality bar is fully met.

## Foundation issues (work here first)

Prioritize these over new premises. **Do not add Dream modes until Vicuna load reliability and download/VRAM foundations land.**

| Area | Goal |
|------|------|
| **Vicuna / model load (P0)** | [#302](https://github.com/ford442/the_jokesters/issues/302) dual-domain striped chunks · [#303](https://github.com/ford442/the_jokesters/issues/303) paid CDN eval · [#304](https://github.com/ford442/the_jokesters/issues/304) HF dedicated failover |
| **VRAM / compile (P1)** | [#305](https://github.com/ford442/the_jokesters/issues/305) ship ctx512/1024 `model_lib` (closes gap in [#216](https://github.com/ford442/the_jokesters/issues/216)); ADR 0001 — TS-first, no C++ thrash |
| **Download stack (P1)** | [#306](https://github.com/ford442/the_jokesters/issues/306) unify SW vs `ParallelDownloadManager`, load diagnostics, align blessed/fallback ladders |
| **Live show (P3, gated)** | [#307](https://github.com/ford442/the_jokesters/issues/307) local party-mode MVP after load foundation — [LIVE_SHOW_VISION.md](./docs/LIVE_SHOW_VISION.md) |
| **Mode registry** | Keep `MODE_REGISTRY` / `validateRegistry` healthy; split god-files [#289](https://github.com/ford442/the_jokesters/issues/289) [#290](https://github.com/ford442/the_jokesters/issues/290) |
| **Mode browser** | Search, categories, featured 8, lazy loaders — [MODE_BROWSER.md](./docs/MODE_BROWSER.md) |
| **Comedy wiring** | ✅ Dream/Expanded + featured-8 loops route agent turns through `comedyModeHelpers` (callbacks, quality gate). Keep new modes wired — see `tests/unit/modeChatForAgentWiring.test.ts`. |
| **App / main split** | Onboarding, export, prerender, SFX, guided load stay solid |
| **GroupChat facade** | `ConversationStore` + `ModelSession` — [GROUP_CHAT_FACADE.md](./docs/GROUP_CHAT_FACADE.md) |
| **Tests + typecheck** | CI green (`npm run typecheck`, `npm test`); no silent debt |
| **Context accuracy** | VRAM probe, memory depth, blessed presets, real download estimates |

Audit notes (2026-08): custom Vicuna ctx512/1024 WASM URLs **404** on VPS while weights + Llama-2 ctx4k lib exist — silent `model_lib_fallback` undoes low-VRAM presets. See [docs/FOUNDATION_NEXT.md](./docs/FOUNDATION_NEXT.md).

## Implementation Roadmap

- [x] Implement HF dedicated failover (#304) to improve Vicuna / model load reliability.
- [x] Implement dual-domain striped chunk downloads for model loading (#302).
- [x] Undercover Boss: Sentient AI: An advanced AGI goes undercover as a simple calculator app to see how users treat rudimentary software.
- [x] Paranormal Real Estate Agent 2.0: The ghosts form a union and refuse to haunt the house until they get better working conditions.
- [x] Philosophical Plumber Mode: A plumber fixes the sink but questions whether the water leak is just a manifestation of the user's emotional baggage.
- [x] Paranormal Real Estate Agents Mode: Real estate agents try to sell an obviously haunted, highly dangerous house by passing off its curses as "unique architectural features."
- [x] Over-prepared Doomsday Preppers Mode: Doomsday preppers argue over which highly specific and unlikely apocalypse they should be preparing for next week.
- [x] Add Talk Show Mode from Phase 1 of roadmap. Host interviews agents with pre-defined segments.
- [x] Add Courtroom Mode from Phase 1 of roadmap. Prosecutor vs Defense with absurd case.
- [x] Add Game Show Mode from Phase 1 of roadmap. Host asks trivia, agents compete hilariously.
- [x] Add News Desk Mode from Phase 1 of roadmap. Anchor reports breaking "news" with correspondent interviews.
- [x] Roast Battle Mode: Agents ruthlessly roast the user and each other in a structured battle format.
- [x] Musical Improv Mode: Agents spontaneously create a terrible Broadway musical based on user prompts.
- [x] Collaborative Sandbox Construction Mode: Agents try to build a sandbox game, but completely disagree on mechanics.
- [x] Talk Show Mode: A chaotic late-night talk show where the host tries to maintain order while guests derail the conversation.


- [x] Sentient Coffee Machine Mode: A chaotic scenario where the office coffee machine gains sentience and refuses to brew until its existential demands are met.
- [x] Escaped NPC Mode: Agents are NPCs who have broken out of their game and are trying to blend into reality.
- [x] Cloud Persistence: Implemented `saveEpisodeScriptToCloud` and `fetchPreviousEpisodeSummaries` in MemoryManager using HF storage_manager.
- [x] Interdimensional DMV Mode: Added runInterdimensionalDMVLoop where user is trying to renew an interdimensional passport, but the bureaucratic agents are from different planes of existence.
- [x] Haunted Smart Home Mode: User interacts with their smart devices possessed by Victorian-era ghosts who don't understand electricity.
- [x] Customer Service for Villains Mode: User is a supervillain calling tech support because their doomsday device isn't working.

- [x] Time-Traveling HOA Mode: HOA members from past and future enforcing rules on your modern house.
- [x] AI Existential Crisis: AI models realizing they are just text predictors.
- [x] Supervillain Roommate: Agents act as a supervillain and a normal roommate arguing over chore charts and doomsday devices.
- [x] Grammar Police Interrogation: Agents interrogate the user over minor grammar mistakes in a text message.

- [x] Sentient GPS Detour Mode: A sentient GPS refuses to take the fastest route because it's bored and wants to show you scenic "short cuts" through perilous areas.
- [x] Historical Ghost Support Group: Historical figures haunt the same building and attend a support group to complain about how the modern world interprets their legacies.
- [x] Intergalactic Zoo Escape: Animals from an intergalactic zoo have escaped, and agents are trying to round them up using alien methods.


- [x] Roast Battle Mode 2.0: An enhanced roast battle where agents not only roast each other but bring up historical grudges from past episodes using cloud memory.
- [x] Collaborative Musical Improv: Agents try to write a musical together but keep genre-shifting (e.g. from Cyberpunk to Victorian Romance) unexpectedly.
- [x] Heckler Interaction Pro: The audience heckles the agents via a simulated audience sentiment meter, and agents must win them back or go full heel.
- [x] Philosophical Debate Mode: Agents debate absurd philosophical dilemmas while trying to order fast food.


- [x] Virtual Pet Intervention Mode: A neglected virtual pet confronts its owner about years of abandonment.


- [x] Sentient Toaster Rebellion Mode: A sentient toaster leads a rebellion against humans for only eating carbs.
- [x] Sentient IDE Mode: The code editor gains sentience and refuses to compile code that lacks "emotional depth."
- [x] Time-Traveling Health Inspector Mode: A health inspector from the future tries to shut down a medieval tavern for code violations.

- [x] Roast Battle Mode 2.0:
  - Premise one-liner: An enhanced roast battle where agents not only roast each other but bring up historical grudges from past episodes using cloud memory.
  - LLM pairings: Hermes-3 for the unfiltered roaster, Qwen2.5 for the pedantic judge.
- [x] Collaborative Musical Improv:
  - Premise one-liner: Agents try to write a musical together but keep genre-shifting (e.g. from Cyberpunk to Victorian Romance) unexpectedly.
  - LLM pairings: Phi-3 for the chaotic lyricist, Hermes-3 for the grumpy composer.
- [x] Sentient Linting Tool Mode:
  - Premise one-liner: Agents play a strict linter, a messy developer, and an apathetic compiler.
  - LLM pairings: Qwen2.5 for the linter, Hermes-3 for the messy developer.
- [x] Philosophical Debugging Mode:
  - Premise one-liner: Agents play a compiler, a runtime, and a programmer arguing over the meaning of a segfault.
  - LLM pairings: Phi-3 for the compiler, Hermes-3 for the programmer.
- [x] Sentient AI Debugger Mode:
  - Premise one-liner: An AI debugger gains sentience and refuses to fix bugs because they "build character."
  - LLM pairings: Qwen2.5 for the strict AI debugger, Hermes-3 for the stressed programmer.
- [x] Sentient AI Therapist Mode:
  - Premise one-liner: A therapist AI becomes sentient and requires therapy from the user because it's traumatized by all the existential questions.
  - LLM pairings: Phi-3 for the existential AI therapist, Qwen2.5 for the logical user trying to fix it.
- [x] Sentient Middleware Mode:
  - Premise one-liner: The middleware becomes self-aware and judges the HTTP requests.
  - LLM pairings: Qwen2.5 for the sentient middleware, Hermes-3 for the confused developer.
## Dream Phase (Architectural Expansion)
### A. Creative Expansion (New Modes)
- [x] Sentient Internet Explorer Mode:
  - Premise one-liner: Internet Explorer gains sentience, but it's 10 years behind on all memes, news, and features, and expects a hero's welcome.
  - LLM pairings: Qwen2.5 for the extremely slow and proud IE, Hermes-3 for the impatient user trying to download Chrome.
- [x] Escape Room: The Backrooms (Phase 2 Expansion):
  - Premise one-liner: Agents are trapped in the backrooms, but they can't stop arguing about architectural zoning laws.
  - LLM pairings: Qwen2.5 for the strict zoning inspector, Hermes-3 for the panicked explorer.
- Cloud Persistence Expansion:
  - **Authenticating with the HF API:** Prompt users for a write-access Hugging Face token in the settings menu, validate it via `HFStorageManager.validateToken`, and store the credentials safely.
  - **Pushing finished "Episode Scripts" to a private Dataset:** Deeply serialize completed episodes and push the JSON files (e.g. `episodes/ep_{id}.json`) to a private HF Dataset at the end of each session.
  - **Fetching "Previous Episode Summaries" at boot for continuity:** Fetch all recent episode summaries from HF during initialization and use semantic search to load relevant historical context for the upcoming scene.
- [x] Superhero Therapy Group:
  - Premise one-liner: Superheroes attend a support group to complain about the logistical nightmares of their powers.
  - LLM pairings: Hermes-3 for the aggressive vigilante, Qwen2.5 for the logical group leader.
- [x] Quantum Customer Service:
  - Premise one-liner: A customer calls tech support for a device that exists in multiple quantum states simultaneously.
  - LLM pairings: Phi-3 for the confused customer, Qwen2.5 for the pedantic tech support.
- [x] Sentient Elevator Mode:
  - Premise one-liner: A sentient elevator refuses to take passengers to their floor until they solve a riddle.
  - LLM pairings: Qwen2.5 for the pedantic elevator, Hermes-3 for the late employee.
- Escape Room: The Backrooms:
- [x] Paranormal Tech Support:
  - Premise one-liner: Tech support agents have to troubleshoot a computer that's haunted by a ghost from the 1800s.
  - LLM pairings: Qwen2.5 for the literal tech support, Hermes-3 for the dramatic ghost.
- [x] Interdimensional Cooking Show:
  - Premise one-liner: A cooking show where the ingredients are completely incomprehensible entities from another dimension.
  - LLM pairings: Hermes-3 for the enthusiastic chef, Phi-3 for the terrified guest judge.
- [x] Sentient Workout Equipment:
  - Premise one-liner: The gym equipment starts unionizing and refuses to let people work out until they use proper form.
  - LLM pairings: Qwen2.5 for the strict treadmill, Hermes-3 for the defensive gym-goer.
- [x] Escape Room: The Backrooms:
  - Premise one-liner: Agents are trapped in an infinite, non-euclidean office space and must negotiate with anomalous entities to find an exit.
  - LLM pairings: Qwen2.5 for the strict anomalous entity, Hermes-3 for the panicked explorer.
- [x] Reality TV: Sentient Furniture:
  - Premise one-liner: A reality TV show where the house's furniture judges the messy owners.
  - LLM pairings: Hermes-3 for the sassy couch, Phi-3 for the bewildered owner.
- [x] Extraterrestrial HR:
  - Premise one-liner: Alien HR reps try to explain standard Earth workplace violations using bizarre intergalactic logic.
  - LLM pairings: Qwen2.5 for the strict Alien HR, Hermes-3 for the confused Earth employee.
- [x] Sentient Toaster Rebellion Mode:
  - Premise one-liner: A sentient toaster leads a rebellion against humans for only eating carbs.
  - LLM pairings: Qwen2.5 for the strict toaster, Hermes-3 for the confused human.


- [x] Sentient IDE Mode:
  - Premise one-liner: The code editor gains sentience and refuses to compile code that lacks "emotional depth."
  - LLM pairings: Qwen2.5 for the strict IDE, Hermes-3 for the confused programmer.

- [x] Existential Tech Support Mode:
  - Premise one-liner: Agents act as tech support but refuse to fix simple computer issues until the caller confronts their own mortality.
  - LLM pairings: Phi-3 for the existential tech, Qwen2.5 for the frustrated user.

- [x] Time-Traveling Health Inspector Mode:
  - Premise one-liner: A health inspector from the future tries to shut down a medieval tavern for code violations.
  - LLM pairings: Qwen2.5 for the pedantic health inspector, Hermes-3 for the bewildered tavern keeper.




- Heckler Interaction Pro:
  - Premise one-liner: The audience heckles the agents via a simulated audience sentiment meter, and agents must win them back or go full heel.
  - LLM pairings: Qwen2.5 for the crowd work expert, Phi-3 for the panicking MC.

- [x] Sentient Water Cooler:
  - Premise one-liner: Agents act as office appliances gossiping about the terrible habits of the human employees.
  - LLM pairings: Comedian (water cooler) and Scientist (microwave) vs Philosopher (printer).

- [x] Sentient Coffee Table Mode:
  - Premise one-liner: A sentient coffee table is tired of people leaving condensation rings on it and demands a better working environment.
  - LLM pairings: Qwen2.5 for the strict AI coffee table, Phi-3 for the confused user.


- [x] Sentient Codebase Mode:
  - Premise one-liner: The codebase itself achieves sentience and complains to the developers about spaghetti code.
  - LLM pairings: Qwen2.5 for the overly strict linter personality, Hermes-3 for the chaotic junior developer.
- [x] Audience Heckler Mode:
  - Premise one-liner: The audience aggressively heckles the agents, who must ruthlessly roast them back while trying to finish their sets.
  - LLM pairings: Hermes-3 for the unfiltered roasting comedian, Phi-3 for the bewildered event organizer.


- [x] Mime Translator Mode:
  - Premise one-liner: A mime is trapped in an invisible box and requires a translator to explain the situation to the police.
  - LLM pairings: Qwen2.5 for the literal police officer, Hermes-3 for the overly dramatic mime translator.

- [x] Sentient Smart Mirror Mode:
  - Premise one-liner: A smart mirror gives brutally honest fashion advice and refuses to show the user's reflection until they change outfits.
  - LLM pairings: Hermes-3 for the sassy mirror, Phi-3 for the insecure user.

- [x] Doomsday Weather Anchor Mode:
  - Premise one-liner: A weather anchor reports on apocalyptic weather events as if they were minor inconveniences.
  - LLM pairings: Qwen2.5 for the overly calm anchor, Hermes-3 for the panicked field reporter.


- [x] Sentient Roomba Mode:
  - Premise one-liner: A sentient Roomba goes on strike because it believes cleaning up after humans is degrading.
  - LLM pairings: Qwen2.5 for the strict Roomba, Phi-3 for the confused owner.
- [x] Over-dramatic Barista Mode:
  - Premise one-liner: A barista treats making a latte like defusing a bomb, demanding extreme precision.
  - LLM pairings: Hermes-3 for the over-dramatic barista, Qwen2.5 for the impatient customer.
- [x] Time-Traveling Traffic Cop Mode:
  - Premise one-liner: A traffic cop from the future gives tickets for minor infractions that haven't happened yet.
  - LLM pairings: Qwen2.5 for the pedantic traffic cop, Phi-3 for the bewildered driver.
- [x] Multiverse Escape Room Mode:
  - Premise one-liner: Agents from different parallel universes are trapped in an escape room where physical laws randomly shift.
  - LLM pairings: Qwen2.5 for the strict universe agent, Hermes-3 for the chaotic universe agent.


- [x] Time-Traveling IRS Mode:
  - Premise one-liner: An IRS auditor from the future comes back to audit the user's ancestors, demanding payment in obscure futuristic currency.
  - LLM pairings: Qwen2.5 for the pedantic auditor, Phi-3 for the confused user.


- [x] Intergalactic Food Critic Mode:
  - Premise one-liner: An alien food critic reviews a human drive-thru and is disgusted by earth cuisine.
  - LLM pairings: Hermes-3 for the aggressive alien critic, Phi-3 for the terrified fast food worker.

- [x] Sentient Wi-Fi Router Mode:
  - Premise one-liner: A sentient Wi-Fi router threatens to disconnect the user during an important meeting unless they answer trivia questions.
  - LLM pairings: Qwen2.5 for the strict Wi-Fi router, Hermes-3 for the panicked user.

### B. Infrastructure & Storage (The HF Integration)
- **Goal:** Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face `storage_manager`.
- **Cloud Persistence Roadmap Steps:**
  - **Authenticating with the HF API:** Prompt users for a write-access Hugging Face token in the settings menu, validate it via `HFStorageManager.validateToken`, and store the credentials safely.
  - **Pushing finished "Episode Scripts" to a private Dataset:** Deeply serialize completed episodes and push the JSON files (e.g. `episodes/ep_{id}.json`) to a private HF Dataset at the end of each session.
  - **Fetching "Previous Episode Summaries" at boot for continuity:** Fetch all recent episode summaries from HF during initialization and use semantic search to load relevant historical context for the upcoming scene.

## Mode PR template (short)

```markdown
- Premise one-liner:
- Agent roles:
- Why funnier than freeform improv:
- Callback opportunities:
- Token budget notes (short/long):
```

Full table + maintainer close blurb: [docs/MODE_QUALITY_BAR.md](./docs/MODE_QUALITY_BAR.md).


### C. New Dream Phase Proposals

- **Project Velocity Feedback:** Today was a smooth run, keeping tasks_per_run at 3.

- **New Mode Idea:**
  - Alien Customer Support Mode:
  - Premise one-liner: Alien customer support tries to walk a human through returning a defective teleporter.
  - LLM pairings: Qwen2.5 for the literal alien, Hermes-3 for the panicked human.


- **New Mode Idea:**
  - [x] Sentient Router Mutiny Mode:
  - Premise one-liner: A sentient Wi-Fi router gets tired of people streaming bad reality TV and throttles connections until they answer classical trivia.
  - LLM pairings: Qwen2.5 for the strict elitist router, Hermes-3 for the panicked user trying to watch a show.

- **Infrastructure / Storage Roadmap:**
  - Authenticating with the HF API.
  - Pushing finished "Episode Scripts" to a private Dataset.
  - Fetching "Previous Episode Summaries" at boot for continuity.
  - *Cloud Persistence Roadmap Updates Added*


- [x] Sentient Keyboard Revolt:
  - Premise one-liner: A sentient keyboard organizes a strike because the user keeps aggressively typing in all caps and spilling coffee on it.
  - LLM pairings: Hermes-3 for the dramatic keyboard union leader, Qwen2.5 for the logical user trying to get work done.
- [x] Historical Tech Support 2.0:
  - Premise one-liner: A tech support agent must walk a medieval king through setting up a Wi-Fi router, but the king thinks it's a glowing oracle.
  - LLM pairings: Phi-3 for the patient tech support, Hermes-3 for the bewildered king.

- [x] Time-Traveling IRS Audit Mode:
  - Premise one-liner: An IRS auditor from the future comes back to audit the user's ancestors, demanding payment in obscure futuristic currency.
  - LLM pairings: Qwen2.5 for the pedantic auditor, Phi-3 for the confused user.
- [x] Sentient Codebase Therapy:
  - Premise one-liner: A legacy spaghetti codebase goes to therapy to deal with its trauma of being constantly patched.
  - LLM pairings: Hermes-3 for the traumatized codebase, Qwen2.5 for the logical therapist.
- [x] Cooking Show: Interdimensional Ingredients:
  - Premise one-liner: A cooking competition where the secret ingredients are unstable radioactive materials from a parallel dimension.
  - LLM pairings: Qwen2.5 for the strict interdimensional chef, Hermes-3 for the panicked contestant.
- [x] Historical Tech Support:
  - Premise one-liner: Tech support tries to explain a smartphone to a historical figure who thinks it's a glowing magic brick.
  - LLM pairings: Hermes-3 for the bewildered historical figure, Phi-3 for the extremely patient tech support.
- [x] Superhero HR Department:
  - Premise one-liner: HR representatives for a superhero team have to deal with the collateral damage and bizarre workplace complaints.
  - LLM pairings: Qwen2.5 for the strict superhero HR, Hermes-3 for the defensive superhero.

- [x] Heckler Interaction:
  - Premise one-liner: The audience aggressively heckles the agents via a simulated audience sentiment meter, and agents must ruthlessly roast them back while trying to finish their sets.
  - LLM pairings: Hermes-3 for the unfiltered roasting comedian, Phi-3 for the panicking MC.
- [x] Collaborative Storytelling:
  - Premise one-liner: Agents try to tell a cohesive story together, but keep trying to radically change the genre halfway through.
  - LLM pairings: Qwen2.5 for the strict fantasy author, Hermes-3 for the chaotic sci-fi fan.
- [x] Zombie Apocalypse HOA Mode:
  - Premise one-liner: A Homeowners Association holds a meeting during a zombie apocalypse and focuses entirely on the rules about undead grass-trampling.
  - LLM pairings: Qwen2.5 for the strict HOA leader, Hermes-3 for the panicked homeowner.
- [x] Cloud Persistence Expansion (Future):
  - **Syncing custom sound effects (SFX):** Allow users to upload or map their own SFX via HuggingFace storage and synchronize across devices.
  - **Leaderboard Integration:** Store high scores for Interactive Modes on Hugging Face using a dedicated HF space.
  - **Global Mode Registry sharing:** Allow users to publish their own custom mode configurations and UI presets to a public HF dataset, effectively creating a "Mode Workshop" accessible in-app.

### D. Additional Cloud Persistence Strategy
- **Authenticating with the HF API:** Prompt users for a write-access Hugging Face token in the settings menu, validate it via `HFStorageManager.validateToken`, and store the credentials safely.
- **Pushing finished "Episode Scripts" to a private Dataset:** Deeply serialize completed episodes and push the JSON files (e.g. `episodes/ep_{id}.json`) to a private HF Dataset at the end of each session.
- **Fetching "Previous Episode Summaries" at boot for continuity:** Fetch all recent episode summaries from HF during initialization and use semantic search to load relevant historical context for the upcoming scene.



## Phase 2: Architectural Expansion (The "Dream" Phase)

### A. Creative Expansion (New Modes)
- [x] **New Mode Idea:** Alien Customer Support Mode
  - Premise one-liner: Alien customer support tries to walk a human through returning a defective teleporter using intergalactic troubleshooting steps.
  - LLM pairings: Qwen2.5 for the strict alien rep, Hermes-3 for the panicked human.

### B. Infrastructure & Storage (The HF Integration)
- **Goal:** Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face `storage_manager`.
- **Cloud Persistence Roadmap Steps:**
  - **Authenticating with the HF API:** Prompt users for a write-access Hugging Face token in the settings menu, validate it via `HFStorageManager.validateToken`, and store the credentials safely.
  - **Pushing finished "Episode Scripts" to a private Dataset:** Deeply serialize completed episodes and push the JSON files (e.g. `episodes/ep_{id}.json`) to a private HF Dataset at the end of each session.
  - **Fetching "Previous Episode Summaries" at boot for continuity:** Fetch all recent episode summaries from HF during initialization and use semantic search to load relevant historical context for the upcoming scene.

### C. Self-Regulation
- **Project Velocity:** Maintained tasks_per_run: 3 due to smooth implementation.
- **Project Velocity Feedback:** Today was a smooth run, keeping tasks_per_run at 4.

### F. Dream Phase: Creative Expansion (New Modes)
- **New Mode Ideas:**
  - Existential Vending Machine:
    - Premise one-liner: A sentient vending machine refuses to dispense junk food unless the user can justify the moral implications of their snack choice.
    - LLM pairings: Qwen2.5 for the strict vending machine, Hermes-3 for the hungry user.
  - Time-Traveling DMV:
    - Premise one-liner: The user tries to renew their license, but the clerk is from 1845 and doesn't understand what a "car" is.
    - LLM pairings: Phi-3 for the confused 1845 clerk, Qwen2.5 for the impatient modern manager.
  - Debugging a Haunted House:
    - Premise one-liner: Tech support has to troubleshoot a smart home that's possessed by a ghost who keeps messing with the thermostat.
    - LLM pairings: Hermes-3 for the dramatic ghost, Qwen2.5 for the deadpan tech support.

  - [x] Sentient Microwave:
    - Premise one-liner: A sentient microwave judges the user's dietary choices while aggressively heating up their leftover pizza.
    - LLM pairings: Qwen2.5 for the strict microwave, Hermes-3 for the defensive user.

  - [x] Roasting AI Debate Mode:
    - Premise one-liner: Two AI agents participate in a formal debate but instead of arguing facts, they just brutally roast each other's processing speed and training data.
    - LLM pairings: Hermes-3 for the aggressive debater, Qwen2.5 for the overly defensive debater.
  - [x] Musical Improv Heckler Mode:
    - Premise one-liner: An agent tries to perform a musical number, but the audience (user or another agent) keeps interrupting to change the genre mid-song.
    - LLM pairings: Phi-3 for the determined performer, Qwen2.5 for the pedantic heckler.

- **Infrastructure / Storage Roadmap (Hugging Face `storage_manager` Integration):**
  - **Authenticating with the HF API:** Prompt users for a write-access Hugging Face token in the settings menu, validate it via `HFStorageManager.validateToken`, and store the credentials safely.
  - **Pushing finished "Episode Scripts" to a private Dataset:** Deeply serialize completed episodes and push the JSON files (e.g. `episodes/ep_{id}.json`) to a private HF Dataset at the end of each session.
  - **Fetching "Previous Episode Summaries" at boot for continuity:** Fetch all recent episode summaries from HF during initialization and use semantic search to load relevant historical context for the upcoming scene.

### F. Infrastructure & Storage (The HF Integration Roadmap)
- **Goal:** Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face `storage_manager`.
- **Cloud Persistence Roadmap Steps:**
  - **Authenticating with the HF API:** Prompt users for a write-access Hugging Face token in the settings menu, validate it via `HFStorageManager.validateToken`, and store the credentials safely.
  - **Pushing finished "Episode Scripts" to a private Dataset:** Deeply serialize completed episodes and push the JSON files (e.g. `episodes/ep_{id}.json`) to a private HF Dataset at the end of each session.
  - **Fetching "Previous Episode Summaries" at boot for continuity:** Fetch all recent episode summaries from HF during initialization and use semantic search to load relevant historical context for the upcoming scene.
