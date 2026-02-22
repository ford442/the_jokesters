# Wave 1 Integration Log

**Date:** 2026-02-22  
**Project:** The Jokesters - Multi-Agent Comedy Platform  
**Scope:** Integration of Wave 1 content (personas, joke databases, improv systems)

---

## 1. Persona Registration (src/config/agents.ts)

### Changes Made:
- Imported `techBro.txt` and `robot.txt` using Vite's `?raw` import feature
- Added 2 new `AgentConfig` entries:
  - **Chad Vanderblock (techBro)**: Orange (#FF6B35), high energy tech bro persona
  - **Unit-734 (robot)**: Silver (#C0C0C0), deadpan robot with malfunctioning humor chip
- Added default model mappings for new personas using Hermes model
- Added helper functions: `getAgentById()`, `getAgentIds()`, `isValidAgentId()`

### Connections:
```
techBro.txt ──┐
              ├─► agents.ts ──► GroupChatManager ──► Director
robot.txt ────┘
```

### Color Mapping:
| Agent | Color | Hex Code |
|-------|-------|----------|
| Comedian | Coral Red | #ff6b6b |
| Philosopher | Teal | #4ecdc4 |
| Scientist | Sky Blue | #45b7d1 |
| **Tech Bro** | **Orange** | **#FF6B35** |
| **Robot** | **Silver** | **#C0C0C0** |

---

## 2. Joke Database Integration (src/comedy/jokeLoader.ts)

### New Module Created:
- **Location:** `src/comedy/jokeLoader.ts`
- **Purpose:** Centralized joke loading and template substitution

### Features:
- Imports 3 JSON databases:
  - `absurdist.json` - Surreal/absurdist comedy bits
  - `dark_tech.json` - Dark humor about tech culture
  - `crowd_work.json` - Interactive audience engagement prompts

### API:
```typescript
getRandomJoke(category?: JokeCategory, context?: Partial<TemplateContext>): JokeBit
getJokeById(id: string): JokeBit | null
getAllJokes(category: JokeCategory): JokeBit[]
searchJokesByTag(tag: string): JokeBit[]
getJokeStats(): { total, byCategory, tags }
```

### Browser API Integration:
```
getTemplateContext()
  ├─► detectBrowser() ──► navigator.userAgent
  ├─► getTimeOfDay() ───► Date.now()
  └─► getApproximateLocation() ──► Intl.DateTimeFormat().resolvedOptions().timeZone
```

### Template Substitution:
- `{{browser_name}}` → "Chrome", "Firefox", etc.
- `{{time_of_day}}` → "morning", "afternoon", "evening", "night"
- `{{user_location}}` → Approximated from timezone

### Connections:
```
absurdist.json ──┐
dark_tech.json ──┼─► jokeLoader.ts ──► ImprovMode (quality fallback)
crowd_work.json ─┘                         └──► GroupChatManager
```

---

## 3. Improv System Hookup (src/Director/modes/ImprovMode.ts)

### Major Refactoring:
Rewrote `runImprovLoop()` and `runAutonomousLoop()` to integrate:

#### A. Branching Logic (`branching.ts`)
- **4-layer conversation tree** with sentiment-driven branching
- **Double down** on topics when crowd cheers (>0.7 intensity)
- **Pivot** to new topics when crowd boos (>0.5 intensity)
- **Continue/escalate** based on conversation depth

#### B. Sentiment Injection
```
Audience Reaction (UI) ──► SentimentTracker ──► recordSentiment(tree, event)
                                                    │
                                                    ▼
                                              evaluateSentiment() ──► Strategy decision
                                                    │
                                                    ▼
                                              advanceTree() ──► New prompt
```

#### C. Callback Engine Integration
- Tracks running gags across 10-turn sessions
- **Bell curve decay:** 1st callback (1.0) → 3rd callback (1.5 peak) → 6th+ (0.2 dead)
- Injects callback prompts when jokes reach "peak" status
- Registers themes automatically from agent responses

### New Classes:
| Class | Purpose |
|-------|---------|
| `SentimentTracker` | Records sentiment events, routes to branching tree |
| `QualityGate` | Filters responses, fetches alternatives if score < 6 |
| `CallbackManager` | Wraps CallbackEngine for improv session management |

### Flow:
```
Improv Session (10 turns max)
  │
  ├─► SentimentTracker records audience reactions
  │       │
  │       ▼
  ├─► Branching Tree evaluates every 2 turns
  │       │
  │       ├─► CHEER > 0.7 → Double down prompt
  │       ├─► BOO > 0.5 → Pivot to new topic
  │       └─► Neutral → Continue/Escalate
  │
  ├─► QualityGate assesses each response
  │       │
  │       └─► Score < 6 → Fetch alternative from jokeLoader
  │
  ├─► CallbackManager tracks themes
  │       │
  │       └─► 30% chance to inject callback at peak (3rd use)
  │
  └─► Turn counter increments (max 10)
```

### Connections:
```
branching.ts ─────┐
callbackEngine.ts ┼─► ImprovMode.ts ──► Director ──► UI
qualityFilter.ts ─┘
```

---

## 4. Quality Gate (src/comedy/qualityFilter.ts)

### Integration Points:

#### A. Response Pipeline
`ImprovMode.ts` now calls `processTurnWithQuality()` instead of direct `processTurn()`:

```typescript
const assessment = qualityGate.assessQuality(responseText);
if (!assessment.passed && assessment.alternative) {
  // Inject quality improvement prompt or use alternative joke
}
```

#### B. Rating System
- Scores 1-10 based on surprise metrics:
  - Subversion (35%): Expectation subversion
  - Wordplay (25%): Puns, double meanings
  - Timing (20%): Setup/punchline structure
  - Originality (20%): Novelty factor

#### C. Fallback Chain
```
Response Generated
       │
       ▼
rateJoke(response) ──► Score < 6?
       │                    │
       │ YES                │ NO
       ▼                    ▼
  Fetch alternative    Use response
  from jokeLoader
       │
       ▼
  Inject qualityPrompt()
```

### Threshold:
- **QUALITY_THRESHOLD = 6**
- Jokes scoring below 6 trigger fallback mechanism
- Max 3 fallback attempts per turn to prevent infinite loops

---

## 5. Crowd Work Template Engine

### Implementation:
Located in `src/comedy/jokeLoader.ts`:

```typescript
function substituteTemplate(template: string, context?: TemplateContext): string {
  return template
    .replace(/\{\{browser_name\}\}/g, ctx.browser_name)
    .replace(/\{\{time_of_day\}\}/g, ctx.time_of_day)
    .replace(/\{\{user_location\}\}/g, ctx.user_location);
}
```

### Browser APIs Used:
| Variable | API | Example Output |
|----------|-----|----------------|
| `{{browser_name}}` | `navigator.userAgent` | "Chrome", "Firefox" |
| `{{time_of_day}}` | `new Date().getHours()` | "morning" (5-12h) |
| `{{user_location}}` | `Intl.DateTimeFormat().resolvedOptions().timeZone` | "New York" |

### Usage Flow:
```
crowd_work.json template
       │
       ▼
getRandomCrowdWorkJoke()
       │
       ├─► detectBrowser() ──► "Chrome"
       ├─► getTimeOfDay() ───► "evening"
       └─► getApproximateLocation() ──► "New York"
       │
       ▼
substituteTemplate()
       │
       ▼
Final output: "It's evening in New York and you're on Chrome..."
```

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE JOKESTERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   UI Layer      │    │   Director      │    │   Agents    │ │
│  │   (main.ts)     │◄──►│   (Director.ts) │◄──►│ (agents.ts) │ │
│  └────────┬────────┘    └────────┬────────┘    └─────────────┘ │
│           │                      │                              │
│           ▼                      ▼                              │
│  ┌─────────────────────────────────────────┐                   │
│  │         ImprovMode.ts                  │                   │
│  │  ┌─────────────┐  ┌─────────────┐      │                   │
│  │  │ Sentiment   │  │   Branching │      │                   │
│  │  │ Tracker     │  │   Tree      │◄─────┼─── branching.ts   │
│  │  └─────────────┘  └─────────────┘      │                   │
│  │  ┌─────────────┐  ┌─────────────┐      │                   │
│  │  │  Quality    │  │   Callback  │      │                   │
│  │  │   Gate      │  │   Manager   │◄─────┼─── callbackEngine │
│  │  └──────┬──────┘  └─────────────┘      │                   │
│  │         │                              │                   │
│  │         ▼                              │                   │
│  │  ┌─────────────┐                       │                   │
│  │  │ jokeLoader  │◄──────────────────────┼─── *.json bits    │
│  │  └─────────────┘                       │                   │
│  └─────────────────────────────────────────┘                   │
│           │                                                    │
│           ▼                                                    │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  qualityFilter  │    │ GroupChatManager│                   │
│  │   rateJoke()    │    │   (WebLLM)      │                   │
│  └─────────────────┘    └─────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Modified/Created

### Modified:
1. `src/config/agents.ts` - Added Tech Bro and Robot personas
2. `src/Director/modes/ImprovMode.ts` - Integrated branching, quality gate, callbacks

### Created:
1. `src/comedy/jokeLoader.ts` - Joke database loader with template engine
2. `docs/integration-log.md` - This document

### Existing Dependencies Used:
1. `src/improv/branching.ts` - Conversation tree management
2. `src/comedy/callbackEngine.ts` - Running gag tracking
3. `src/comedy/qualityFilter.ts` - Joke quality assessment
4. `src/prompts/techBro.txt` - Tech Bro persona prompt
5. `src/prompts/robot.txt` - Robot persona prompt
6. `src/comedy/bits/absurdist.json` - Absurdist comedy database
7. `src/comedy/bits/dark_tech.json` - Dark tech comedy database
8. `src/comedy/bits/crowd_work.json` - Crowd work templates

---

## Testing Recommendations

1. **Persona Testing:**
   - Verify Tech Bro uses buzzwords and startup speak
   - Verify Robot uses [pause] and [processing...] tags
   - Check colors render correctly (Orange #FF6B35, Silver #C0C0C0)

2. **Joke Loader Testing:**
   - Call `getRandomJoke()` for each category
   - Verify template substitution works in crowd_work
   - Check `getTemplateContext()` returns valid browser/time

3. **Improv Mode Testing:**
   - Start improv mode, verify 10-turn limit
   - Trigger sentiment events (cheer/boo) and verify branching
   - Check callback engine logs for running gags

4. **Quality Gate Testing:**
   - Intentionally generate weak responses
   - Verify fallback to jokeLoader when score < 6
   - Check console for quality ratings

---

## Notes

- The integration uses Vite's `?raw` import for loading text files (requires Vite environment)
- All new code follows existing TypeScript strict mode conventions
- Quality threshold set to 6 (configurable in ImprovMode.ts)
- Max improv turns set to 10 (configurable in ImprovMode.ts)
