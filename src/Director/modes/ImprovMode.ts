import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runImprovLoop(scenario: Scenario, ctx: ModeContext) {
    if (ctx.manager.getHistoryLength() === 0) {
        let seed = scenario.config?.initialPrompt || scenario.title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?';

        const recall = await ctx.searchAndRecall(seed);
        if (recall) {
            ctx.callbacks.onMessage('System', '🧠 Memory Recall Active', '#4ecdc4');
            seed += '\n' + recall;
        }

        ctx.callbacks.onMessage('Director', `Action! "${seed}"`, '#888');
        await ctx.processTurn(seed);
    }

    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 HECKLER INTERRUPT: "${heckle}"`, '#ff6b6b');
            await ctx.processTurn(`(A HECKLER just shouted: "${heckle}". Stop what you are doing and ROAST them immediately!)`);
            continue;
        }

        await new Promise(r => setTimeout(r, 800));
        if (!ctx.isRunning()) break;

        const turnCount = ctx.manager.getHistoryLength();
        let prompt = '(Reply naturally to the last thing said)';

        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift();
            prompt = `(SYSTEM: SUDDEN INTERRUPTION! The audience yells: "${heckle}". React to this IMMEDIATELY and integrate it into the scene!)`;
            ctx.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
        } else {
            if (turnCount % 3 === 0 && Math.random() * 100 < ctx.chaosLevel) {
                prompt = '(Suddenly, a physical disaster happens. React with panic and crass humor!)';
            } else if (turnCount % 4 === 0 && Math.random() * 100 < ctx.chaosLevel) {
                prompt = '(Make a highbrow reference to history that completely misses the point.)';
            }
        }

        await ctx.processTurn(prompt);
    }
}

export async function runAutonomousLoop(scenario: Scenario, ctx: ModeContext) {
    const topics = [
        "What if we are all living in a simulation?",
        "The pros and cons of owning a pet dragon.",
        "Why is pizza the perfect food?",
        "Explain quantum physics using only food metaphors.",
        "The worst possible time to start a dance party.",
        "If animals could talk, which one would be the rudest?",
    ];

    let turnCount = 0;
    ctx.callbacks.onMessage('Director', '🤖 Autonomous Mode Activated', '#4ecdc4');

    if (ctx.manager.getHistoryLength() === 0) {
        const seed = scenario.config?.initialPrompt || topics[Math.floor(Math.random() * topics.length)];
        ctx.callbacks.onMessage('Director', `Topic: "${seed}"`, '#888');
        await ctx.processTurn(seed);
    }

    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 INTERRUPT: "${heckle}"`, '#ff6b6b');
            await ctx.processTurn(`(SYSTEM: SUDDEN INTERRUPTION! Someone said: "${heckle}". React to this naturally.)`);
            continue;
        }

        await new Promise(r => setTimeout(r, 1000));
        if (!ctx.isRunning()) break;

        let prompt = '(Continue the conversation naturally. Be funny or insightful.)';

        if (turnCount > 0 && turnCount % 5 === 0) {
            const newTopic = topics[Math.floor(Math.random() * topics.length)];
            prompt = `(SYSTEM: The conversation is getting stale. Smoothly transition the topic to: "${newTopic}")`;
            ctx.callbacks.onMessage('Director', `➡️ Shift to: ${newTopic}`, '#888');
        }

        if (Math.random() * 100 < ctx.chaosLevel && turnCount % 3 === 0) {
            prompt = '(SYSTEM: Something unexpected happens or someone makes a controversial statement. React!)';
        }

        await ctx.processTurn(prompt);
        turnCount++;
    }
}
