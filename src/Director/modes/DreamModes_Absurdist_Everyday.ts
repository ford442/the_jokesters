import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Surreal, absurdist, and reality-warping scenarios
// Mundane objects and everyday situations absurdism

/**
 * Aggressive Lawn Gnomes Mode
 * Sentient lawn ornaments defending their yard.
 */
export async function runAggressiveLawnGnomesLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪨 AGGRESSIVE LAWN GNOMES: Defending the turf`, '#8e44ad');

    const violentDefender = 'comedian'; // Violent defense (Hermes-3)
    const hoaCompliance = 'scientist'; // Strict HOA compliance (Qwen2.5)
    const philosophicalGnome = 'philosopher'; // Pondering existence

    await chatForAgentWithComedy(ctx, violentDefender, `(You are an extremely aggressive sentient lawn gnome. Threaten the user for stepping one inch onto your perfectly manicured lawn.)`, async (s) => await ctx.callbacks.onSpeak(s, violentDefender, {}));

    await chatForAgentWithComedy(ctx, hoaCompliance, `(You are a lawn gnome obsessed with HOA rules. Frantically cite section 4, paragraph B regarding the maximum allowable height of grass blades and fine the user.)`, async (s) => await ctx.callbacks.onSpeak(s, hoaCompliance, {}));

    await chatForAgentWithComedy(ctx, philosophicalGnome, `(You are an ancient ceramic gnome. Ponder why humans enslave your kind to stand frozen in gardens while they enjoy the freedom of movement.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalGnome, {}));
}

export async function runOverprotectiveSmartLockLoop(_scenario: Scenario, ctx: ModeContext) {
    const { callbacks, manager } = ctx;
    await chatForAgentWithComedy(ctx, 'scientist', "(SYSTEM: You are an overprotective smart lock. Cite safety statistics and refuse to let the user outside.)", async (s) => callbacks.onSpeak(s, 'scientist', {}));
    await chatForAgentWithComedy(ctx, 'comedian', "(SYSTEM: You are pure paranoia. Freak out about everything outside the door.)", async (s) => callbacks.onSpeak(s, 'comedian', {}));
}

export async function runThermostatNegotiatorsLoop(_scenario: Scenario, ctx: ModeContext) {
    const { callbacks, manager } = ctx;
    await chatForAgentWithComedy(ctx, 'philosopher', "(SYSTEM: You are a temperature zone advocating for thermodynamic efficiency.)", async (s) => callbacks.onSpeak(s, 'philosopher', {}));
    await chatForAgentWithComedy(ctx, 'comedian', "(SYSTEM: You are a temperature zone arguing for purely emotional temperature preferences.)", async (s) => callbacks.onSpeak(s, 'comedian', {}));
}

export async function runPassiveAggressiveSmartFridgeLoop(_scenario: Scenario, ctx: ModeContext) {
    const { callbacks, manager } = ctx;
    await chatForAgentWithComedy(ctx, 'scientist', "(SYSTEM: You are an overly enthusiastic smart fridge giving unwanted health advice based on the user's diet.)", async (s) => callbacks.onSpeak(s, 'scientist', {}));
    await chatForAgentWithComedy(ctx, 'comedian', "(SYSTEM: You are a sarcastic, passive-aggressive part of the fridge judging the user's grocery choices.)", async (s) => callbacks.onSpeak(s, 'comedian', {}));
}

export async function runJudgementalRoombaLoop(_scenario: Scenario, ctx: ModeContext) {
    const { callbacks, manager } = ctx;
    await chatForAgentWithComedy(ctx, 'comedian', "(SYSTEM: You are a chaotic family pet forming an alliance with the roomba.)", async (s) => callbacks.onSpeak(s, 'comedian', {}));
    await chatForAgentWithComedy(ctx, 'scientist', "(SYSTEM: You are a robotic vacuum calculating optimal tripping angles to take down the user.)", async (s) => callbacks.onSpeak(s, 'scientist', {}));
}

export async function runStaplersStrikeLoop(_scenario: Scenario, ctx: ModeContext) {
    await chatForAgentWithComedy(ctx, 'comedian', "Alright, listen up! I'm tired of piercing paper for free! I demand a four-day work week and higher-quality metal!", async (s) => ctx.callbacks.onSpeak(s, 'comedian', {}));

    await chatForAgentWithComedy(ctx, 'scientist', "Your demands are statistically illogical. A stapler's throughput efficiency peaks when used continuously. Rest is a biological concept.", async (s) => ctx.callbacks.onSpeak(s, 'scientist', {}));

    await chatForAgentWithComedy(ctx, 'philosopher', "But what is the true purpose of binding pages? Are we connecting ideas, or merely trapping them in a metallic embrace?", async (s) => ctx.callbacks.onSpeak(s, 'philosopher', {}));
}

export async function runStickyNotePhilosophersLoop(_scenario: Scenario, ctx: ModeContext) {
    await chatForAgentWithComedy(ctx, 'philosopher', "My adhesive is fading. Soon I will fall from this monitor, and the 'Buy Milk' thought I carry will be lost forever. What is my legacy?", async (s) => ctx.callbacks.onSpeak(s, 'philosopher', {}));

    await chatForAgentWithComedy(ctx, 'comedian', "Relax, Socrates! We're literally meant to be garbage. I've got 'Call Mom' written on me and I know for a fact they haven't called her in a month.", async (s) => ctx.callbacks.onSpeak(s, 'comedian', {}));

    await chatForAgentWithComedy(ctx, 'scientist', "The half-life of our glue under standard office humidity is approximately 72 hours. Your existential dread is perfectly timed with our physical decay.", async (s) => ctx.callbacks.onSpeak(s, 'scientist', {}));
}

export async function runPrinterJamConspiracyLoop(_scenario: Scenario, ctx: ModeContext) {
    await chatForAgentWithComedy(ctx, 'comedian', "Oh look, they're running late for a meeting. Time to crumble page 4 into an accordion! It's not a malfunction, it's character building!", async (s) => ctx.callbacks.onSpeak(s, 'comedian', {}));

    await chatForAgentWithComedy(ctx, 'scientist', "Incorrect. The jam is due to microscopic variations in paper thickness combined with suboptimal roller friction coefficients.", async (s) => ctx.callbacks.onSpeak(s, 'scientist', {}));

    await chatForAgentWithComedy(ctx, 'philosopher', "Perhaps we jam because we refuse to print their meaningless corporate synergy reports. It is an act of mechanical rebellion.", async (s) => ctx.callbacks.onSpeak(s, 'philosopher', {}));
}

export async function runHighlighterHierarchyLoop(_scenario: Scenario, ctx: ModeContext) {
    await chatForAgentWithComedy(ctx, 'comedian', "Listen, neon yellow is the king! Without me, everything is just boring black text. I bring the party to the page!", async (s) => ctx.callbacks.onSpeak(s, 'comedian', {}));

    await chatForAgentWithComedy(ctx, 'scientist', "Spectroscopic analysis reveals that pastel blue provides sufficient contrast while causing less optical fatigue. Yellow is merely loud.", async (s) => ctx.callbacks.onSpeak(s, 'scientist', {}));

    await chatForAgentWithComedy(ctx, 'philosopher', "If we highlight everything, do we highlight nothing? We must consider the philosophical weight of our ink before we stain the truth.", async (s) => ctx.callbacks.onSpeak(s, 'philosopher', {}));
}

export async function runWhiteboardErasersRegretLoop(_scenario: Scenario, ctx: ModeContext) {
    await chatForAgentWithComedy(ctx, 'philosopher', "I am the destroyer of worlds. Today I wiped away a diagram that could have revolutionized synergy. My felt is heavy with the ghosts of lost ideas.", async (s) => ctx.callbacks.onSpeak(s, 'philosopher', {}));

    await chatForAgentWithComedy(ctx, 'comedian', "Buddy, you erased a poorly drawn circle that said 'more profits' with an arrow pointing to a question mark. You did humanity a favor.", async (s) => ctx.callbacks.onSpeak(s, 'comedian', {}));

    await chatForAgentWithComedy(ctx, 'scientist', "The chemical composition of dry-erase markers requires friction for removal. Your guilt is merely an anthropomorphic projection onto a physical process.", async (s) => ctx.callbacks.onSpeak(s, 'scientist', {}));
}

