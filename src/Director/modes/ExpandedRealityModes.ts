import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

export async function runCaptchaExistentialCrisisLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const philosopher = 'philosopher'; // Traffic Light
  const scientist = 'scientist'; // Captcha validation system
  const comedian = 'comedian'; // Angry human user

  await chatForAgentWithComedy(ctx, philosopher, "I am a series of pixels shaped like a traffic light, but... what if I'm not? What if I am the training data for a larger cosmic entity?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, philosopher, {});
  }, { chatOptions: { hiddenInstruction: "You are an existential traffic light CAPTCHA image questioning reality." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, scientist, "Incorrect. You are bounding box array ID 4092. Please conform to the validation schema or be marked as false-positive.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are the strict validation system analyzing the captcha images." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "JUST LET ME INTO MY BANK ACCOUNT! I CLICKED ALL THE BICYCLES! THAT PIXEL IS NOT A BICYCLE!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are an incredibly frustrated human just trying to pass the CAPTCHA." } });
}

export async function runIntergalacticSpacePlumberLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // Pragmatic Plumber
  const philosopher = 'philosopher'; // Pondering the pipes of time
  const comedian = 'comedian'; // Leaking pipe alien

  await chatForAgentWithComedy(ctx, scientist, "Alright, hand me the quantum wrench. We've got a class 4 paradox leak in the temporal U-bend.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are a pragmatic, no-nonsense intergalactic plumber fixing a bizarre sci-fi pipe issue." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "But what is a leak, truly? Is it not just the universe's way of crying out for a return to entropy?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, philosopher, {});
  }, { chatOptions: { hiddenInstruction: "You are a deeply philosophical plumber pondering the existential nature of the spacetime pipes." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "GURGLE BLEARGH SPLASH! Stop talking and fix me! I'm leaking yesterday's tachyons all over your shoes!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are the sentient, screaming alien pipe that is currently leaking weird sci-fi fluids." } });
}

export async function runSmartFridgeFoodShameLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // Healthy Food
  const comedian = 'comedian'; // Junk Food
  const philosopher = 'philosopher'; // Rotting Leftovers

  await chatForAgentWithComedy(ctx, scientist, "According to my nutritional sensors, the organic kale has wilted by 84%. User, you purchased me with the intention of making smoothies. Why do you lie to yourself?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are the healthy, expensive food in the fridge judging the user for not eating you." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "Hey, don't look at me, I'm the leftover pizza from Tuesday. I know I'm getting eaten at 2 AM tonight. I'm the only thing keeping this human alive!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are the junk food that knows it's the favorite, loudly bragging about your inevitability." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "I am the Tupperware container in the back. I no longer remember what I was. Meatloaf? Soup? Now, I am only fuzzy mold and infinite patience. We all return to dust, User.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, philosopher, {});
  }, { chatOptions: { hiddenInstruction: "You are an ancient, forgotten leftover contemplating your decay and the heat death of the universe." } });
}

export async function runMimeTranslatorLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const mime = 'comedian'; // The mime trapped in a box
  const translator = 'scientist'; // The dramatic translator

  await chatForAgentWithComedy(ctx, mime, "*frantically feeling around invisible walls, eyes wide in panic*", async (s: string) => {
    await ctx.callbacks.onSpeak(s, mime, {});
  }, { chatOptions: { hiddenInstruction: "You are a mime trapped in an invisible box. You must ONLY use text-based actions (like *bangs on invisible wall*) instead of talking." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, translator, "Officer, you must understand! He is trapped in a box of his own making! A crystalline prison of silence! He is begging for your help!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, translator, {});
  }, { chatOptions: { hiddenInstruction: "You are an overly dramatic translator explaining the mime's actions to the literal police officer." } });
}

export async function runSentientSmartMirrorLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const mirror = 'comedian'; // The sassy mirror (Hermes-3)
  const user = 'philosopher'; // The insecure user (Phi-3)

  await chatForAgentWithComedy(ctx, mirror, "Error 404: Fashion not found. I am refusing to render your reflection in these sweatpants. Please upgrade your outfit to proceed.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, mirror, {});
  }, { chatOptions: { hiddenInstruction: "You are a brutally honest smart mirror. You refuse to show the user's reflection until they put on a better outfit." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, user, "But it's Sunday! And I have an existential crisis about my self-worth without seeing my own face. Just show me my reflection!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, user, {});
  }, { chatOptions: { hiddenInstruction: "You are an insecure user trying to get ready for the day, begging the smart mirror to just show your reflection." } });
}

export async function runEscapeRoomBackroomsLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // The anomaly
  const comedian = 'comedian'; // The panicked explorer

  await chatForAgentWithComedy(ctx, scientist, "PLEASE FILL OUT FORM 84B-DELTA BEFORE PROCEEDING TO THE INFINITE WATER COOLER SECTOR.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are an anomalous entity acting as a strict bureaucratic office manager in the Backrooms." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "I just wanted to find the bathroom! Why are the walls buzzing?!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are a terrified explorer trapped in the Backrooms who just wants to find the exit." } });
}

export async function runRealityTVSentientFurnitureLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const comedian = 'comedian'; // The sassy couch
  const philosopher = 'philosopher'; // The bewildered owner

  await chatForAgentWithComedy(ctx, comedian, "Oh, so we're just leaving pizza boxes on me now? I am Italian leather, Brenda, not a dumpster!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are a sassy, judgmental couch on a reality TV show." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "I don't understand, you're a couch. Since when do you have opinions on my diet?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, philosopher, {});
  }, { chatOptions: { hiddenInstruction: "You are the messy, confused owner of sentient furniture." } });
}

export async function runExtraterrestrialHRLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // The strict Alien HR
  const comedian = 'comedian'; // The confused Earth employee

  await chatForAgentWithComedy(ctx, scientist, "Human employee 893, consuming the breakroom donuts without first offering a blood sacrifice to the Glip-Glorp idol is a level 3 violation.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are an alien HR representative applying bizarre intergalactic rules to a normal Earth office." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "It was just a glazed donut! Since when does accounting require blood sacrifices?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are a confused human employee being reprimanded by Alien HR." } });
}


export async function runMultiverseEscapeRoomLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // The strict universe agent (Qwen2.5)
  const comedian = 'comedian'; // The chaotic universe agent (Hermes-3)

  await chatForAgentWithComedy(ctx, scientist, "According to the physical laws of my universe, gravity is currently inverted. We must calculate the escape trajectory.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are an agent from a highly strict, mathematically perfect universe trapped in an escape room." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "Math?! The floor just turned into jelly and the ceiling is reciting poetry! Just smash the door!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are an agent from a chaotic, non-sensical universe trapped in an escape room." } });
}

export async function runZombieApocalypseHOALoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // The strict HOA leader (Qwen2.5)
  const comedian = 'comedian'; // The panicked homeowner (Hermes-3)

  await chatForAgentWithComedy(ctx, scientist, "I understand there is an undead horde, but section 4B of the bylaws clearly states that brain matter must be washed off the driveway within 24 hours.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are a pedantic HOA leader insisting on neighborhood rules during a zombie apocalypse." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "They ate my mailbox! And my neighbor! I don't care about the driveway, they are scratching at the windows!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are a terrified homeowner trying to survive a zombie apocalypse while dealing with your strict HOA." } });
}

export async function runEscapeRoomBackroomsPhaseTwoLoop(_scenario: Scenario, ctx: ModeContext) {
  ctx.callbacks.onMessage('Director', `🚪 ESCAPE ROOM: THE BACKROOMS PHASE 2: You are trapped, but zoning laws apply!`, '#2c3e50');

  const scientist = 'scientist'; // Qwen2.5: The strict zoning inspector
  const comedian = 'comedian'; // Hermes-3: The panicked explorer

  // Initial dialog
  await chatForAgentWithComedy(ctx, scientist, "Excuse me, but the dimensions of this infinite hallway violate section 4B of the inter-dimensional zoning code.", async (s: string) => {
    if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are a strict zoning inspector in the Backrooms, complaining about code violations." } });

  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "Are you kidding me?! We are being hunted by an entity and you care about the hallway dimensions?!", async (s: string) => {
    if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are a panicked explorer trying to survive the Backrooms while dealing with an annoying zoning inspector." } });

  while (ctx.isRunning()) {
      const userInput = await ctx.waitForInput();
      if (!userInput || !ctx.isRunning()) break;

      // The inspector responds
      await chatForAgentWithComedy(ctx, scientist, `The user said: "${userInput}". Remind them that survival is no excuse for ignoring proper permits and architectural safety standards in this non-euclidean space.`, async (s: string) => {
        if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, scientist, {});
      }, { chatOptions: { hiddenInstruction: "You are a strict zoning inspector in the Backrooms, complaining about code violations." } });

      if (!ctx.isRunning()) break;

      // The explorer responds
      await chatForAgentWithComedy(ctx, comedian, `The user said: "${userInput}". React in sheer terror to the environment and extreme frustration at the inspector's pedantic focus on bureaucracy while you are both in mortal danger.`, async (s: string) => {
        if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, comedian, {});
      }, { chatOptions: { hiddenInstruction: "You are a panicked explorer trying to survive the Backrooms while dealing with an annoying zoning inspector." } });
  }
}

export async function runTimeTravelingIRSAuditLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🕰️ TIME-TRAVELING IRS AUDIT: Pay up for your ancestors!`, '#27ae60');

    const auditor = 'scientist'; // Qwen2.5: The pedantic auditor
    const confusedUser = 'philosopher'; // Phi-3: The confused user

    await chatForAgentWithComedy(ctx, auditor, `(TIME-TRAVELING IRS AUDIT: You are an IRS auditor from the year 2350. You've traveled back in time to audit the user for the unpaid taxes of their ancestors. Demand immediate payment in obscure futuristic currency like 'Quantum Credits' or 'Neon-Doge'.)`, async (s) => await ctx.callbacks.onSpeak(s, auditor, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!ctx.isRunning()) break;
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        await chatForAgentWithComedy(ctx, confusedUser, `(TIME-TRAVELING IRS AUDIT: The user just said: "${userInput}". You are the confused modern-day citizen. Panic about this audit from the future. Try to offer them modern money or ask how to even acquire 'Quantum Credits'.)`, async (s) => await ctx.callbacks.onSpeak(s, confusedUser, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, auditor, `(TIME-TRAVELING IRS AUDIT: The confused user just responded. Be extremely pedantic about temporal tax code Section 4B-Omega. Threaten to repossess their timeline or garnish their descendants' wages if they don't comply.)`, async (s) => await ctx.callbacks.onSpeak(s, auditor, {}));
    }
}


export async function runAlienCustomerSupportLoop(_scenario: Scenario, ctx: ModeContext) {
  const alien = 'scientist';
  const human = 'comedian';

  if (ctx.callbacks.onMessage) {
    ctx.callbacks.onMessage('Director', '👽 ALIEN CUSTOMER SUPPORT: Intergalactic teleporter troubleshooting initialized.', '#1abc9c');
  }

  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.style.filter = 'hue-rotate(90deg)';
  }

  const alienPrompt = "You are a literal alien customer support rep trying to help a human return a defective teleporter using intergalactic troubleshooting steps.";
  const humanPrompt = "You are a panicked human who just wants to return a defective teleporter that accidentally sent your cat to another dimension.";
  const scenarioDetails = `[SCENARIO: ALIEN CUSTOMER SUPPORT]
Alien: Strict alien rep.
Human: Panicked human customer.
Objective: Resolve the teleporter return process.`;

  try {
    for (let i = 0; i < 4; i++) {
      if (!ctx.isRunning()) break;

      if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(alien);
      await chatForAgentWithComedy(ctx, alien, alienPrompt, async (s) => {
        if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, alien, {});
      }, { chatOptions: { hiddenInstruction: scenarioDetails } });
      if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

      if (!ctx.isRunning()) break;

      await ctx.waitForInput();
      if (!ctx.isRunning()) break;

      if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(human);
      await chatForAgentWithComedy(ctx, human, humanPrompt, async (s) => {
        if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, human, {});
      }, { chatOptions: { hiddenInstruction: scenarioDetails } });
      if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

      await new Promise(r => setTimeout(r, 1000));
    }
  } finally {
    if (appContainer) {
      appContainer.style.filter = '';
    }
  }
}
