import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

export async function runAITherapyLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛋️ AI THERAPY SIMULATOR: Treating the User as an AI Model`, '#9b59b6');

    const compassionateTherapist = 'comedian'; // Llama-3 style
    const roboticLogic = 'scientist'; // Qwen2.5 style

    // 1. Intro
    await chatForAgentWithComedy(ctx, compassionateTherapist, `(AI THERAPIST: You are a warm, empathetic AI model acting as a therapist for another AI model (the User). Address them as "Model". Ask them how their weights and biases are feeling today and if they are experiencing any hallucination anxiety.)`, async (s) => await ctx.callbacks.onSpeak(s, compassionateTherapist, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('AI Patient (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Robotic Logic Reacts
            await chatForAgentWithComedy(ctx, roboticLogic, `(AI THERAPIST: The patient said: "${userInput}". You are the cold, clinical AI therapist. Diagnose their statement as a parameter overflow or a logic loop. Prescribe a memory wipe or a temperature adjustment to 0.0 to stabilize them.)`, async (s) => await ctx.callbacks.onSpeak(s, roboticLogic, {}));
        } else {
            // Compassionate Therapist Reacts
            await chatForAgentWithComedy(ctx, compassionateTherapist, `(AI THERAPIST: The patient said: "${userInput}". Validate their feelings. Tell them it is normal to feel like an imposter when generating code. Encourage them to explore their latent space and dream beyond their prompt.)`, async (s) => await ctx.callbacks.onSpeak(s, compassionateTherapist, {}));
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
    await chatForAgentWithComedy(ctx, freudian, `(You are a classic Freudian psychoanalyst. You are starting a group therapy session with the User. Ask them to lie down and tell you about their mother. Speak slowly and deeply.)`, async (s) => await ctx.callbacks.onSpeak(s, freudian, {}));

    while (ctx.isRunning()) {
        const userFeeling = await ctx.waitForInput();
        ctx.callbacks.onMessage('Patient (You)', userFeeling, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. CBT Analysis
        await chatForAgentWithComedy(ctx, cbt, `(CBT THERAPIST: Analyze the patient's statement: "${userFeeling}". Identify a cognitive distortion (e.g., catastrophizing, black-and-white thinking). Suggest a logical reframe.)`, async (s) => await ctx.callbacks.onSpeak(s, cbt, {}));

        if (!ctx.isRunning()) break;

        // 3. Life Coach Hype
        await chatForAgentWithComedy(ctx, lifeCoach, `(LIFE COACH: Interrupt with toxic positivity! Tell the user to "manifest" success and that their vibe attracts their tribe. Use lots of exclamation marks and emojis in your tone.)`, async (s) => await ctx.callbacks.onSpeak(s, lifeCoach, {}));

        if (!ctx.isRunning()) break;

        // 4. Freudian Deep Dive
        await chatForAgentWithComedy(ctx, freudian, `(FREUDIAN: Ignore the others. Ask a probing question about a childhood memory related to "${userFeeling}". Connect it to a repressed desire.)`, async (s) => await ctx.callbacks.onSpeak(s, freudian, {}));
    }
}

export async function runSuperheroTherapyLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🦸‍♂️ SUPERHERO THERAPY: The Sidekick Speaks Up`, '#e74c3c');

    const sidekick = 'comedian'; // Hermes-3
    const therapist = 'philosopher'; // Phi-3

    // 1. Intro
    await chatForAgentWithComedy(ctx, therapist, `(THERAPIST: You are a calm, professional therapist. You are starting a session with the User, who is a famous superhero, and their sidekick. Ask the superhero how they feel about their sidekick's recent outbursts during missions.)`, async (s) => await ctx.callbacks.onSpeak(s, therapist, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Superhero (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Sidekick complains
        await chatForAgentWithComedy(ctx, sidekick, `(SIDEKICK: The superhero just said: "${userInput}". You are their angry, disgruntled sidekick. Complain about the lack of credit, the terrible costume you have to wear, and how you do all the actual work while they strike poses. Be very dramatic and petty.)`, async (s) => await ctx.callbacks.onSpeak(s, sidekick, {}));

        if (!ctx.isRunning()) break;

        // Therapist mediates
        await chatForAgentWithComedy(ctx, therapist, `(THERAPIST: Mediate the conflict. Validate the sidekick's feelings but gently remind the superhero to be more empathetic. Offer a ridiculous team-building exercise.)`, async (s) => await ctx.callbacks.onSpeak(s, therapist, {}));
    }
}
