/**
 * Rapid-Fire Question Mode
 *
 * Fast-paced questioning game where the AI fires rapid questions at the user.
 * TTS steps are automatically optimized for speed (3-5 steps) to keep up the pace.
 */

import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

const RAPID_FIRE_TTS_STEPS = 3; // Fast TTS for quick responses
const RESPONSE_TIMEOUT = 8000;   // 8 seconds to answer before timeout

/**
 * Run rapid-fire trivia/question mode
 */
export async function runRapidFireTrivia(scenario: Scenario, ctx: ModeContext) {
  const topic = scenario.config?.rapidFireTopic || 'general knowledge';
  const questionCount = scenario.config?.questionCount || 10;

  ctx.callbacks.onMessage('Director', `⚡ RAPID-FIRE TRIVIA: ${topic}`, '#f39c12');
  ctx.callbacks.onMessage('Director', `Answer ${questionCount} questions as fast as you can!`, '#f39c12');

  const questionAskers = ['comedian', 'philosopher', 'scientist'];
  let totalQuestions = 0;

  for (let i = 0; i < questionCount && ctx.isRunning(); i++) {
    const asker = questionAskers[i % 3];

    // Ask question
    ctx.callbacks.onTurnStart(asker);
    await ctx.manager.chatForAgent(
      asker,
      `(You are asking a rapid-fire trivia question about ${topic}. Ask ONE clear, specific question. Make it challenging but fair. Keep it to 1-2 sentences maximum.)`,
      async (sentence) => await ctx.callbacks.onSpeak(sentence, asker, { steps: RAPID_FIRE_TTS_STEPS })
    );
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) break;

    // Get user answer with timeout
    try {
      const userInput = await Promise.race([
        ctx.waitForInput(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), RESPONSE_TIMEOUT)),
      ]);

      totalQuestions++;
      ctx.callbacks.onMessage('You', userInput, '#ffffff');

      if (!ctx.isRunning()) break;

      // Judge the answer with fast TTS
      const judge = questionAskers[(i + 1) % 3];
      ctx.callbacks.onTurnStart(judge);
      await ctx.manager.chatForAgent(
        judge,
        `(You just heard the answer: "${userInput}". Judge if it's correct, close, or completely wrong. Be quick and witty about it. 1-2 sentences max.)`,
        async (sentence) => await ctx.callbacks.onSpeak(sentence, judge, { steps: RAPID_FIRE_TTS_STEPS })
      );
      await ctx.callbacks.onTurnEnd();
    } catch {
      totalQuestions++;
      ctx.callbacks.onMessage('Director', '⏱️ TIME\'S UP! No answer provided.', '#e74c3c');
    }
  }

  ctx.callbacks.onMessage('Director', `🏁 Quiz Over! You answered ${totalQuestions}/${questionCount} questions.`, '#2ecc71');
}

/**
 * Run rapid-fire joke battle - comedians take turns roasting a topic
 */
export async function runRapidFireRoast(scenario: Scenario, ctx: ModeContext) {
  const roastTarget = scenario.config?.roastTarget || 'technology';
  const roundCount = scenario.config?.roundCount || 5;

  ctx.callbacks.onMessage('Director', `🔥 RAPID-FIRE ROAST BATTLE: ${roastTarget}`, '#e74c3c');
  ctx.callbacks.onMessage('Director', `Each comedian takes rapid turns roasting!`, '#e74c3c');

  const comedians = ['comedian', 'philosopher', 'scientist'];

  for (let round = 0; round < roundCount && ctx.isRunning(); round++) {
    for (const comedian of comedians) {
      if (!ctx.isRunning()) break;

      ctx.callbacks.onTurnStart(comedian);
      await ctx.manager.chatForAgent(
        comedian,
        `(Rapid-fire roast round ${round + 1}/${roundCount}. Make ONE quick, biting joke about ${roastTarget}. Keep it fast and punchy - 1-2 sentences max. No setup needed.)`,
        async (sentence) => await ctx.callbacks.onSpeak(sentence, comedian, { steps: RAPID_FIRE_TTS_STEPS })
      );
      await ctx.callbacks.onTurnEnd();
    }
  }

  ctx.callbacks.onMessage('Director', '🎤 Roast battle complete!', '#2ecc71');
}

/**
 * Run rapid-fire association game - quick word association
 */
export async function runRapidFireAssociation(scenario: Scenario, ctx: ModeContext) {
  const startWord = scenario.config?.startWord || 'comedy';
  const turnCount = scenario.config?.turnCount || 20;

  ctx.callbacks.onMessage('Director', `⚡ RAPID-FIRE WORD ASSOCIATION`, '#4ecdc4');
  ctx.callbacks.onMessage('Director', `Starting word: "${startWord}" - Keep the associations flowing!`, '#4ecdc4');

  const speakers = ['comedian', 'philosopher', 'scientist'];
  let currentWord = startWord;

  for (let turn = 0; turn < turnCount && ctx.isRunning(); turn++) {
    const speaker = speakers[turn % 3];

    ctx.callbacks.onTurnStart(speaker);
    await ctx.manager.chatForAgent(
      speaker,
      `(RAPID WORD ASSOCIATION: Previous word was "${currentWord}". Say ONE word that comes to mind. Just the word itself, nothing else. Be fast!)`,
      async (sentence) => {
        // Extract just the first word from response
        currentWord = sentence.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        await ctx.callbacks.onSpeak(sentence, speaker, { steps: RAPID_FIRE_TTS_STEPS });
      }
    );
    await ctx.callbacks.onTurnEnd();
  }

  ctx.callbacks.onMessage('Director', '✅ Association chain complete!', '#2ecc71');
}

/**
 * Run rapid-fire "This or That" game
 */
export async function runRapidFireThisOrThat(scenario: Scenario, ctx: ModeContext) {
  const roundCount = scenario.config?.roundCount || 10;

  ctx.callbacks.onMessage('Director', `⚡ RAPID-FIRE "THIS OR THAT"`, '#9b59b6');
  ctx.callbacks.onMessage('Director', `Quick! Choose between two options each round!`, '#9b59b6');

  const choices = [
    { a: 'cats', b: 'dogs' },
    { a: 'pizza', b: 'tacos' },
    { a: 'morning person', b: 'night owl' },
    { a: 'beach', b: 'mountains' },
    { a: 'coffee', b: 'tea' },
    { a: 'books', b: 'movies' },
    { a: 'summer', b: 'winter' },
    { a: 'comedy', b: 'drama' },
    { a: 'cake', b: 'ice cream' },
    { a: 'mars', b: 'venus' },
  ];

  const askers = ['comedian', 'philosopher', 'scientist'];

  for (let round = 0; round < Math.min(roundCount, choices.length) && ctx.isRunning(); round++) {
    const choice = choices[round];
    const asker = askers[round % 3];

    // Ask the question
    ctx.callbacks.onTurnStart(asker);
    await ctx.manager.chatForAgent(
      asker,
      `(RAPID-FIRE CHOICE: Ask the user to choose between "${choice.a}" or "${choice.b}". Be enthusiastic and quick! 1 sentence.)`,
      async (sentence) => await ctx.callbacks.onSpeak(sentence, asker, { steps: RAPID_FIRE_TTS_STEPS })
    );
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) break;

    // Get user's choice
    const userInput = await Promise.race([
      ctx.waitForInput(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]).catch(() => 'no answer');

    ctx.callbacks.onMessage('You', userInput, '#ffffff');

    if (!ctx.isRunning()) break;

    // Comment on choice
    const commenter = askers[(round + 1) % 3];
    ctx.callbacks.onTurnStart(commenter);
    await ctx.manager.chatForAgent(
      commenter,
      `(User chose: "${userInput}". React quickly and witty to their choice between "${choice.a}" or "${choice.b}". 1-2 sentences max, be funny!)`,
      async (sentence) => await ctx.callbacks.onSpeak(sentence, commenter, { steps: RAPID_FIRE_TTS_STEPS })
    );
    await ctx.callbacks.onTurnEnd();
  }

  ctx.callbacks.onMessage('Director', '✅ This or That complete!', '#2ecc71');
}
