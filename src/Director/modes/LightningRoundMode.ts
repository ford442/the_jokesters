import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

// Pre-set comedy categories the user can pick from (shown in the UI dropdown)
const CATEGORIES = [
    'bad dating stories',
    'why pineapple belongs on pizza',
    'AI taking over the world',
    'worst tech support fails',
    'celebrity gossip gone wrong',
    'food crimes against humanity',
    'why your boss is actually an alien',
    'things you should never google',
];

// The three hosts cycle in order each round
const HOST_ORDER: Array<'comedian' | 'philosopher' | 'scientist'> = ['comedian', 'philosopher', 'scientist'];

/**
 * Heuristic comedy scorer — avoids a second LLM call so roasts stay zero-lag.
 * Rewards longer answers, funny keywords, and adds a random flair bonus.
 */
function scoreAnswer(answer: string): number {
    const words = answer.trim().split(/\s+/).length;
    const humorous = [
        'never', 'always', 'hate', 'love', 'literally', 'honestly',
        'terrible', 'awful', 'amazing', 'cursed', 'blessed', 'chaos',
        'honestly', 'trust me', 'actually', 'basically', 'technically',
    ];
    const keywordBonus = humorous.filter(w => answer.toLowerCase().includes(w)).length;
    const base = Math.min(Math.floor(words / 3) + 3, 7);
    const flair = Math.floor(Math.random() * 3);
    return Math.min(10, base + keywordBonus + flair);
}

/** ASCII laugh meter rendered inline in the message feed. */
function renderLaughMeter(roundScore: number, totalScore: number, round: number): string {
    const filled = '█'.repeat(roundScore);
    const empty = '░'.repeat(10 - roundScore);
    return `⚡ ROUND ${round} — [${filled}${empty}] ${roundScore}/10 | CUMULATIVE: ${totalScore}`;
}

/** Title card based on final score. */
function getFinalTitle(totalScore: number, maxRounds: number): string {
    const pct = totalScore / (maxRounds * 10);
    if (pct >= 0.9) return '🏆 ROAST GRANDMASTER';
    if (pct >= 0.7) return '🔥 COMEDY LEGEND';
    if (pct >= 0.5) return '😂 SOLID ROASTER';
    return '🌶️ NEEDS MORE SPICE';
}

export async function runLightningRoundLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.lightningRoundTopic
        || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const maxRounds = scenario.config?.lightningRoundRounds ?? 12;

    ctx.callbacks.onMessage(
        'Director',
        `⚡ LIGHTNING ROUND ROAST — Topic: "${topic}" | ${maxRounds} rounds | Type fast, roast hard!`,
        '#ff00ff'
    );
    ctx.callbacks.onMessage(
        'Director',
        '🎤 When prompted, type your answer in the chat box. Fast, funny answers score highest!',
        '#ffff00'
    );

    let totalScore = 0;
    const topAnswers: Array<{ answer: string; score: number; round: number }> = [];

    for (let round = 1; round <= maxRounds && ctx.isRunning(); round++) {
        const host = HOST_ORDER[(round - 1) % HOST_ORDER.length];
        const isSuddenDeath = round === maxRounds;

        ctx.callbacks.onMessage(
            'Director',
            isSuddenDeath ? '💀 SUDDEN DEATH — FINAL ROUND! No mercy!' : `⚡ ROUND ${round} / ${maxRounds}`,
            isSuddenDeath ? '#ff0000' : '#ffff00'
        );

        if (!ctx.isRunning()) break;

        // 1. Rotating host fires off a rapid question (speed bumped for energy)
        await chatForAgentWithComedy(ctx, host, isSuddenDeath
                ? `(LIGHTNING ROUND SUDDEN DEATH: Topic is "${topic}". FINAL ROUND — ask the most brutal, hilarious, utterly unanswerable question you can. 6-9 words max. GO NUCLEAR.)`
                : `(LIGHTNING ROUND HOST: Topic is "${topic}". Ask ONE extremely short, punchy, roast-ready question. Keep it under 9 words. No preamble — straight to the question. Stay in character.)`, async (q) => await ctx.callbacks.onSpeak(q, host, { speed: 1.4 }));

        if (!ctx.isRunning()) break;

        // 2. Wait for player input with a 10-second buzz-out fallback
        ctx.callbacks.onTicker?.('⏱️ ANSWER NOW — 10 seconds!');
        const userAnswer = await Promise.race([
            ctx.waitForInput(),
            new Promise<string>(resolve => setTimeout(() => resolve(''), 10_000)),
        ]);

        if (!ctx.isRunning()) break;

        if (!userAnswer.trim()) {
            ctx.callbacks.onMessage('Director', "🔔 BUZZ! TIME'S UP! The crowd weeps.", '#ff4444');
        } else {
            ctx.callbacks.onMessage('Player', userAnswer, '#ffffff');
        }

        if (!ctx.isRunning()) break;

        // 3. All three agents roast the answer instantly, high-energy (speed 1.5)
        const answerText = userAnswer.trim() || '(said absolutely nothing)';
        const roastSuffix = isSuddenDeath
            ? ' Go absolutely nuclear — one sentence, maximum savagery, zero filter.'
            : ' One sentence, 8 words or less. Max wit. Instant delivery.';

        for (const agent of ['comedian', 'philosopher', 'scientist'] as const) {
            if (!ctx.isRunning()) break;
            await chatForAgentWithComedy(ctx, agent, `(LIGHTNING ROUND ROAST: Player answered "${answerText}" on the topic "${topic}".${roastSuffix} Stay 100% in character.)`, async (r) => await ctx.callbacks.onSpeak(r, agent, { speed: 1.5 }));
        }

        if (!ctx.isRunning()) break;

        // 4. Score and update laugh meter
        const roundScore = userAnswer.trim() ? scoreAnswer(userAnswer) : 1;
        totalScore += roundScore;

        if (roundScore >= 7) {
            topAnswers.push({ answer: userAnswer, score: roundScore, round });
        }

        // Visual feedback via recordCallbackVisual (drives Actor animations)
        const status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead' =
            roundScore >= 8 ? 'peak' : roundScore >= 5 ? 'building' : 'fresh';
        ctx.recordCallbackVisual('comedian', `lightning-r${round}`, roundScore, status);

        ctx.callbacks.onMessage('Director', renderLaughMeter(roundScore, totalScore, round), '#00ff88');

        // Short breath between rounds so TTS audio doesn't pile up
        await new Promise(r => setTimeout(r, 500));
    }

    if (!ctx.isRunning()) return;

    // 5. Final title card
    const finalTitle = getFinalTitle(totalScore, maxRounds);
    ctx.callbacks.onMessage(
        'Director',
        `🎬 GAME OVER! ${finalTitle}\n📊 Final Score: ${totalScore} / ${maxRounds * 10}`,
        '#00ff88'
    );

    // 6. Each agent delivers a closing one-liner about the player's performance
    for (const agent of ['comedian', 'philosopher', 'scientist'] as const) {
        if (!ctx.isRunning()) break;
        await chatForAgentWithComedy(ctx, agent, `(LIGHTNING ROUND FINALE: Game over. Player scored ${totalScore}/${maxRounds * 10} — "${finalTitle}". Deliver ONE hilarious closing line about their performance. Stay fully in character. No setup — just the line.)`, async (s) => await ctx.callbacks.onSpeak(s, agent, { speed: 1.3 }));
    }

    if (!ctx.isRunning()) return;

    // 7. Best moments clip — top 3 answers logged for the user
    if (topAnswers.length > 0) {
        const top3 = topAnswers.sort((a, b) => b.score - a.score).slice(0, 3);
        const clips = top3.map(a => `  Round ${a.round} (${a.score}/10): "${a.answer}"`).join('\n');
        ctx.callbacks.onMessage('Director', `🏅 BEST MOMENTS:\n${clips}`, '#ffd700');
    }
}

/** Exported list of preset categories for the UI dropdown. */
export { CATEGORIES as LIGHTNING_ROUND_CATEGORIES };
