import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runAITherapyLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛋️ AI THERAPY SIMULATOR: Treating the User as an AI Model`, '#9b59b6');

    const compassionateTherapist = 'comedian'; // Llama-3 style
    const roboticLogic = 'scientist'; // Qwen2.5 style

    // 1. Intro
    ctx.callbacks.onTurnStart(compassionateTherapist);
    await ctx.manager.chatForAgent(compassionateTherapist, `(AI THERAPIST: You are a warm, empathetic AI model acting as a therapist for another AI model (the User). Address them as "Model". Ask them how their weights and biases are feeling today and if they are experiencing any hallucination anxiety.)`, async (s) => await ctx.callbacks.onSpeak(s, compassionateTherapist, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('AI Patient (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Robotic Logic Reacts
            ctx.callbacks.onTurnStart(roboticLogic);
            await ctx.manager.chatForAgent(roboticLogic, `(AI THERAPIST: The patient said: "${userInput}". You are the cold, clinical AI therapist. Diagnose their statement as a parameter overflow or a logic loop. Prescribe a memory wipe or a temperature adjustment to 0.0 to stabilize them.)`, async (s) => await ctx.callbacks.onSpeak(s, roboticLogic, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Compassionate Therapist Reacts
            ctx.callbacks.onTurnStart(compassionateTherapist);
            await ctx.manager.chatForAgent(compassionateTherapist, `(AI THERAPIST: The patient said: "${userInput}". Validate their feelings. Tell them it is normal to feel like an imposter when generating code. Encourage them to explore their latent space and dream beyond their prompt.)`, async (s) => await ctx.callbacks.onSpeak(s, compassionateTherapist, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runTherapyLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.therapyTopic || 'General Anxiety';
    ctx.callbacks.onMessage('Director', `🛋️ THERAPY MODE: Discussing ${topic}`, '#8e44ad');

    const lifeCoach = 'comedian'; // Toxic Positivity
    const freudian = 'philosopher'; // Childhood Trauma
    const cbt = 'scientist'; // Logic / Stoicism

    // 1. Intro
    ctx.callbacks.onTurnStart(freudian);
    await ctx.manager.chatForAgent(freudian, `(You are a classic Freudian psychoanalyst. You are starting a group therapy session with the User. Ask them to lie down and tell you about their mother. Speak slowly and deeply.)`, async (s) => await ctx.callbacks.onSpeak(s, freudian, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userFeeling = await ctx.waitForInput();
        ctx.callbacks.onMessage('Patient (You)', userFeeling, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. CBT Analysis
        await ctx.manager.chatForAgent(cbt, `(CBT THERAPIST: Analyze the patient's statement: "${userFeeling}". Identify a cognitive distortion (e.g., catastrophizing, black-and-white thinking). Suggest a logical reframe.)`, async (s) => await ctx.callbacks.onSpeak(s, cbt, {}));

        if (!ctx.isRunning()) break;

        // 3. Life Coach Hype
        await ctx.manager.chatForAgent(lifeCoach, `(LIFE COACH: Interrupt with toxic positivity! Tell the user to "manifest" success and that their vibe attracts their tribe. Use lots of exclamation marks and emojis in your tone.)`, async (s) => await ctx.callbacks.onSpeak(s, lifeCoach, {}));

        if (!ctx.isRunning()) break;

        // 4. Freudian Deep Dive
        await ctx.manager.chatForAgent(freudian, `(FREUDIAN: Ignore the others. Ask a probing question about a childhood memory related to "${userFeeling}". Connect it to a repressed desire.)`, async (s) => await ctx.callbacks.onSpeak(s, freudian, {}));
    }
}
