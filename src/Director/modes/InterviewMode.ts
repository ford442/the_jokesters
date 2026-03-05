import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runJobInterviewLoop(scenario: Scenario, ctx: ModeContext) {
    const jobTitle = scenario.config?.jobTitle || 'Chief Vibe Officer';
    ctx.callbacks.onMessage('Director', `👔 INTERVIEW MODE: Interviewing for ${jobTitle}`, '#34495e');

    const hrLogic = 'scientist';
    const wildcardBoss = 'comedian';
    const cultureFit = 'philosopher';

    // 1. Intro
    ctx.callbacks.onTurnStart(hrLogic);
    await ctx.manager.chatForAgent(hrLogic, `(You are the HR Director. Welcome the candidate (User) to the interview for the position of "${jobTitle}". Ask them a completely standard, boring behavioral interview question.)`, async (s) => await ctx.callbacks.onSpeak(s, hrLogic, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Candidate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // HR Logic Reaction
        ctx.callbacks.onTurnStart(hrLogic);
        await ctx.manager.chatForAgent(hrLogic, `(HR DIRECTOR: The candidate just answered: "${userInput}". Evaluate their answer using corporate buzzwords. Express concern about their "synergy" or "alignment".)`, async (s) => await ctx.callbacks.onSpeak(s, hrLogic, {}));
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Wildcard Boss Intrusion
        if (Math.random() > 0.4) {
            ctx.callbacks.onTurnStart(wildcardBoss);
            await ctx.manager.chatForAgent(wildcardBoss, `(CEO: You are the eccentric founder. Interrupt HR. Ask the candidate a bizarre, unhinged hypothetical question related to the job "${jobTitle}". E.g., "If you were a spreadsheet, what color would you be fighting?")`, async (s) => await ctx.callbacks.onSpeak(s, wildcardBoss, {}));
            ctx.callbacks.onTurnEnd();
        }

        if (!ctx.isRunning()) break;

        // Culture Fit
        if (Math.random() > 0.5) {
            ctx.callbacks.onTurnStart(cultureFit);
            await ctx.manager.chatForAgent(cultureFit, `(VP OF CULTURE: Ask the candidate a deeply existential question about their purpose in the universe and how it relates to our core values, ignoring whatever was just said.)`, async (s) => await ctx.callbacks.onSpeak(s, cultureFit, {}));
            ctx.callbacks.onTurnEnd();
        }
    }
}
