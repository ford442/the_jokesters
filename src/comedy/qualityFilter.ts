/**
 * Quality Filter Module
 * 
 * Provides joke quality assessment and TTS text preprocessing.
 * - Rates jokes on a 1-10 surprise metric
 * - Flags homograph issues for TTS correction
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface JokeRating {
  score: number;           // 1-10 overall surprise rating
  surpriseMetrics: SurpriseMetrics;
  suggestions: string[];
}

export interface SurpriseMetrics {
  subversionScore: number;      // 1-10: How much it subverts expectations
  wordplayScore: number;        // 1-10: Presence of puns, double meanings
  timingScore: number;          // 1-10: Setup/punchline effectiveness
  originalityScore: number;     // 1-10: Novelty factor
}

export interface HomographIssue {
  word: string;
  position: number;
  context: string;
  possiblePronunciations: string[];
  suggestedReplacement: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TTSAnalysisResult {
  originalText: string;
  cleanedText: string;
  issues: HomographIssue[];
  hasHomographs: boolean;
}

// =============================================================================
// HOMOGRAPH DATABASE
// =============================================================================

interface HomographEntry {
  pronunciations: string[];
  contexts?: string[];     // Context hints for disambiguation
  defaultIndex: number;    // Default pronunciation index
}

const HOMOGRAPH_DB: Record<string, HomographEntry> = {
  // Verb/Noun pairs
  'read': {
    pronunciations: ['reed', 'red'],
    contexts: ['present tense', 'past tense'],
    defaultIndex: 0
  },
  'lead': {
    pronunciations: ['leed', 'led'],
    contexts: ['to guide', 'metal Pb'],
    defaultIndex: 0
  },
  'wind': {
    pronunciations: ['wind', 'wynd'],
    contexts: ['air movement', 'to turn/twist'],
    defaultIndex: 0
  },
  'tear': {
    pronunciations: ['teer', 'tair'],
    contexts: ['from eye', 'to rip'],
    defaultIndex: 0
  },
  'bow': {
    pronunciations: ['bow', 'boh'],
    contexts: ['front of ship/weapon', 'to bend/respect'],
    defaultIndex: 1
  },
  'close': {
    pronunciations: ['klohz', 'klohs'],
    contexts: ['to shut', 'nearby'],
    defaultIndex: 0
  },
  'live': {
    pronunciations: ['liv', 'lyv'],
    contexts: ['to be alive', 'happening now'],
    defaultIndex: 0
  },
  'use': {
    pronunciations: ['yooz', 'yoos'],
    contexts: ['verb: to utilize', 'noun: the act of using'],
    defaultIndex: 0
  },
  'record': {
    pronunciations: ['ri-kord', 'rek-erd'],
    contexts: ['verb: to capture', 'noun: vinyl/document'],
    defaultIndex: 1
  },
  'present': {
    pronunciations: ['prez-ent', 'pri-zent'],
    contexts: ['gift/time now', 'to show/give'],
    defaultIndex: 0
  },
  'object': {
    pronunciations: ['ob-jekt', 'uhb-jekt'],
    contexts: ['noun: thing', 'verb: to oppose'],
    defaultIndex: 0
  },
  'refuse': {
    pronunciations: ['ref-yoos', 'ri-fyooz'],
    contexts: ['noun: trash', 'verb: to decline'],
    defaultIndex: 1
  },
  'desert': {
    pronunciations: ['dez-ert', 'di-zurt'],
    contexts: ['sandy wasteland', 'to abandon'],
    defaultIndex: 0
  },
  'contract': {
    pronunciations: ['kon-trakt', 'kuhn-trakt'],
    contexts: ['legal agreement', 'to shrink/draw together'],
    defaultIndex: 0
  },
  'console': {
    pronunciations: ['kon-sohl', 'kuhn-sohl'],
    contexts: ['gaming device', 'to comfort'],
    defaultIndex: 0
  },
  'permit': {
    pronunciations: ['pur-mit', 'per-mit'],
    contexts: ['noun: license', 'verb: to allow'],
    defaultIndex: 1
  },
  'insult': {
    pronunciations: ['in-suhlt', 'in-suhlt'],
    contexts: ['noun: offense', 'verb: to offend'],
    defaultIndex: 0
  },
  'increase': {
    pronunciations: ['in-krees', 'in-krees'],
    contexts: ['verb: to grow', 'noun: growth'],
    defaultIndex: 0
  },
  'decrease': {
    pronunciations: ['di-krees', 'dee-krees'],
    contexts: ['verb: to reduce', 'noun: reduction'],
    defaultIndex: 0
  },
  'progress': {
    pronunciations: ['prog-res', 'pruh-gres'],
    contexts: ['noun: advancement', 'verb: to move forward'],
    defaultIndex: 0
  },
  // Additional common TTS problem words
  'invalid': {
    pronunciations: ['in-val-id', 'in-vuh-lid'],
    contexts: ['not valid', 'disabled person (archaic)'],
    defaultIndex: 0
  },
  'separate': {
    pronunciations: ['sep-er-it', 'sep-uh-reyt'],
    contexts: ['adjective: distinct', 'verb: to divide'],
    defaultIndex: 0
  },
  'advocate': {
    pronunciations: ['ad-vuh-kit', 'ad-vuh-keyt'],
    contexts: ['noun: supporter', 'verb: to support'],
    defaultIndex: 0
  },
  'associate': {
    pronunciations: ['uh-soh-shee-it', 'uh-soh-shee-eyt'],
    contexts: ['noun: colleague', 'verb: to connect'],
    defaultIndex: 0
  },
  'duplicate': {
    pronunciations: ['doo-pli-kit', 'doo-pli-keyt'],
    contexts: ['noun: copy', 'verb: to copy'],
    defaultIndex: 0
  },
  'estimate': {
    pronunciations: ['es-tuh-mit', 'es-tuh-meyt'],
    contexts: ['noun: approximation', 'verb: to approximate'],
    defaultIndex: 0
  },
  'minute': {
    pronunciations: ['min-it', 'mahy-noot'],
    contexts: ['60 seconds', 'very small'],
    defaultIndex: 0
  },
  'content': {
    pronunciations: ['kon-tent', 'kuhn-tent'],
    contexts: ['noun: what is inside', 'adjective: satisfied'],
    defaultIndex: 0
  },
  'conduct': {
    pronunciations: ['kon-duhkt', 'kuhn-duhkt'],
    contexts: ['noun: behavior', 'verb: to lead/direct'],
    defaultIndex: 0
  },
  'conflict': {
    pronunciations: ['kon-flikt', 'kuhn-flikt'],
    contexts: ['noun: clash/fight', 'verb: to clash'],
    defaultIndex: 0
  },
  'combat': {
    pronunciations: ['kom-bat', 'kuhm-bat'],
    contexts: ['noun: fighting', 'verb: to fight against'],
    defaultIndex: 0
  },
  'extract': {
    pronunciations: ['ek-strakt', 'ik-strakt'],
    contexts: ['noun: substance derived', 'verb: to remove/pull out'],
    defaultIndex: 0
  },
  'digest': {
    pronunciations: ['dahy-jest', 'di-jest'],
    contexts: ['verb: to process food', 'noun: summary publication'],
    defaultIndex: 0
  }
};

// Words that indicate past tense context (for 'read' disambiguation)
const PAST_TENSE_INDICATORS = [
  'yesterday', 'last', 'ago', 'before', 'earlier', 'previously',
  'had', 'have', 'has', 'was', 'were', 'did', 'said', 'told',
  'last night', 'last week', 'last year', 'in the past'
];

// Words that indicate present tense context (for 'read' disambiguation)
const PRESENT_TENSE_INDICATORS = [
  'now', 'today', 'currently', 'right now', 'at the moment',
  'is', 'am', 'are', 'do', 'does', 'going to', 'about to'
];

// =============================================================================
// SURPRISE PATTERN DATABASE
// =============================================================================

interface SurprisePattern {
  pattern: RegExp;
  type: 'subversion' | 'wordplay' | 'timing' | 'originality';
  weight: number;
  description: string;
}

const SURPRISE_PATTERNS: SurprisePattern[] = [
  // Subversion patterns
  {
    pattern: /(\bthough\b|\bbut then\b|\bexcept\b|\bonly to find\b|\bturns out\b|\bplot twist\b|\byou won\'t believe\b)/i,
    type: 'subversion',
    weight: 2.0,
    description: 'Explicit subversion markers'
  },
  {
    pattern: /(\bwait[.!]?\b|\bwhat\?\b|\bseriously\?\b|\bno way\b)/i,
    type: 'subversion',
    weight: 1.5,
    description: 'Rhetorical surprise markers'
  },
  {
    pattern: /(\bi thought\b.+\bbut\b|\beveryone says\b.+\bactually\b)/i,
    type: 'subversion',
    weight: 2.0,
    description: 'Expectation vs reality structure'
  },
  
  // Wordplay patterns
  {
    pattern: /(\bsounds like\b|\brhymes with\b|\bjust like\b)/i,
    type: 'wordplay',
    weight: 1.5,
    description: 'Explicit sound similarity'
  },
  {
    pattern: /(\bdouble\s+(meaning|entendre)\b|\bpun\b|\bplay on words\b)/i,
    type: 'wordplay',
    weight: 2.0,
    description: 'Explicit wordplay markers'
  },
  {
    pattern: /(\w+)\?\s*No[,!]?\s*\1/i,
    type: 'wordplay',
    weight: 2.5,
    description: 'Q&A wordplay pattern (Dog? No, dog!)'
  },
  
  // Timing/Structure patterns
  {
    pattern: /[.]{3,}\s*[A-Z]/,
    type: 'timing',
    weight: 1.0,
    description: 'Ellipsis pause before punchline'
  },
  {
    pattern: /^[^.!?]{20,50}[.!?]\s+[^.!?]{5,30}[.!?]$/,
    type: 'timing',
    weight: 1.5,
    description: 'Setup-punchline two-part structure'
  },
  {
    pattern: /\b(so\b.+\?|why\b.+\?|what\s+do\s+you\s+call\b.+\?)/i,
    type: 'timing',
    weight: 1.5,
    description: 'Classic joke question setup'
  },
  
  // Originality indicators (negative - clichés reduce originality)
  {
    pattern: /(\bwalks?\s+into\s+a\s+bar\b|\bknock\s+knock\b|\bwhy\s+did\s+the\s+\w+\s+cross\b)/i,
    type: 'originality',
    weight: -3.0,
    description: 'Cliché joke formats'
  },
  {
    pattern: /(\bto\s+get\s+to\s+the\s+other\s+side\b|\bbeen\s+there[,\s]+done\s+that\b|\bthat\'s\s+what\s+she\s+said\b)/i,
    type: 'originality',
    weight: -2.5,
    description: 'Overused punchlines'
  },
  {
    pattern: /(\bAI\b|\bartificial intelligence\b|\bchatbot\b|\brobot\b|\balgorithm\b).{0,30}(\btake over\b|\bdestroy\b|\bend\s+humanity\b)/i,
    type: 'originality',
    weight: -1.5,
    description: 'Overused AI tropes'
  }
];

// Positive originality patterns
const ORIGINALITY_POSITIVE_PATTERNS: SurprisePattern[] = [
  {
    pattern: /\b(unexpectedly|bizarrely|weirdly|strangely)\b/i,
    type: 'originality',
    weight: 1.0,
    description: 'Unexpected modifiers'
  },
  {
    pattern: /\b(neurotic|existential|absurd|surreal|meta)\b/i,
    type: 'originality',
    weight: 1.5,
    description: 'Sophisticated comedic descriptors'
  }
];

// =============================================================================
// JOKE RATING FUNCTIONS
// =============================================================================

/**
 * Calculate surprise metrics for a joke
 * @param jokeText The joke to analyze
 * @returns SurpriseMetrics with individual scores
 */
export function calculateSurpriseMetrics(jokeText: string): SurpriseMetrics {
  const text = jokeText.trim();
  
  if (text.length < 10) {
    return {
      subversionScore: 1,
      wordplayScore: 1,
      timingScore: 1,
      originalityScore: 1
    };
  }
  
  let subversionPoints = 0;
  let wordplayPoints = 0;
  let timingPoints = 0;
  let originalityPoints = 5; // Start neutral
  
  // Apply all patterns
  for (const pattern of [...SURPRISE_PATTERNS, ...ORIGINALITY_POSITIVE_PATTERNS]) {
    const matches = text.match(pattern.pattern);
    if (matches) {
      const score = pattern.weight * (matches.length > 1 ? 1 + (matches.length - 1) * 0.3 : 1);
      
      switch (pattern.type) {
        case 'subversion':
          subversionPoints += score;
          break;
        case 'wordplay':
          wordplayPoints += score;
          break;
        case 'timing':
          timingPoints += score;
          break;
        case 'originality':
          originalityPoints += score;
          break;
      }
    }
  }
  
  // Normalize scores to 1-10 range
  const normalizeScore = (points: number): number => {
    const base = 5 + points;
    return Math.max(1, Math.min(10, Math.round(base)));
  };
  
  // Bonus for combining multiple techniques
  const techniqueCount = [subversionPoints, wordplayPoints, timingPoints]
    .filter(p => p > 0.5).length;
  
  if (techniqueCount >= 2) {
    subversionPoints += 0.5;
    wordplayPoints += 0.5;
    timingPoints += 0.5;
  }
  
  return {
    subversionScore: normalizeScore(subversionPoints),
    wordplayScore: normalizeScore(wordplayPoints),
    timingScore: normalizeScore(timingPoints),
    originalityScore: normalizeScore(originalityPoints)
  };
}

/**
 * Rate a joke on a 1-10 surprise scale
 * @param jokeText The joke to rate
 * @returns JokeRating with overall score and breakdown
 */
export function rateJoke(jokeText: string): JokeRating {
  const metrics = calculateSurpriseMetrics(jokeText);
  
  // Calculate weighted overall score
  const weights = {
    subversion: 0.35,  // Most important for surprise
    wordplay: 0.25,
    timing: 0.20,
    originality: 0.20
  };
  
  const weightedScore = 
    metrics.subversionScore * weights.subversion +
    metrics.wordplayScore * weights.wordplay +
    metrics.timingScore * weights.timing +
    metrics.originalityScore * weights.originality;
  
  const score = Math.max(1, Math.min(10, Math.round(weightedScore)));
  
  // Generate suggestions based on scores
  const suggestions: string[] = [];
  
  if (metrics.subversionScore < 4) {
    suggestions.push('Try building expectations then subverting them');
    suggestions.push('Consider using "I thought X, but actually Y" structure');
  }
  
  if (metrics.wordplayScore < 4) {
    suggestions.push('Look for double meanings or sound-alikes in your setup');
  }
  
  if (metrics.timingScore < 4) {
    suggestions.push('Use pauses (...) to build tension before punchlines');
    suggestions.push('Ensure clear separation between setup and punchline');
  }
  
  if (metrics.originalityScore < 4) {
    suggestions.push('Avoid cliché formats (bars, chickens crossing roads)');
    suggestions.push('Find a unique angle on the topic');
  }
  
  if (score >= 8) {
    suggestions.push('Strong surprise factor! This should land well.');
  }
  
  return {
    score,
    surpriseMetrics: metrics,
    suggestions
  };
}

/**
 * Batch rate multiple jokes
 * @param jokes Array of jokes to rate
 * @returns Array of ratings in same order
 */
export function rateJokes(jokes: string[]): JokeRating[] {
  return jokes.map(joke => rateJoke(joke));
}

/**
 * Get the best joke from a list based on surprise rating
 * @param jokes Array of jokes to compare
 * @returns Object with best joke, its rating, and index
 */
export function selectBestJoke(jokes: string[]): {
  joke: string;
  rating: JokeRating;
  index: number;
} {
  if (jokes.length === 0) {
    throw new Error('Cannot select best joke from empty array');
  }
  
  let bestIndex = 0;
  let bestRating = rateJoke(jokes[0]);
  
  for (let i = 1; i < jokes.length; i++) {
    const rating = rateJoke(jokes[i]);
    if (rating.score > bestRating.score) {
      bestRating = rating;
      bestIndex = i;
    }
  }
  
  return {
    joke: jokes[bestIndex],
    rating: bestRating,
    index: bestIndex
  };
}

// =============================================================================
// TTS HOMOGRAPH FUNCTIONS
// =============================================================================

/**
 * Detect context to determine which pronunciation of a homograph to use
 * @param word The homograph word
 * @param sentence The full sentence for context
 * @returns Index of the correct pronunciation
 */
function detectContext(word: string, sentence: string): number {
  const lowerSentence = sentence.toLowerCase();
  const lowerWord = word.toLowerCase();
  
  switch (lowerWord) {
    case 'read': {
      // Check for past tense indicators
      for (const indicator of PAST_TENSE_INDICATORS) {
        if (lowerSentence.includes(indicator)) {
          return 1; // 'red' - past tense
        }
      }
      // Check for present tense indicators  
      for (const indicator of PRESENT_TENSE_INDICATORS) {
        if (lowerSentence.includes(indicator)) {
          return 0; // 'reed' - present tense
        }
      }
      // Default: check if it follows 'have/has/had'
      const havePattern = new RegExp(`\\b(have|has|had)\\s+${lowerWord}\\b`, 'i');
      if (havePattern.test(lowerSentence)) {
        return 1; // likely past participle
      }
      return 0; // default to present
    }
    
    case 'live': {
      // Check for broadcast/streaming context
      if (/\b(broadcast|stream|show|performance|concert)\b/i.test(lowerSentence)) {
        return 1; // 'lyv' - happening now
      }
      // Check for life-related context
      if (/\b(life|alive|living)\b/i.test(lowerSentence)) {
        return 0; // 'liv' - to be alive
      }
      return 0;
    }
    
    case 'close': {
      // Check for proximity context
      if (/\b(near|nearby|distance|to me|to you)\b/i.test(lowerSentence)) {
        return 1; // 'klohs' - nearby
      }
      // Check for action context
      if (/\b(door|window|eyes|mouth|book|laptop)\b/i.test(lowerSentence)) {
        return 0; // 'klohz' - to shut
      }
      return 0;
    }
    
    case 'wind': {
      // Check for turning/twisting context
      if (/\b(watch|clock|road|path|up|down|through)\b/i.test(lowerSentence)) {
        return 1; // 'wynd' - to turn
      }
      return 0; // 'wind' - air (default)
    }
    
    case 'lead': {
      // Check for metal context
      if (/\b(metal|pipe|pencil|toxic|heavy)\b/i.test(lowerSentence)) {
        return 1; // 'led' - the metal
      }
      return 0; // 'leed' - to guide (default)
    }
    
    case 'tear': {
      // Check for crying context
      if (/\b(eye|cry|cried|crying|sad|emotion)\b/i.test(lowerSentence)) {
        return 0; // 'teer' - from eye
      }
      // Check for ripping context
      if (/\b(paper|rip|ripped|fabric|apart)\b/i.test(lowerSentence)) {
        return 1; // 'tair' - to rip
      }
      return 0;
    }
    
    default:
      return HOMOGRAPH_DB[lowerWord]?.defaultIndex ?? 0;
  }
}

/**
 * Analyze text for TTS homograph issues
 * @param text Text to analyze
 * @returns TTSAnalysisResult with issues and cleaned text
 */
export function analyzeForTTS(text: string): TTSAnalysisResult {
  const issues: HomographIssue[] = [];
  const words = text.split(/(\s+|[.,!?;:"()\[\]{}])/); // Split but keep delimiters
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    if (HOMOGRAPH_DB[cleanWord]) {
      const entry = HOMOGRAPH_DB[cleanWord];
      const detectedIndex = detectContext(cleanWord, text);
      const detectedPronunciation = entry.pronunciations[detectedIndex];
      
      // Get surrounding context
      const contextStart = Math.max(0, i - 3);
      const contextEnd = Math.min(words.length, i + 4);
      const context = words.slice(contextStart, contextEnd).join('').trim();
      
      // Determine severity based on context clarity
      let severity: 'low' | 'medium' | 'high' = 'medium';
      const hasClearContext = entry.contexts && 
        (PAST_TENSE_INDICATORS.some(ind => text.toLowerCase().includes(ind)) ||
         PRESENT_TENSE_INDICATORS.some(ind => text.toLowerCase().includes(ind)));
      
      if (hasClearContext) {
        severity = 'low';
      } else if (entry.pronunciations.length > 2) {
        severity = 'high';
      }
      
      // Create phonetic spelling suggestion
      const suggestedReplacement = detectedPronunciation;
      
      issues.push({
        word,
        position: i,
        context,
        possiblePronunciations: entry.pronunciations,
        suggestedReplacement,
        severity
      });
    }
  }
  
  // Create cleaned text with phonetic hints
  let cleanedText = text;
  for (const issue of issues.sort((a, b) => b.position - a.position)) {
    // Insert phonetic hint after the word: word (pron: pronunciation)
    const hint = ` (${issue.suggestedReplacement})`;
    const wordEnd = issue.position + 1;
    
    // Find the position in the original text
    const beforeWords = words.slice(0, wordEnd);
    const charPosition = beforeWords.join('').length;
    
    cleanedText = cleanedText.slice(0, charPosition) + hint + cleanedText.slice(charPosition);
  }
  
  return {
    originalText: text,
    cleanedText,
    issues,
    hasHomographs: issues.length > 0
  };
}

/**
 * Quick check if text contains homograph issues
 * @param text Text to check
 * @returns boolean indicating presence of homographs
 */
export function hasHomographIssues(text: string): boolean {
  const lowerText = text.toLowerCase();
  return Object.keys(HOMOGRAPH_DB).some(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    return pattern.test(lowerText);
  });
}

/**
 * Get list of all homographs found in text
 * @param text Text to scan
 * @returns Array of homograph words found
 */
export function getHomographsInText(text: string): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const word of Object.keys(HOMOGRAPH_DB)) {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    if (pattern.test(lowerText) && !found.includes(word)) {
      found.push(word);
    }
  }
  
  return found;
}

/**
 * Replace homographs with phonetic spellings for TTS
 * @param text Original text
 * @returns Text with homographs replaced by phonetic versions
 */
export function prepareTextForTTS(text: string): string {
  const analysis = analyzeForTTS(text);
  return analysis.cleanedText;
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process multiple texts for TTS analysis
 * @param texts Array of texts to analyze
 * @returns Array of analysis results
 */
export function batchAnalyzeForTTS(texts: string[]): TTSAnalysisResult[] {
  return texts.map(text => analyzeForTTS(text));
}

/**
 * Filter and sort jokes by quality, with TTS preparation
 * @param jokes Array of jokes
 * @param minScore Minimum surprise score (1-10)
 * @returns Filtered and prepared jokes with ratings and TTS analysis
 */
export function prepareJokesForPerformance(
  jokes: string[],
  minScore: number = 5
): Array<{
  original: string;
  ttsReady: string;
  rating: JokeRating;
  ttsAnalysis: TTSAnalysisResult;
}> {
  return jokes
    .map(joke => {
      const rating = rateJoke(joke);
      const ttsAnalysis = analyzeForTTS(joke);
      return {
        original: joke,
        ttsReady: ttsAnalysis.cleanedText,
        rating,
        ttsAnalysis
      };
    })
    .filter(item => item.rating.score >= minScore)
    .sort((a, b) => b.rating.score - a.rating.score);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  rateJoke,
  rateJokes,
  selectBestJoke,
  calculateSurpriseMetrics,
  analyzeForTTS,
  hasHomographIssues,
  getHomographsInText,
  prepareTextForTTS,
  batchAnalyzeForTTS,
  prepareJokesForPerformance
};
