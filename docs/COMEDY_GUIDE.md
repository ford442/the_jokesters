# The Jokesters Comedy Guide

A comprehensive guide for contributors on the comedy system architecture, joke formats, callback system, and quality standards.

## Table of Contents

1. [Joke Database Structure](#joke-database-structure)
2. [Joke Formats](#joke-formats)
3. [Callback System](#callback-system)
4. [Quality Standards](#quality-standards)
5. [Conversation Branching](#conversation-branching)
6. [Writing for 5-Agent Performance](#writing-for-5-agent-performance)
7. [Best Practices](#best-practices)

---

## Joke Database Structure

Jokes are organized into category JSON files in `src/comedy/bits/`:

```
src/comedy/bits/
├── absurdist.json     # Surreal, nonsensical comedy
├── dark_tech.json     # Tech satire, startup culture
└── crowd_work.json    # Audience interaction ad-libs
```

### File Structure

```typescript
interface JokeDatabase {
  title?: string              // Category title
  description: string         // Category description
  tags?: string[]             // Category tags
  bits: JokeBit[]            // Array of jokes
}
```

---

## Joke Formats

### 1. Absurdist Format

For surreal, philosophical, or physics-based comedy.

```json
{
  "setup": "The Comedian claims she invented a new color that's invisible but smells like Tuesday. The Philosopher questions whether Tuesday even has an odor. The Scientist pulls out a spectrophotometer.",
  "punchline": "Scientist: 'According to my calculations, the wavelength of Tuesday is approximately 3.7 regrets per square apology.'",
  "tags": ["color", "time", "invention", "nonsense"],
  "timing_cues": {
    "setup_duration": "slow_burn",
    "punchline_delay": "2s",
    "reaction_type": "confused_silence_then_laugh"
  }
}
```

**Fields**:
- `setup`: Scene description setting up the interaction
- `punchline`: The final zinger (usually Scientist or Comedian)
- `tags`: Searchable keywords for theme matching
- `timing_cues`: Direction for pacing (optional)

### 2. Dark Tech Format (Multi-Agent)

For satirical tech/startup comedy with defined agent roles.

```json
{
  "id": "startup_pivot",
  "title": "The Pivot",
  "topic": "startup culture",
  "setup": "The Scientist asks about the startup's business model.",
  "scientist": "Your 'revolutionary' app has pivoted from food delivery to blockchain-enabled pet meditation to AI-powered sock matching. Can you quantify the value proposition?",
  "comedian": "Our value proposition is that we convinced venture capitalists to give us forty million dollars for an app that does literally nothing but send push notifications saying 'Have you tried being rich?'",
  "philosopher": "The... true... product... was... never... the... app... it... was... the... illusion... of... innovation..."
}
```

**Fields**:
- `id`: Unique identifier for callback tracking
- `title`: Human-readable title
- `topic`: Category for filtering
- `setup`: Context for the bit
- `[agentId]`: Line for specific agent (comedian, philosopher, scientist, techBro, robot)

### 3. Crowd Work Format

For audience interaction with template substitution.

```json
{
  "id": "browser_detect",
  "prompt": "Look at you using {{browser_name}} in the {{time_of_day}}. Bold choice. Very... niche.",
  "tags": ["tech", "observational", "roast"],
  "dynamic_fields": ["browser_name", "time_of_day"]
}
```

**Available Templates**:
- `{{browser_name}}` - Detected browser (Chrome, Firefox, etc.)
- `{{time_of_day}}` - Current time period (morning, afternoon, evening, night)
- `{{user_location}}` - Approximate location from timezone

---

## Callback System

### Overview

The callback system tracks running gags throughout a scene to enable "callback humor" — referencing earlier jokes for comedic effect.

```
Comedy Theory: Callbacks get funnier up to a point, then become annoying

1st callback: Establishing the gag (fresh)
2nd callback: Building momentum
3rd callback: PEAK - maximum hilarity
4th callback: Still good but fading
5th+ callback: Dead horse, stop beating
```

### Decay Curve

```
Value
  │
1.5 ┤       ╭─╮         Peak at 3rd use
    │      ╱   ╲
1.2 ┤     ╱     ╲       Building
    │    ╱       ╲
1.0 ┤───╱         ╲____ Fresh / Established
    │                  ╲___
0.6 ┤                      Declining
    │
0.2 ┤__________________   Dead (retire)
    └────┬───┬───┬───┬───┬───┬───► Uses
         1   2   3   4   5   6

Status: fresh → building → peak → declining → dead
```

### Implementation

**Registering a Joke**:

```typescript
import { CallbackEngine } from './comedy/callbackEngine'

const engine = new CallbackEngine()

// Register with themes for later retrieval
engine.registerJoke('banana-peel', 
  ['slapstick', 'fruit', 'falling'],
  'Comedian slipped on a banana'
)
```

**Recording a Callback**:

```typescript
// When an agent references a previous joke
engine.recordCallback('banana-peel')

// Check current value
const metrics = engine.getCallbackMetrics('banana-peel')
// metrics.value: 0.0 - 1.5
// metrics.status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead'
// metrics.timesUsed: number of callbacks
// metrics.recommended: should we use this now?
```

**Finding Callbacks by Theme**:

```typescript
// Get all jokes related to a theme
const techJokes = engine.findByTheme('tech')

// Get best callback recommendation
const best = engine.getBestCallbackForTheme('startup')
// Returns joke at peak value or building momentum
```

### Visual Feedback

When callbacks are triggered, the system provides visual feedback:

| Status | Visual Indicator |
|--------|-----------------|
| `fresh` | Subtle glow |
| `building` | Growing particles |
| `peak` | Fire effect + "🔥 PEAK" badge |
| `declining` | Fading particles |
| `dead` | Grayed out, skull icon |

---

## Quality Standards

### The Surprise Metric

Jokes are rated on a 1-10 scale based on four components:

```typescript
interface SurpriseMetrics {
  subversionScore: number      // 35% weight
  wordplayScore: number        // 25% weight
  timingScore: number          // 20% weight
  originalityScore: number     // 20% weight
}
```

### Rating Criteria

| Score | Description | Action |
|-------|-------------|--------|
| 9-10 | Exceptional | Use immediately, consider for callback |
| 7-8 | Good | Use, no changes needed |
| 6 | Acceptable | Use with minor tweaks |
| 4-5 | Weak | Inject quality prompt, retry |
| 1-3 | Poor | Replace with alternative from database |

### Scoring Patterns

**Subversion Patterns** (+points):
- "I thought X, but actually Y" structure
- "Wait!" / "What?" / "Plot twist"
- Expectation reversal

**Wordplay Patterns** (+points):
- "Sounds like" / "Rhymes with"
- Double meanings
- Q&A patterns ("Dog? No, dog!")

**Timing Patterns** (+points):
- Ellipsis pause before punchline
- Clear setup-punchline structure
- Classic joke questions ("Why did...")

**Originality Penalties** (-points):
- "Walks into a bar" format
- "To get to the other side"
- "That's what she said"
- Overused AI tropes

### Quality Gate Usage

```typescript
import { QualityGate } from './Director/modes/ImprovMode'

const qualityGate = new QualityGate()

// Assess generated response
const assessment = qualityGate.assessQuality(response)

if (!assessment.passed) {
  // Response scored < 6/10
  const fixPrompt = qualityGate.getQualityPrompt(assessment.score)
  // Inject: "(SYSTEM: Add a twist or subvert expectations!)"
}
```

---

## Conversation Branching

### The 4-Layer Tree

Conversations follow a tree structure to prevent circular or exhausted topics:

```
Layer 0: Root Topic
    │
    ├── Layer 1: Direction A
    │       │
    │       ├── Layer 2: Aspect 1
    │       │       │
    │       │       └── Layer 3: Detail X (Max depth)
    │       │
    │       └── Layer 2: Aspect 2
    │
    └── Layer 1: Direction B
            │
            └── Layer 2: Aspect 3
```

### Sentiment-Driven Navigation

Audience reactions drive topic changes:

| Reaction | Intensity | Strategy | Result |
|----------|-----------|----------|--------|
| 👏 Cheer | > 0.7 | `double_down` | Stay deeper on current topic |
| 👎 Boo | > 0.5 | `pivot` | Switch to new topic |
| 😐 Neutral | any | `continue` | Keep current direction |
| (4 turns) | - | `escalate` | Move to child or pivot |

### Code Example

```typescript
import { 
  createConversationTree, 
  evaluateSentiment, 
  advanceTree,
  recordSentiment 
} from './improv/branching'

// Initialize tree
const tree = createConversationTree("Why do hotdogs come in packs of 10?")

// Record audience reaction
recordSentiment(tree, { type: 'cheer', intensity: 0.8, timestamp: Date.now() })

// Evaluate and decide
const decision = evaluateSentiment(tree, recentEvents)
// decision.strategy: 'double_down' (because cheer > 0.7)
// decision.suggestedPrompt: "(SYSTEM: The audience LOVES this. Dig deeper!)"

// Advance tree based on decision
advanceTree(tree, decision)
```

---

## Writing for 5-Agent Performance

### Agent Voice Guide

| Agent | Speaking Style | Interrupts? | Tendencies |
|-------|---------------|-------------|------------|
| **Comedian** | Fast, frantic, rambling | Constantly | Sets up jokes, physical humor |
| **Tech Bro** | Buzzword-heavy, confident | Always | Hijacks topics, one-ups everyone |
| **Scientist** | Dry, literal, analytical | Rarely | Misses jokes, provides data |
| **Robot** | Deadpan, mechanical, slow | Never | Literal interpretations, timing cues |
| **Philosopher** | Very... slow... judgmental | When ignored | Ponders meaning, criticizes others |

### Multi-Agent Bit Structure

**The Setup-Response-Pile-on Pattern**:

```
Comedian:    [Introduces absurd premise]
Tech Bro:    [Relates it to his startup]
Scientist:   [Analyzes it literally]
Robot:       [Deadpan observation with timing cue]
Philosopher: [Slow judgment of everyone]
Comedian:    [Punchline that ties it together]
```

**Example Flow**:

```
Comedian: "I invented an app that delivers existential dread!"
Tech Bro: "That's basically mindfulness with a subscription model. We're pivoting to that."
Scientist: "Existential dread cannot be quantified, but studies show 73% of users experience it."
Robot: "[processing...] I have calculated your dread. [pause 2s] It is... sufficient."
Philosopher: "The... app... does... not... create... dread... it... merely... reveals... what... was... always... there..."
Comedian: "Five stars! Would question my life choices again!"
```

### Timing Cues for Robot

Use these markers in Robot lines for synchronized animation:

| Cue | Duration | Effect |
|-----|----------|--------|
| `[pause 2s]` | 2 seconds | Head tilt, silence |
| `[processing...]` | Variable | Processing animation |
| `[whirring noise]` | Short | Mechanical sound |
| `[error beep]` | Short | Error indicator |
| `[calculating...]` | Variable | Thinking animation |

### Conflict Patterns

Good 5-agent scenes thrive on conflict:

1. **Tech Bro vs. Scientist**: Hype vs. data
2. **Comedian vs. Philosopher**: Chaos vs. order
3. **Robot vs. Everyone**: Literal vs. figurative
4. **All vs. Tech Bro**: Mocking buzzwords
5. **All vs. Philosopher**: Impatience with slowness

---

## Best Practices

### Writing Jokes

1. **Tag Generously**: Add 3-5 tags per joke for callback matching
2. **Use IDs for Dark Tech**: Always include unique IDs for callback tracking
3. **Vary Length**: Mix short zingers with longer setups
4. **Agent Appropriateness**: Match content to agent persona
5. **Theme Consistency**: Group related bits in same file

### Example: Complete Bit Contribution

```json
{
  "id": "quantum_coffee",
  "title": "Quantum Coffee Shop",
  "topic": "quantum_physics",
  "setup": "The Comedian claims her coffee exists in all states of temperature simultaneously.",
  "comedian": "I don't need to drink it, I just observe it and collapse the wave function into CAFFEINE!",
  "philosopher": "If... the... coffee... is... both... hot... and... cold... until... observed... then... the... barista... is... God...",
  "scientist": "Superposition doesn't work that way. However, I have calculated you consume 47% more caffeine than medically advisable.",
  "techBro": "This is basically what we're doing at my startup. Quantum-enabled coffee disruption. Pre-seed funding open!",
  "robot": "[calculating...] Your coffee temperature is 72.3 degrees. [pause 2s] This is... room temperature. You have been... scammed."
}
```

### Testing New Content

1. Run in Improv Mode with relevant seed topic
2. Check console for quality scores
3. Verify callbacks register correctly
4. Test with all 5 agents active
5. Check TTS rendering (homograph issues)

### File Organization

```
src/comedy/bits/
├── your_category.json        # New category file
│   ├── title                 # Category name
│   ├── description           # What it's about
│   ├── tags                  # ["your", "tags"]
│   └── bits[]                # Array of jokes
│       ├── id                # Unique identifier
│       ├── topic             # Filter category
│       ├── setup             # Scene context
│       └── [agent lines]     # Per-agent content
```

### Integration Checklist

- [ ] JSON is valid (run through validator)
- [ ] All agents referenced exist in `agents.ts`
- [ ] IDs are unique across all files
- [ ] Tags are lowercase, no spaces
- [ ] Timing cues use valid markers (Robot bits)
- [ ] Templates use valid placeholders (Crowd work bits)
- [ ] Added to `jokeLoader.ts` switch statement
- [ ] Updated `JokeCategory` type if new category

---

## Quick Reference

### Joke Format Decision Tree

```
Writing a new bit?
        │
        ├── Single punchline, surreal?
        │   └── Use Absurdist format
        │
        ├── Multi-agent, tech satire?
        │   └── Use Dark Tech format
        │
        ├── Audience-specific, interactive?
        │   └── Use Crowd Work format
        │
        └── Mixed or other?
            └── Extend JokeBit interface
```

### Callback Value Reference

| Use | Value | Status | Recommendation |
|-----|-------|--------|----------------|
| 0 (new) | 1.0 | fresh | Establish the gag |
| 1 | 1.2 | building | Use for callback |
| 2 | 1.5 | **peak** | **BEST TIME - USE NOW** |
| 3 | 1.1 | declining | Use sparingly |
| 4 | 0.6 | declining | Almost dead |
| 5+ | 0.2 | dead | Retire the gag |

### Quality Score Breakdown

```
Final Score = (subversion × 0.35) 
            + (wordplay × 0.25) 
            + (timing × 0.20) 
            + (originality × 0.20)

Target: 7+ for main bits, 6+ for filler
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [AGENTS.md](../AGENTS.md) - Agent configuration
- `src/comedy/bits/` - Example joke files
- `src/comedy/qualityFilter.ts` - Quality scoring implementation
- `src/comedy/callbackEngine.ts` - Callback system implementation
