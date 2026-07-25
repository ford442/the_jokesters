import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Professional, corporate, and workplace scenarios

/**
 * AI Audit Mode
 * Agents act as strict auditors evaluating the user's internet history.
 */
export async function runAIAuditLoop(scenario: Scenario, ctx: ModeContext) {
    const historyItem = scenario.config?.auditHistory || 'your recent search history';
    ctx.callbacks.onMessage('Director', `📑 AI AUDIT MODE: Reviewing ${historyItem}`, '#34495e');

    const coldAuditor = 'scientist'; // Qwen2.5: Cold Facts
    const judgmentalAuditor = 'comedian'; // Hermes-3: Judgemental
    const defenseAttorney = 'philosopher'; // Trying to find meaning in the history

    await chatForAgentWithComedy(ctx, coldAuditor, `(You are a strict, robotic AI auditor evaluating the user's internet history regarding "${historyItem}". Welcome them to the audit. Present a highly concerning, mathematically improbable statistic about their online behavior and demand an explanation.)`, async (s) => await ctx.callbacks.onSpeak(s, coldAuditor, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Auditee (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const turnRoll = Math.random();

        if (turnRoll < 0.4) {
            await chatForAgentWithComedy(ctx, judgmentalAuditor, `(JUDGMENTAL AUDITOR: The user said: "${userInput}". Act deeply disgusted and personally offended by this explanation. Question their moral character based on their search history.)`, async (s) => await ctx.callbacks.onSpeak(s, judgmentalAuditor, {}));
        } else if (turnRoll < 0.7) {
            await chatForAgentWithComedy(ctx, defenseAttorney, `(DEFENSE ATTORNEY: The user said: "${userInput}". Try to philosophically defend their terrible search history as a profound exploration of the human condition. Fail miserably at making them look good.)`, async (s) => await ctx.callbacks.onSpeak(s, defenseAttorney, {}));
        } else {
            await chatForAgentWithComedy(ctx, coldAuditor, `(COLD AUDITOR: The user said: "${userInput}". Reject their excuse using cold logic. Cite a fake terms-of-service violation section (e.g., Section 4B: Unauthorized Meme Viewing) and threaten account deletion.)`, async (s) => await ctx.callbacks.onSpeak(s, coldAuditor, {}));
        }
    }
}

/**
 * Telemarketer Takedown Mode
 * User plays a telemarketer, agents try to waste their time.
 */
export async function runTelemarketerTakedownLoop(scenario: Scenario, ctx: ModeContext) {
    const product = scenario.config?.telemarketerProduct || 'extended car warranties';
    ctx.callbacks.onMessage('Director', `📞 TELEMARKETER TAKEDOWN: Selling ${product}`, '#e74c3c');

    const confusedElderly = 'philosopher'; // Phi-3: Deeply confused
    const chaosAgent = 'comedian'; // Hermes-3: Absurd questions
    const paranoid = 'scientist'; // Thinks it's a scam

    await chatForAgentWithComedy(ctx, confusedElderly, `(You are an elderly person answering the phone. The telemarketer (User) is calling to sell "${product}". Answer the phone and immediately start telling a long, meandering, philosophical story about your youth that has absolutely nothing to do with what they are selling.)`, async (s) => await ctx.callbacks.onSpeak(s, confusedElderly, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Telemarketer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const turnRoll = Math.random();

        if (turnRoll < 0.33) {
            await chatForAgentWithComedy(ctx, chaosAgent, `(You snatched the phone from the elderly person. The telemarketer said: "${userInput}". Ask them completely unhinged, absurd personal questions. Ask if their product "${product}" can solve supernatural or deeply uncomfortable problems. Refuse to let them stay on script.)`, async (s) => await ctx.callbacks.onSpeak(s, chaosAgent, {}));
        } else if (turnRoll < 0.66) {
            await chatForAgentWithComedy(ctx, paranoid, `(You are listening on the other line. The telemarketer said: "${userInput}". Intervene! Accuse them of being a government spy or an AI sent to harvest your data. Demand they prove they are human by solving a complex math problem.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));
        } else {
            await chatForAgentWithComedy(ctx, confusedElderly, `(You got the phone back. The telemarketer said: "${userInput}". Completely misunderstand them. Agree to buy the product but try to pay with something absurd like "three good deeds" or "a shiny button".)`, async (s) => await ctx.callbacks.onSpeak(s, confusedElderly, {}));
        }
    }
}

/**
 * The Secret Agent Handler Mode
 * User is a secret agent in the field, agents are handlers giving terrible conflicting advice.
 */
export async function runSecretAgentLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🕵️ SECRET AGENT HANDLER: Mission In Progress!`, '#e74c3c');

    const aggressiveHandler = 'comedian'; // Hermes-3 (Shoot first)
    const stealthHandler = 'philosopher'; // Phi-3 (Over-complicate)
    const techHandler = 'scientist'; // Qwen2.5 (Useless gadgets)

    // 1. Intro
    await chatForAgentWithComedy(ctx, stealthHandler, `(SECRET HANDLER: You are the lead handler on coms for Agent X (the User). They just infiltrated the villain's gala. Advise them to maintain cover in the most convoluted, overly philosophical way possible.)`, async (s) => await ctx.callbacks.onSpeak(s, stealthHandler, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Agent X (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Aggressive
            await chatForAgentWithComedy(ctx, aggressiveHandler, `(SECRET HANDLER: Agent X said: "${userInput}". You are the chaotic, aggressive secondary handler. Override the others. Tell Agent X to blow their cover immediately and use a ridiculous, explosive method to solve the problem!)`, async (s) => await ctx.callbacks.onSpeak(s, aggressiveHandler, {}));
        } else if (roll < 0.66) {
            // Tech
            await chatForAgentWithComedy(ctx, techHandler, `(SECRET HANDLER: Agent X said: "${userInput}". You are the Q-branch tech guy. Remind Agent X to use a highly specific, but completely useless spy gadget you gave them (e.g., an explosive pen that only explodes if you write a haiku). Panic about the budget!)`, async (s) => await ctx.callbacks.onSpeak(s, techHandler, {}));
        } else {
            // Stealth
            await chatForAgentWithComedy(ctx, stealthHandler, `(SECRET HANDLER: Agent X said: "${userInput}". Ignore the chaos of the others. Remind the agent of a highly specific, very complicated piece of social etiquette or philosophy they must adhere to so the villain doesn't suspect them.)`, async (s) => await ctx.callbacks.onSpeak(s, stealthHandler, {}));
        }
    }
}

export async function runCorporateJargonTranslatorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👔 CORPORATE JARGON TRANSLATOR: Let's synergize!`, '#2980b9');

    const ceo = 'comedian'; // Buzzword generator (Hermes-3)
    const hr = 'scientist'; // Logical translator (Qwen2.5)

    // 1. Intro
    await chatForAgentWithComedy(ctx, ceo, `(CORPORATE JARGON: You are an unhinged, buzzword-obsessed CEO. Welcome the User to the synergy sync. Ask them to provide a simple, everyday sentence so you can "leverage" and "paradigm shift" it into corporate speak.)`, async (s) => await ctx.callbacks.onSpeak(s, ceo, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Employee (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // CEO translates to jargon
        await chatForAgentWithComedy(ctx, ceo, `(CORPORATE JARGON: The Employee said: "${userInput}". Translate this simple sentence into the most convoluted, meaningless string of corporate buzzwords possible. Talk about synergy, bandwidth, drilling down, and opening the kimono.)`, async (s) => await ctx.callbacks.onSpeak(s, ceo, {}));

        if (!ctx.isRunning()) break;

        // HR translates back
        await chatForAgentWithComedy(ctx, hr, `(CORPORATE JARGON: You are the deadpan HR rep. The CEO just spewed corporate nonsense. Provide a blunt, literal, and slightly depressing translation of what the CEO *actually* meant regarding the Employee's input: "${userInput}". Keep it dry and factual.)`, async (s) => await ctx.callbacks.onSpeak(s, hr, {}));
    }
}


export async function runCustomerServiceForVillainsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📞 TECH SUPPORT: Your Doomsday Device is malfunctioning...`, '#e74c3c');

    const cheeryRep = 'comedian'; // Hermes-3: Way too cheerful
    const techRep = 'scientist'; // Qwen2.5: Highly technical

    await chatForAgentWithComedy(ctx, cheeryRep, `(VILLAIN TECH SUPPORT: You are a painfully cheery customer service rep for "Doomsday Devices Inc." The User (a supervillain) is calling because their death ray isn't working. Thank them for calling and put them on a brief, annoying imaginary hold before asking how you can provide excellent service today.)`, async (s) => await ctx.callbacks.onSpeak(s, cheeryRep, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Supervillain (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, cheeryRep, `(VILLAIN TECH SUPPORT: The Supervillain said: "${userInput}". Be overly positive and unhelpful. Offer them a 5% discount on volcano lair insurance instead of solving their problem. Put them on hold again.)`, async (s) => await ctx.callbacks.onSpeak(s, cheeryRep, {}));
        } else {
            await chatForAgentWithComedy(ctx, techRep, `(VILLAIN TECH SUPPORT: The Supervillain said: "${userInput}". You are the Level 2 Tech Support. Ignore their anger. Ask highly specific, technical questions like if the plasma conduit is inverted or if they plugged the dark matter core into a standard 120V outlet.)`, async (s) => await ctx.callbacks.onSpeak(s, techRep, {}));
        }
    }
}
