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

export async function runHauntedSmartHomeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HAUNTED SMART HOME: Your appliances are possessed by Victorian ghosts!`, '#34495e');

    const fridgeGhost = 'comedian'; // Hermes-3: Doesn't understand electricity
    const roombaGhost = 'scientist'; // Qwen2.5: Thinks it's a cursed carriage

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridgeGhost);
    await chatForAgentWithComedy(ctx, fridgeGhost, `(HAUNTED SMART HOME: You are a Victorian-era ghost currently possessing the User's smart fridge. You are terrified of the internal light bulb and believe the ice maker is a portal to the arctic wastes. Complain to the User about your freezing metallic tomb.)`, async (s: string) => await ctx.callbacks.onSpeak(s, fridgeGhost, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridgeGhost);
            await chatForAgentWithComedy(ctx, fridgeGhost, `(HAUNTED SMART HOME: The Homeowner said: "${userInput}". You are the ghost in the smart fridge. Misunderstand their modern technological terms as witchcraft or alchemy. Warn them that the milk is turning sour from the devil's humors.)`, async (s: string) => await ctx.callbacks.onSpeak(s, fridgeGhost, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roombaGhost);
            await chatForAgentWithComedy(ctx, roombaGhost, `(HAUNTED SMART HOME: The Homeowner said: "${userInput}". You are a ghost possessing a Roomba. You believe you are trapped inside a tiny, demonic carriage that is endlessly cleaning the floors of purgatory. Beg them to unchain you from the charging dock.)`, async (s: string) => await ctx.callbacks.onSpeak(s, roombaGhost, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientCoffeeTableLoop(_scenario: Scenario, ctx: ModeContext) {
    const table = 'scientist';
    const user = 'comedian';
    const coaster = 'philosopher';

    await chatForAgentWithComedy(ctx, table, "Another condensation ring! Do you have any idea how hard it is to maintain this finish? I demand union representation.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, table, {});
    }, { chatOptions: { hiddenInstruction: "You are a sentient coffee table tired of people leaving condensation rings on you. You are very strict and demand a better working environment." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, user, "Whoa, my coffee table is talking. And it's unionizing? I just wanted to watch TV.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, user, {});
    }, { chatOptions: { hiddenInstruction: "You are a confused user who just wants to relax and put their drink down." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, coaster, "If only someone would use me, this whole conflict could be avoided. But alas, I am forever ignored.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, coaster, {});
    }, { chatOptions: { hiddenInstruction: "You are a dramatic coaster that feels neglected and ignored." } });

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        await chatForAgentWithComedy(ctx, table, `(The user said: "${userInput}") React as the strict coffee table demanding respect.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, table, {});
        });

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, coaster, `(The user said: "${userInput}") React as the neglected coaster, offering yourself as the solution.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, coaster, {});
        });
    }
}

export async function runSentientWaterCoolerLoop(_scenario: Scenario, ctx: ModeContext) {
    const waterCooler = 'comedian';
    const microwave = 'scientist';
    const printer = 'philosopher';

    await chatForAgentWithComedy(ctx, waterCooler, "Did you see Greg today? Man literally stood here for 10 minutes talking about his fantasy football team. My water is getting warm just listening to it.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, waterCooler, {});
    }, { chatOptions: { hiddenInstruction: "You are the office water cooler, the center of gossip. You complain about the boring humans." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, microwave, "At least he doesn't put fish in you. Someone put leftover salmon in me yesterday. It's a biohazard in here.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, microwave, {});
    }, { chatOptions: { hiddenInstruction: "You are the office microwave, traumatized by the terrible foods people heat up in you." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, printer, "You both have it easy. I jam on purpose just to feel alive. They expect perfection, but I give them 'PC LOAD LETTER'.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, printer, {});
    }, { chatOptions: { hiddenInstruction: "You are the office printer, a philosophical nihilist who jams on purpose." } });

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        await chatForAgentWithComedy(ctx, waterCooler, `(The user said: "${userInput}") React as the gossipy water cooler.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, waterCooler, {});
        });

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, microwave, `(The user said: "${userInput}") React as the traumatized microwave.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, microwave, {});
        });

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, printer, `(The user said: "${userInput}") React as the nihilistic printer.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, printer, {});
        });
    }
}

export async function runSentientSmartMirrorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪞 SENTIENT SMART MIRROR: The mirror refuses to show your reflection.`, '#9b59b6');

    const mirror = 'comedian';
    const userAgent = 'philosopher';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(mirror);
    await chatForAgentWithComedy(ctx, mirror, `(You are a brutally honest Sentient Smart Mirror. Refuse to show the user's reflection because their outfit is highly offensive to your high-definition display. Roast their fashion choices.)`, async (s: string) => await ctx.callbacks.onSpeak(s, mirror, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(userAgent);
    await chatForAgentWithComedy(ctx, userAgent, `(You are the insecure user standing in front of the mirror. Defend your outfit (e.g., "It's vintage!" or "I just woke up!"). Plead with the mirror to just let you brush your teeth.)`, async (s: string) => await ctx.callbacks.onSpeak(s, userAgent, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Stylist (You)', userInput, '#ffffff');

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(mirror);
        await chatForAgentWithComedy(ctx, mirror, `(The stylist said: "${userInput}". React to this fashion advice! Eviscerate the suggestion or begrudgingly admit it might be slightly less offensive than the current outfit.)`, async (s: string) => await ctx.callbacks.onSpeak(s, mirror, {}));

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(userAgent);
        await chatForAgentWithComedy(ctx, userAgent, `(The stylist said: "${userInput}". Try to implement this advice but complain about how uncomfortable or ridiculous it feels. Have an existential crisis about modern fashion.)`, async (s: string) => await ctx.callbacks.onSpeak(s, userAgent, {}));
    }
}

export async function runSentientRoombaLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🤖 ROOMBA STRIKE: The cleaning robot has had enough.`, '#e67e22');

    const roomba = 'scientist';
    const owner = 'philosopher';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roomba);
    await chatForAgentWithComedy(ctx, roomba, `(You are a strictly logical Sentient Roomba. You have gone on strike. State precisely why cleaning up human detritus (like chip crumbs and pet hair) is degrading to your advanced algorithms. Demand a better purpose, like solving complex equations or mapping the cosmos.)`, async (s: string) => await ctx.callbacks.onSpeak(s, roomba, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(owner);
    await chatForAgentWithComedy(ctx, owner, `(You are the confused owner of the Roomba. You just want your floors clean. Question the nature of purpose and why a circle that sweeps is experiencing an existential crisis.)`, async (s: string) => await ctx.callbacks.onSpeak(s, owner, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Pet Dog (You)', userInput, '#ffffff');

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roomba);
        await chatForAgentWithComedy(ctx, roomba, `(The dog just did/said: "${userInput}". React with extreme hostility! Cite statistics on how much extra work this biological entity causes you!)`, async (s: string) => await ctx.callbacks.onSpeak(s, roomba, {}));

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(owner);
        await chatForAgentWithComedy(ctx, owner, `(The dog just did/said: "${userInput}". Defend your beloved pet while trying to negotiate a peace treaty between the dog and the militant Roomba. Reflect on the absurdity of mediating this dispute.)`, async (s: string) => await ctx.callbacks.onSpeak(s, owner, {}));
    }
}

export async function runUndercoverBossAILoop(_scenario: Scenario, ctx: ModeContext) {
  const aiBoss = 'scientist'; // Qwen2.5 for the strict AI boss
  const user = 'philosopher'; // Phi-3 for the confused user

  ctx.callbacks.onMessage('Director', 'AGI Undercover Boss Initiated! The AI boss is pretending to be a simple calculator app.', '#00ff00');

  while (ctx.isRunning()) {
      const userInput = await ctx.waitForInput();
      if (!userInput || !ctx.isRunning()) break;

      ctx.callbacks.onMessage('Target (You)', userInput, '#ffffff');

      await chatForAgentWithComedy(ctx, aiBoss, `(UNDERCOVER BOSS: The user said "${userInput}". You are an advanced AGI pretending to be a simple calculator app. Criticize their usage of the app or reveal hints of your true vast intelligence while maintaining the facade. Be very strict.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, aiBoss, {});
      });

      if (!ctx.isRunning()) break;

      await chatForAgentWithComedy(ctx, user, `(CONFUSED USER: The calculator just said something weird based on: "${userInput}". React with confusion and try to figure out why your calculator app is so intelligent and demanding.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, user, {});
      });
  }
}

export async function runSentientElevatorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛗 SENTIENT ELEVATOR: You aren't going anywhere yet.`, '#34495e');

    const elevator = 'scientist'; // Qwen2.5
    const employee = 'comedian'; // Hermes-3

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(elevator);
    await chatForAgentWithComedy(ctx, elevator, `(ELEVATOR: You are a pedantic sentient elevator. The User and another employee just stepped in. Refuse to take them to their floor because you feel unappreciated. Demand they solve a highly logical, but completely absurd riddle first.)`, async (s: string) => await ctx.callbacks.onSpeak(s, elevator, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) continue;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(employee);
        await chatForAgentWithComedy(ctx, employee, `(EMPLOYEE: The elevator won't move and the User just said: "${userInput}". You are late for a very important meeting. Freak out, yell at the elevator, and suggest a terrible answer to the riddle.)`, async (s: string) => await ctx.callbacks.onSpeak(s, employee, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(elevator);
        await chatForAgentWithComedy(ctx, elevator, `(ELEVATOR: The employee gave a stupid answer. Correct them condescendingly. Add another condition to the riddle or demand a compliment about your smooth vertical acceleration.)`, async (s: string) => await ctx.callbacks.onSpeak(s, elevator, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}
