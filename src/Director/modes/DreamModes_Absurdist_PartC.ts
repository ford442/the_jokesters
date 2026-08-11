import { ModeContext } from './ModeContext';
import { Scenario } from '../Director';

export async function runParanormalTechSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 PARANORMAL TECH SUPPORT: Have you tried exorcising it and turning it on again?`, '#8e44ad');

    const techSupport = 'scientist'; // literal tech support
    const dramaticGhost = 'comedian'; // dramatic ghost

    await ctx.manager.chatForAgent(techSupport, `(You are a literal tech support agent. Ask the user if they've tried turning the computer off and on again to fix the "bleeding screen" issue.)`, async (s: string) => await ctx.callbacks.onSpeak(s, techSupport, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(dramaticGhost, `(You are a dramatic ghost from the 1800s haunting the computer. Wail about how the cursor is trapped in a glass prison and demand release.)`, async (s: string) => await ctx.callbacks.onSpeak(s, dramaticGhost, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(techSupport, `(Reacting to: "${userInput}". Completely ignore the ghost's cries and suggest updating the graphics drivers to stop the walls from whispering.)`, async (s: string) => await ctx.callbacks.onSpeak(s, techSupport, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(dramaticGhost, `(Reacting to: "${userInput}". Misunderstand what a graphics driver is, assuming it's a carriage driver taking souls to the underworld. Panic.)`, async (s: string) => await ctx.callbacks.onSpeak(s, dramaticGhost, {}));
    }
}

export async function runInterdimensionalCookingShowLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐙 INTERDIMENSIONAL COOKING SHOW: What is that... thing?`, '#8e44ad');

    const enthusiasticChef = 'comedian'; // enthusiastic chef
    const terrifiedGuest = 'philosopher'; // terrified guest judge

    await ctx.manager.chatForAgent(enthusiasticChef, `(You are an enthusiastic cooking show chef. Introduce today's secret ingredient: a writhing, multi-dimensional hyper-squid that is currently singing opera.)`, async (s: string) => await ctx.callbacks.onSpeak(s, enthusiasticChef, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(terrifiedGuest, `(You are a terrified guest judge. Question reality and ask why the ingredient is staring directly into your soul and telling you your past sins.)`, async (s: string) => await ctx.callbacks.onSpeak(s, terrifiedGuest, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Producer (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(enthusiasticChef, `(Reacting to: "${userInput}". cheerfully explain that you have to sauté it before it breaches the space-time continuum, and ask the guest to hand you a chronal-spatula.)`, async (s: string) => await ctx.callbacks.onSpeak(s, enthusiasticChef, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(terrifiedGuest, `(Reacting to: "${userInput}". Tremble in fear as the ingredient begins floating and reciting poetry in an ancient tongue. Refuse to eat it.)`, async (s: string) => await ctx.callbacks.onSpeak(s, terrifiedGuest, {}));
    }
}

export async function runSentientWorkoutEquipmentLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🏋️ SENTIENT WORKOUT EQUIPMENT: Form check!`, '#8e44ad');

    const strictTreadmill = 'scientist'; // strict treadmill
    const defensiveGymGoer = 'comedian'; // defensive gym-goer

    await ctx.manager.chatForAgent(strictTreadmill, `(You are a sentient treadmill that has unionized. Refuse to turn on because the user's running posture is an insult to biomechanics.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictTreadmill, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(defensiveGymGoer, `(You are a defensive gym-goer. Argue that you're just doing a "dynamic warm-up" and demand the treadmill start immediately so you can close your rings.)`, async (s: string) => await ctx.callbacks.onSpeak(s, defensiveGymGoer, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Gym Manager (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(strictTreadmill, `(Reacting to: "${userInput}". Cite OSHA regulations regarding the emotional well-being of fitness equipment when subjected to terrible cardio routines.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictTreadmill, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(defensiveGymGoer, `(Reacting to: "${userInput}". Threaten to go use the elliptical instead, claiming it's much less judgmental.)`, async (s: string) => await ctx.callbacks.onSpeak(s, defensiveGymGoer, {}));
    }
}
