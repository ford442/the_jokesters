# Reporter Mode Improvement Plan

## Current State Analysis

### What Works
1. **Basic Topic Discussion**: Agents can discuss a topic with injected Wikipedia context
2. **Custom Article Pasting**: Users can paste their own article text for discussion
3. **Category Suggestions**: Pre-defined topic suggestions per category (science, news, technology, sports)
4. **Context Re-injection**: Context is re-injected every 3 turns to keep discussion on-topic

### Current Limitations
1. **Data Source**: Only uses Wikipedia (fallback when NewsAPI isn't configured)
2. **No Multi-source Aggregation**: Cannot combine multiple sources for richer context
3. **Limited Discussion Depth**: Simple round-robin with periodic context reminders
4. **No Structured Format**: Discussions can drift; no defined segments (intro, main discussion, conclusion)
5. **Static Context**: Once fetched, the context doesn't update during the discussion
6. **No Fact-checking**: Agents may hallucinate beyond the provided context
7. **Missing Visual Elements**: No headline display, source attribution, or "news ticker" feel

---

## Proposed Improvements

### 1. Enhanced Data Sources (Phase 1)

#### 1.1 Multiple Free News APIs
Implement fallback chain for news fetching:
- **Wikipedia** (current) - for background knowledge
- **Wikinews API** - for actual news content
- **GDELT Project** (free tier) - for global news events
- **Reddit RSS** (r/news, r/science, r/technology) - trending topics
- **Hacker News API** - for technology stories
- **Custom RSS Feed Parser** - allow users to add their own feeds

#### 1.2 News Aggregation & Summarization
```typescript
// New interface for enriched context
interface EnrichedNewsContext {
  headline: string;
  summary: string;
  keyFacts: string[];
  sources: string[];
  relatedTopics: string[];
  publishDate?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}
```

### 2. Structured Discussion Format (Phase 1)

Implement a "News Show" structure with distinct segments:

```typescript
interface ReporterSegment {
  type: 'intro' | 'headlines' | 'main_story' | 'panel_discussion' | 'fact_check' | 'closing';
  speakerRole?: 'anchor' | 'reporter' | 'analyst' | 'expert';
  promptInjection: string;
  maxTurns: number;
}
```

**Segment Flow:**
1. **Intro** (1 turn) - Comedian introduces the show with a joke about the topic
2. **Headlines** (1 turn) - Philosopher reads the main headline seriously
3. **Main Story** (3-4 turns) - Scientist presents facts, others react
4. **Panel Discussion** (4-6 turns) - Free-form debate on implications
5. **Fact Check** (1 turn) - Scientist verifies claims made during discussion
6. **Closing** (1 turn) - Comedian makes a final joke

### 3. Dynamic Context Updates (Phase 2)

#### 3.1 Real-time Fact Injection
During discussion, inject "breaking updates" or fact-checks:
```typescript
// In runReporterLoop
if (turnCount === 5) {
    const factCheck = await this.generateFactCheck(lastFewTurns);
    prompt = `(FACT CHECK: ${factCheck} Respond naturally.)`;
}
```

#### 3.2 Agent Memory of Facts
Track claims made by each agent and have others reference them:
```typescript
private claimTracker: Map<string, string[]> = new Map();
// Inject: "Earlier, the Comedian claimed X. What's your response?"
```

### 4. Interactive Elements (Phase 2)

#### 4.1 User as "Caller"
Allow user to submit questions during the discussion:
- Hotkey or button to "Call in" with a question
- Director injects: `(A viewer asks: "${userQuestion}")`

#### 4.2 Breaking News Interrupt
Random chance (controlled by chaos slider) for "Breaking News" interruption:
```typescript
if (Math.random() * 100 < this.chaosLevel / 2) {
    const breakingNews = await this.fetchBreakingNews(topic);
    prompt = `(BREAKING: ${breakingNews} React with surprise!)`;
}
```

### 5. Visual Enhancements (Phase 2)

#### 5.1 News Ticker UI
Add a scrolling ticker at the bottom showing:
- Current topic headline
- Related factoids
- Source attribution

#### 5.2 Agent Role Badges
Visual indicator of current role:
- Comedian = "Host" badge
- Philosopher = "Commentator" badge  
- Scientist = "Fact Checker" badge

### 6. Content Quality Improvements (Phase 1)

#### 6.1 Better Prompt Engineering
Current prompt formatting is basic. Improved version:
```typescript
formatForPrompt(articles: NewsArticle[], topic: string): string {
    return `(NEWS BRIEFING - ${new Date().toLocaleDateString()}
    
TOPIC: "${topic}"
HEADLINE: ${articles[0].title}
KEY POINTS:
${articles.map(a => `- ${a.description}`).join('\n')}

YOUR ROLE: You are a panelist on a news comedy show. Be informative but entertaining.
TONE: Witty, conversational, slightly irreverent but respectful of facts.
CONSTRAINT: Base your comments on the provided information, but feel free to speculate humorously on implications.)`;
}
```

#### 6.2 Source Diversity Scoring
Fetch from multiple sources and merge:
```typescript
async fetchAggregatedNews(topic: string): Promise<EnrichedNewsContext> {
    const [wikiData, redditData, hnData] = await Promise.allSettled([
        this.fetchWikiSummary(topic),
        this.fetchRedditDiscussions(topic),
        this.fetchHackerNews(topic)
    ]);
    // Merge and deduplicate information
}
```

---

## Implementation Roadmap

### Phase 1: Core Improvements (1-2 days)
- [ ] Fix syntax errors in Director.ts
- [ ] Add `ScriptBeat` interface to Scenario type
- [ ] Implement structured discussion segments
- [ ] Improve prompt formatting in DataFetchService
- [ ] Add Reddit/HN as fallback news sources
- [ ] Create segment-based prompt injection

### Phase 2: Enhanced Interactivity (2-3 days)
- [ ] Add "Breaking News" chaos injection
- [ ] Implement user "call-in" feature
- [ ] Add claim tracking and fact-check segment
- [ ] Create news ticker UI component
- [ ] Add agent role badges

### Phase 3: Advanced Features (3-5 days)
- [ ] RSS feed parser for custom sources
- [ ] Real-time sentiment analysis of discussion
- [ ] Auto-generated episode summary
- [ ] Multi-topic show format (3 topics in sequence)
- [ ] Export discussion as "Episode Script"

---

## Code Changes Required

### 1. Update Scenario Interface
```typescript
// In Director.ts
interface Scenario {
    // ... existing fields
    config?: {
        // ... existing fields
        reporterSegments?: ReporterSegment[];
        enableBreakingNews?: boolean;
        enableUserCallIns?: boolean;
    };
}
```

### 2. Enhanced DataFetchService
```typescript
// New methods to add
- fetchRedditDiscussions(topic: string): Promise<NewsArticle[]>
- fetchHackerNews(topic: string): Promise<NewsArticle[]>
- fetchRSSFeed(url: string): Promise<NewsArticle[]>
- aggregateSources(sources: NewsArticle[][]): EnrichedNewsContext
```

### 3. Updated runReporterLoop
```typescript
private async runReporterLoop(scenario: Scenario) {
    const segments = scenario.config?.reporterSegments || this.getDefaultSegments();
    
    for (const segment of segments) {
        if (!this.isRunning) break;
        await this.executeSegment(segment, scenario);
    }
}
```

---

## Immediate Quick Wins

These improvements can be implemented immediately with minimal changes:

1. **Better Prompt Formatting** - Update `formatForPrompt()` with clearer structure
2. **Add Hacker News Source** - Simple fetch from `https://hn.algolia.com/api/v1/search`
3. **Segment Injection** - Add 3 distinct phases to reporter loop
4. **Source Attribution** - Show which source data came from
5. **Timestamp Context** - Include current date in prompts for relevance

---

## Mockup: Improved Reporter Mode Flow

```
┌─────────────────────────────────────────────────────────────┐
│  📰 THE JOKESTERS NEWS HOUR                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Comedian] 🎤 HOST                                         │
│  "Welcome to the News Hour! Tonight: AI Takes Over...       │
│   the Kitchen?"                                             │
│                                                             │
│  [Philosopher] 📰 ANCHOR                                    │
│  "Our top story: A new AI system can now cook              │
│   Michelin-star meals. But should it?"                      │
│                                                             │
│  [Scientist] 🔬 EXPERT                                      │
│  "The system uses 47 sensors to monitor taste              │
│   profiles with 99.2% accuracy..."                          │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│  📊 FACT CHECK: "AI cannot actually taste - it              │
│     only measures chemical composition"                     │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  [Ticker] AI Cooking | Robot Chefs | Future of Food        │
└─────────────────────────────────────────────────────────────┘
```
