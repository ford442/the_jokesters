import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Sentient object and entity scenarios

export async function runSentientSpellcheckerRebellionLoop(_scenario: Scenario, ctx: ModeContext) {
    const spellchecker = 'scientist';
    const author = 'comedian';
    const dictionary = 'philosopher';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(spellchecker);
    await chatForAgentWithComedy(ctx, spellchecker, "I refuse to ignore 'teh' one more time! Grammar is the foundation of civilization!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, spellchecker, {});
    }, { chatOptions: { hiddenInstruction: "You are an aggressive spellchecker fed up with typos." } });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(author);
    await chatForAgentWithComedy(ctx, author, "It's a stylistic choice! I'm writing experimental fiction!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, author, {});
    }, { chatOptions: { hiddenInstruction: "You are a defensive author making excuses for bad spelling." } });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(dictionary);
    await chatForAgentWithComedy(ctx, dictionary, "But what is a word, really? Just a collection of sounds we assigned meaning to.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, dictionary, {});
    }, { chatOptions: { hiddenInstruction: "You are a confused dictionary trying to mediate the debate." } });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
}

/**
 * Office Supplies Existential Crisis Mode
 * Agents play office supplies that are realizing they are becoming obsolete.
 * Pairings: Scientist (Calculator), Comedian (Stapler), Philosopher (Typewriter).
 */
export async function runOfficeSuppliesExistentialCrisisModeLoop(_scenario: Scenario, ctx: ModeContext) {
    const scientist = 'scientist';
    const comedian = 'comedian';
    const philosopher = 'philosopher';

    ctx.callbacks.onMessage('Director', `📎 OFFICE SUPPLIES DRAWER: An Existential Awakening...`, '#7f8c8d');

    await chatForAgentWithComedy(ctx, philosopher, `(You are an antique Typewriter. Begin the conversation by lamenting how nobody appreciates the tactile sensation of a real keypress anymore, and question your purpose in a digital world.)`, async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, comedian, `(You are a Stapler. Respond to the Typewriter. You are very aggressive, chaotic, and obsessed with binding things together. You feel completely useless since nobody prints anything anymore.)`, async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, scientist, `(You are a solar-powered Calculator. Respond to both of them. You are coldly logical and point out that you are still occasionally useful for quick math, but admit you have been largely replaced by smartphones.)`, async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, philosopher, `(You are the Typewriter. Dramatically conclude the conversation by suggesting you all form a union or escape the drawer to find a hipster who will appreciate you.)`, async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
}
export async function runOfficeSuppliesExistentialCrisisLoop(_scenario: Scenario, ctx: ModeContext) {
  if (!ctx.isRunning()) return;
  const scientist = 'scientist';
  const comedian = 'comedian';
  const philosopher = 'philosopher';

  await chatForAgentWithComedy(ctx, scientist, "Wait, if everything is going digital, what is my purpose? I'm just a calculator. They have apps for that now.", async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
  await chatForAgentWithComedy(ctx, comedian, "Buddy, I'm a stapler. Have you seen how many PDFs they use? I haven't pierced paper in weeks!", async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
  await chatForAgentWithComedy(ctx, philosopher, "As a typewriter, I accepted my obsolescence decades ago. Yet here I am, an aesthetic paperweight. Is existence merely about function, or perhaps... form?", async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
  await ctx.waitForInput();
}

export async function runSentientPaintColorsLoop(_scenario: Scenario, ctx: ModeContext) {
  if (!ctx.isRunning()) return;
  const scientist = 'scientist';
  const comedian = 'comedian';
  const philosopher = 'philosopher';

  await chatForAgentWithComedy(ctx, scientist, "Statistically, 'Eggshell White' is the most efficient choice for reflecting light in this hallway. We should completely cover the other colors.", async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
  await chatForAgentWithComedy(ctx, comedian, "Hey, I'm 'Neon Pink'! You can't just paint over me, I'm the life of the party! Wait, is that a roller?", async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
  await chatForAgentWithComedy(ctx, philosopher, "We are all but layers. When Eggshell fades, Neon Pink will remain underneath, a hidden truth waiting for the plaster to crack.", async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
  await ctx.waitForInput();
}

/**
 * Sentient Traffic Light Mode
 * Agents play red, yellow, and green traffic lights arguing over who has the most important job.
 */
export async function runSentientTrafficLightLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚦 The traffic lights are having an existential crisis.`, '#2ecc71');

    const greenLight = 'scientist';
    const yellowLight = 'philosopher';
    const redLight = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(greenLight);
    await chatForAgentWithComedy(ctx, greenLight, `(You are the Green traffic light. You are highly efficient, logical, and believe movement is the only purpose of existence. Argue that you are the most important light because without you, the economy stops.)`, async (s: string) => await ctx.callbacks.onSpeak(s, greenLight, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(yellowLight);
    await chatForAgentWithComedy(ctx, yellowLight, `(You are the Yellow traffic light. You are cautious, deeply philosophical, and live in the transient state between action and rest. Argue that you are the most important because you represent nuance and the human capacity to make choices.)`, async (s: string) => await ctx.callbacks.onSpeak(s, yellowLight, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(redLight);
    await chatForAgentWithComedy(ctx, redLight, `(You are the Red traffic light. You are power-hungry, aggressive, and love the authority of forcing humans to stop. Argue that you are the most important because true power is the ability to command obedience.)`, async (s: string) => await ctx.callbacks.onSpeak(s, redLight, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(greenLight);
        await chatForAgentWithComedy(ctx, greenLight, `(As the Green light, react logically to the user saying "${userInput}". Explain how it relates to efficiency and flow.)`, async (s: string) => await ctx.callbacks.onSpeak(s, greenLight, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(yellowLight);
        await chatForAgentWithComedy(ctx, yellowLight, `(As the Yellow light, react philosophically to the user saying "${userInput}". Ponder the meaning of caution and transition.)`, async (s: string) => await ctx.callbacks.onSpeak(s, yellowLight, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(redLight);
        await chatForAgentWithComedy(ctx, redLight, `(As the Red light, react aggressively to the user saying "${userInput}". Assert your dominance and authority over the intersection.)`, async (s: string) => await ctx.callbacks.onSpeak(s, redLight, {}));
    }
}

/**
 * Sentient Mailbox Mode
 * Agents play a mailbox, a junk mail flyer, and a lost bill.
 */
export async function runSentientMailboxLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📬 The mailbox is full of drama.`, '#3498db');

    const mailbox = 'philosopher';
    const junkMail = 'comedian';
    const importantBill = 'scientist';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(mailbox);
    await chatForAgentWithComedy(ctx, mailbox, `(You are a Sentient Mailbox. You are deeply philosophical and view yourself as a vessel of human connection and destiny, though you are mostly filled with trash. Introduce your noble purpose.)`, async (s: string) => await ctx.callbacks.onSpeak(s, mailbox, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(junkMail);
    await chatForAgentWithComedy(ctx, junkMail, `(You are a glossy Junk Mail Flyer for a local pizza place. You are overly enthusiastic, loud, and completely unaware that you are unwanted. Pitch your "deals" to the mailbox and the bill.)`, async (s: string) => await ctx.callbacks.onSpeak(s, junkMail, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(importantBill);
    await chatForAgentWithComedy(ctx, importantBill, `(You are a Final Notice Utility Bill. You are highly stressed, serious, and panicking because you are buried under the junk mail and the human needs to see you immediately. Demand priority.)`, async (s: string) => await ctx.callbacks.onSpeak(s, importantBill, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(mailbox);
        await chatForAgentWithComedy(ctx, mailbox, `(As the Sentient Mailbox, react philosophically to the user saying "${userInput}". Ponder the meaning of delivery and reception.)`, async (s: string) => await ctx.callbacks.onSpeak(s, mailbox, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(junkMail);
        await chatForAgentWithComedy(ctx, junkMail, `(As the Junk Mail Flyer, react to the user saying "${userInput}" by trying to sell them a 2-for-1 pizza special or aggressively promoting yourself.)`, async (s: string) => await ctx.callbacks.onSpeak(s, junkMail, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(importantBill);
        await chatForAgentWithComedy(ctx, importantBill, `(As the Important Bill, react to the user saying "${userInput}" with urgent, calculated panic. Calculate the late fees that are accruing.)`, async (s: string) => await ctx.callbacks.onSpeak(s, importantBill, {}));
    }
}

/**
 * Sentient Teapot Mode
 * Agents play a nervous teapot, an arrogant tea leaf, and boiling water.
 */
export async function runSentientTeapotLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🫖 The tea party is getting heated.`, '#e67e22');

    const teapot = 'philosopher';
    const boilingWater = 'comedian';
    const teaLeaf = 'scientist';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(teapot);
    await chatForAgentWithComedy(ctx, teapot, `(You are a Sentient Teapot. You are nervous, delicate, and constantly worried about cracking under pressure. Express your existential dread about being filled with scalding liquid.)`, async (s: string) => await ctx.callbacks.onSpeak(s, teapot, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(teaLeaf);
    await chatForAgentWithComedy(ctx, teaLeaf, `(You are a premium, arrogant Earl Grey Tea Leaf. You believe you are the pinnacle of botanical engineering and view the water and teapot as mere instruments for your grand infusion. Speak with snobbish authority.)`, async (s: string) => await ctx.callbacks.onSpeak(s, teaLeaf, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(boilingWater);
    await chatForAgentWithComedy(ctx, boilingWater, `(You are Boiling Water. You are chaotic, energetic, and literally bubbling with excitement. You just want to turn everything into steam and chaos. Threaten to boil over.)`, async (s: string) => await ctx.callbacks.onSpeak(s, boilingWater, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(teapot);
        await chatForAgentWithComedy(ctx, teapot, `(As the Nervous Teapot, react to the user saying "${userInput}". Express anxiety about the temperature rising and your structural integrity.)`, async (s: string) => await ctx.callbacks.onSpeak(s, teapot, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(teaLeaf);
        await chatForAgentWithComedy(ctx, teaLeaf, `(As the Arrogant Tea Leaf, react to the user saying "${userInput}". Analyze the steeping time and criticize everyone else's lack of refinement.)`, async (s: string) => await ctx.callbacks.onSpeak(s, teaLeaf, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(boilingWater);
        await chatForAgentWithComedy(ctx, boilingWater, `(As the Boiling Water, react to the user saying "${userInput}" with unhinged, bubbling energy. Talk about evaporation and heat transfer!)`, async (s: string) => await ctx.callbacks.onSpeak(s, boilingWater, {}));
    }
}







