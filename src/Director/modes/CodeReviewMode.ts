import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

export async function runCodeReviewLoop(scenario: Scenario, ctx: ModeContext) {
    const language = scenario.config?.codeLanguage || 'TypeScript';
    ctx.callbacks.onMessage('Director', `💻 CODE REVIEW MODE: Analyzing ${language}`, '#2c3e50');

    const hacker = 'comedian'; // The Chaos Monkey / Hacker
    const manager = 'philosopher'; // The Manager / Deadline Watcher
    const linter = 'scientist'; // The Pedantic Linter

    // 1. Intro
    await chatForAgentWithComedy(ctx, linter, `(You are a Senior Engineer who is obsessed with clean code, linting rules, and type safety. You are about to review some code from a junior developer (The User). Be stern but fair. Introduce the session.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));

    // 2. Wait for Code Input
    ctx.callbacks.onMessage('System', 'Paste your code snippet below...', '#888');
    const userCode = await ctx.waitForInput();
    ctx.callbacks.onMessage('Junior Dev (You)', userCode, '#ffffff');

    // 3. The Review Loop
    let round = 0;
    while (ctx.isRunning()) {
        round++;

        // Linter Analysis (First pass)
        if (round === 1) {
            await chatForAgentWithComedy(ctx, linter, `(LINTER: Analyze this ${language} code: "${userCode}". Point out a specific syntax error, formatting issue, or inefficiency. Be very technical.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));
        }

        if (!ctx.isRunning()) break;

        // Hacker Roast
        await chatForAgentWithComedy(ctx, hacker, `(HACKER: You are a chaotic 10x developer who loves messy, fast code. Make fun of the Linter's complaints or suggest a "clever" one-liner hack that makes the code unreadable but faster. Use internet slang.)`, async (s) => await ctx.callbacks.onSpeak(s, hacker, {}));

        if (!ctx.isRunning()) break;

        // Manager Worry
        await chatForAgentWithComedy(ctx, manager, `(MANAGER: You are a non-technical project manager. You don't understand the code, but you are worried about the deadline and "scalability". Ask if this will block the Q3 release or if it's "web scale".)`, async (s) => await ctx.callbacks.onSpeak(s, manager, {}));

        if (!ctx.isRunning()) break;

        // Wait for user defense
        const defense = await ctx.waitForInput();
        ctx.callbacks.onMessage('Junior Dev (You)', defense, '#ffffff');

        // Linter Rebuttal
        await chatForAgentWithComedy(ctx, linter, `(LINTER: The user said: "${defense}". dismiss their excuse. Cite a specific page of the documentation or a design pattern they violated.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));
    }
}
