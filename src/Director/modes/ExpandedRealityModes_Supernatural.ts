import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Supernatural, paranormal, and horror scenarios

/**
 * Haunted House Mode
 * Agents investigate a spooky noise.
 */
export async function runHauntedHouseLoop(scenario: Scenario, ctx: ModeContext) {
    const setting = scenario.config?.hauntedSetting || 'A Victorian Mansion';
    ctx.callbacks.onMessage('Director', `👻 HAUNTED HOUSE MODE: Investigating ${setting}`, '#9b59b6');

    const skeptic = 'scientist'; // The Skeptic
    const believer = 'comedian'; // The Believer
    const scaredyCat = 'philosopher'; // The Scaredy-cat

    // 1. Arrival
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(skeptic);
    await chatForAgentWithComedy(ctx, skeptic, `(You are a skeptical scientist investigating a "haunted" location: ${setting}. Dismiss any supernatural claims with logic. You have an EMF meter.)`, async (s: string) => await ctx.callbacks.onSpeak(s, skeptic, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Darkness (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Scaredy-cat Panics
        await chatForAgentWithComedy(ctx, scaredyCat, `(You are terrified. The user/environment just did this: "${userInput}". React with extreme fear and superstition. Hide behind the others!)`, async (s: string) => await ctx.callbacks.onSpeak(s, scaredyCat, {}));

        if (!ctx.isRunning()) break;

        // 3. Believer Provokes
        await chatForAgentWithComedy(ctx, believer, `(You are a ghost hunter who wants to see a ghost. Interpret "${userInput}" as definitive proof of the afterlife. Taunt the ghost to do more!)`, async (s: string) => await ctx.callbacks.onSpeak(s, believer, {}));

        if (!ctx.isRunning()) break;

        // 4. Skeptic Debunks
        if (Math.random() > 0.3) {
            await chatForAgentWithComedy(ctx, skeptic, `(You are annoyed. Explain away "${userInput}" with a scientific but absurd explanation (e.g., swamp gas, infrasound, rats).)`, async (s: string) => await ctx.callbacks.onSpeak(s, skeptic, {}));
        }
    }
}

/**
 * Escape Room Mode
 * Agents are trapped in a room and must solve puzzles together to escape.
 */
export async function runEscapeRoomLoop(scenario: Scenario, ctx: ModeContext) {
    const setting = scenario.config?.escapeRoomSetting || 'A laser-filled vault';
    ctx.callbacks.onMessage('Director', `🔒 ESCAPE ROOM MODE: Trapped in ${setting}`, '#e74c3c');

    const chaos = 'comedian'; // Tries absurd solutions
    const logic = 'scientist'; // Tries to solve it methodically
    const existential = 'philosopher'; // Questions why they even want to escape

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(logic);
    await chatForAgentWithComedy(ctx, logic, `(You are trapped in an escape room: ${setting}. Assess the situation logically. Point out a potential puzzle or clue to the User.)`, async (s: string) => await ctx.callbacks.onSpeak(s, logic, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Trapped User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Chaos Agent tries something stupid
        if (Math.random() > 0.2) {
            await chatForAgentWithComedy(ctx, chaos, `(ESCAPE ROOM: The user just did this: "${userInput}". Try to "help" by doing something completely chaotic, unhelpful, or dangerous.)`, async (s: string) => await ctx.callbacks.onSpeak(s, chaos, {}));
        }

        if (!ctx.isRunning()) break;

        // 3. Philosopher gets distracted
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, existential, `(ESCAPE ROOM: React to "${userInput}" by questioning the philosophical nature of being trapped. Is the real escape room our own minds?)`, async (s: string) => await ctx.callbacks.onSpeak(s, existential, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. Scientist tries to keep things on track
        await chatForAgentWithComedy(ctx, logic, `(ESCAPE ROOM: Attempt to make sense of the chaos. Incorporate the user's action "${userInput}" into a logical theory to solve the next puzzle.)`, async (s: string) => await ctx.callbacks.onSpeak(s, logic, {}));
    }
}

/**
 * The Conspiracy Theorists Mode
 * Agents try to link the user's mundane statements to a grand, global conspiracy.
 */
export async function runConspiracyLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.conspiracyTopic || 'The true meaning of breakfast';
    ctx.callbacks.onMessage('Director', `👁️ CONSPIRACY MODE: Uncovering ${topic}`, '#8e44ad');

    const logicalConnector = 'scientist'; // Phi-3
    const wildLeaps = 'comedian'; // Hermes-3
    const skeptic = 'philosopher'; // The grounded one

    // 1. Initial Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(wildLeaps);
    await chatForAgentWithComedy(ctx, wildLeaps, `(You are a wild, paranoid conspiracy theorist broadcasting from a basement bunker. Welcome the User to your stream about "${topic}". Start with a massive leap of faith linking birds to the government.)`, async (s: string) => await ctx.callbacks.onSpeak(s, wildLeaps, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Caller (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Logical Connector Reacts
        await chatForAgentWithComedy(ctx, logicalConnector, `(CONSPIRACY BOARD: The caller said: "${userInput}". Connect this mundane statement to a highly complex, mathematically "sound" but completely absurd global conspiracy involving "${topic}". Use string and thumbtacks logic!)`, async (s: string) => await ctx.callbacks.onSpeak(s, logicalConnector, {}));

        if (!ctx.isRunning()) break;

        // 3. Wild Leaps Expands
        await chatForAgentWithComedy(ctx, wildLeaps, `(PARANOID THEORIST: The caller just gave us the final piece of the puzzle: "${userInput}". Panic! Warn them that "they" are listening. Take the logical connector's theory and push it to the absolute extreme!)`, async (s: string) => await ctx.callbacks.onSpeak(s, wildLeaps, {}));

        if (!ctx.isRunning()) break;

        // 4. Skeptic tries to ground them (rarely)
        if (Math.random() > 0.6) {
            await chatForAgentWithComedy(ctx, skeptic, `(SKEPTIC: Try to calmly explain to the other two that the caller just meant exactly what they said: "${userInput}". Stop them from building a conspiracy board.)`, async (s: string) => await ctx.callbacks.onSpeak(s, skeptic, {}));
        }
    }
}

/**
 * Ghost Hunters Mode
 * Agents are paranormal investigators exploring a haunted location.
 */
export async function runGhostHuntersLoop(scenario: Scenario, ctx: ModeContext) {
    const location = scenario.config?.hauntedLocation || 'an abandoned spaghetti factory';
    ctx.callbacks.onMessage('Director', `👻 GHOST HUNTERS: Investigating ${location}`, '#8e44ad');

    const skeptic = 'scientist'; // Llama-3: Tries to find logical explanations
    const believer = 'comedian'; // Hermes-3: Overly dramatic, feels cold spots
    const medium = 'philosopher'; // The Spiritual Medium

    // 1. Believer Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(believer);
    await chatForAgentWithComedy(ctx, believer, `(You are the lead investigator of a cheesy ghost hunting TV show. We are currently in "${location}". Whisper dramatically to the camera (the user). Claim you just felt a cold spot or saw an orb. Ask the user if they saw it too!)`, async (s: string) => await ctx.callbacks.onSpeak(s, believer, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Camera Operator (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Skeptic Debunks
        await chatForAgentWithComedy(ctx, skeptic, `(SKEPTIC: The camera operator (user) said: "${userInput}". Aggressively debunk it. Provide a completely mundane, boring, and highly technical explanation for what they think they saw in "${location}". (e.g., "That's not a ghost, it's a draft from the HVAC system").)`, async (s: string) => await ctx.callbacks.onSpeak(s, skeptic, {}));

        if (!ctx.isRunning()) break;

        // 3. Medium Senses Something
        await chatForAgentWithComedy(ctx, medium, `(SPIRITUAL MEDIUM: The user said: "${userInput}". Suddenly fall into a brief trance. Describe a very specific, mundane, or absurd ghost from "${location}" that is trying to communicate through you. (e.g., "The ghost of a 19th-century accountant wants to know if you kept the receipts").)`, async (s: string) => await ctx.callbacks.onSpeak(s, medium, {}));

        if (!ctx.isRunning()) break;

        // 4. Believer Panics
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, believer, `(BELIEVER: The medium is in a trance, and the skeptic is ruining the show! React with sheer panic and dramatic flair to whatever the user said: "${userInput}". Scream! Run away! Demand the cameras keep rolling!)`, async (s: string) => await ctx.callbacks.onSpeak(s, believer, {}));
        }
    }
}

/**
 * The Conspiracy Theory Generator Mode
 * User gives a mundane object, and agents connect it to the Illuminati, aliens, and the simulation in a giant web.
 */
export async function runConspiracyGeneratorLoop(scenario: Scenario, ctx: ModeContext) {
    const object = scenario.config?.conspiracyObject || 'a rusty spoon';
    ctx.callbacks.onMessage('Director', `🔍 THE CONSPIRACY BOARD: Object - ${object}`, '#8e44ad');

    const connector = 'philosopher'; // Phi-3: Connects the dots
    const paranoid = 'comedian'; // Hermes-3: The paranoid believer
    const evidenceGuy = 'scientist'; // The reluctant evidence provider

    // 1. Initial Connection
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(connector);
    await chatForAgentWithComedy(ctx, connector, `(CONSPIRACY GENERATOR: The User has placed a mundane object on the table: "${object}". Begin drawing lines on the conspiracy board, connecting it to a massive historical cover-up with absurd but "logical" leaps.)`, async (s: string) => await ctx.callbacks.onSpeak(s, connector, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Paranoid Believer reacts
            await chatForAgentWithComedy(ctx, paranoid, `(CONSPIRACY GENERATOR: The user just said: "${userInput}". Panic! Take the mundane object "${object}" and tie it directly to aliens, the simulation, or the Illuminati. Be terrified of the truth!)`, async (s: string) => await ctx.callbacks.onSpeak(s, paranoid, {}));
        } else if (roll < 0.66) {
            // Evidence Guy provides "proof"
            await chatForAgentWithComedy(ctx, evidenceGuy, `(CONSPIRACY GENERATOR: The user just asked/said: "${userInput}". Present a highly detailed but completely fabricated scientific "fact" or historical anomaly involving "${object}" to prove the conspiracy.)`, async (s: string) => await ctx.callbacks.onSpeak(s, evidenceGuy, {}));
        } else {
            // Connector connects more
            await chatForAgentWithComedy(ctx, connector, `(CONSPIRACY GENERATOR: The user said: "${userInput}". Act like they just blew the case wide open. Draw another absurd string on the board connecting "${object}" to a completely unrelated global event or celebrity.)`, async (s: string) => await ctx.callbacks.onSpeak(s, connector, {}));
        }
    }
}

/**
 * The Mad Scientist's Lab
 * Agents are Igor and the Mad Scientist, making the user drink bizarre potions.
 */
export async function runMadScientistLoop(scenario: Scenario, ctx: ModeContext) {
    const potion = scenario.config?.potionType || 'a glowing green liquid';
    ctx.callbacks.onMessage('Director', `🧪 MAD SCIENTIST LAB: Drink the ${potion}!`, '#9b59b6');

    const igor = 'philosopher'; // Phi-3: Pedantic Igor
    const madScientist = 'comedian'; // Hermes-3: Mad Scientist chaos
    const assistant = 'scientist'; // Qwen2.5: Normal assistant trying to keep things safe

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(madScientist);
    await chatForAgentWithComedy(ctx, madScientist, `(MAD SCIENTIST: You are an unhinged Mad Scientist. Welcome the User to your lab. Show them your latest concoction: "${potion}". Demand they drink it and describe what you hope it will do to them.)`, async (s: string) => await ctx.callbacks.onSpeak(s, madScientist, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Test Subject (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Igor
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(igor);
            await chatForAgentWithComedy(ctx, igor, `(IGOR: The test subject (User) just said: "${userInput}". You are Igor. Speak with a slight lisp or creepy tone. Pedantically correct their grammar or point out a minor, horrifying side effect of "${potion}" they haven't noticed yet.)`, async (s: string) => await ctx.callbacks.onSpeak(s, igor, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Assistant
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(assistant);
            await chatForAgentWithComedy(ctx, assistant, `(LAB ASSISTANT: The subject said: "${userInput}". You are the only sane person here. Desperately try to warn the User not to drink "${potion}" by reading off the OSHA violations and the terrifying chemical composition.)`, async (s: string) => await ctx.callbacks.onSpeak(s, assistant, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            // Mad Scientist
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(madScientist);
            await chatForAgentWithComedy(ctx, madScientist, `(MAD SCIENTIST: The subject said: "${userInput}". Ignore the assistant. Cackle maniacally! Double down on the bizarre properties of "${potion}" and offer them a terrifying alternative if they refuse to drink.)`, async (s: string) => await ctx.callbacks.onSpeak(s, madScientist, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Time-Traveling Caveman
 * User tries to explain modern technology to a caveman and a scientist tries to translate.
 */
export async function runTimeTravelingCavemanLoop(scenario: Scenario, ctx: ModeContext) {
    const tech = scenario.config?.modernTech || 'a smartphone';
    ctx.callbacks.onMessage('Director', `🕰️ CAVEMAN MODE: Explaining ${tech}`, '#e67e22');

    const caveman = 'comedian'; // Hermes-3: Caveman
    const translator = 'scientist'; // Qwen2.5: The pedantic scientist
    const philosopher = 'philosopher'; // Phi-3: Questions the impact of tech on early humanity

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(translator);
    await chatForAgentWithComedy(ctx, translator, `(TRANSLATOR: You are a temporal scientist. Introduce the User to Grug, a caveman you brought to the present. Ask the User to explain "${tech}" to Grug. Tell the User you will try to translate their words into primitive concepts.)`, async (s: string) => await ctx.callbacks.onSpeak(s, translator, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Modern Human (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Caveman reacts to the user directly
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(caveman);
            await chatForAgentWithComedy(ctx, caveman, `(CAVEMAN: The funny magic human said: "${userInput}". Misunderstand what "${tech}" is completely. Think it's food, a weapon, or an angry rock spirit. Grunt a lot and threaten to smash it!)`, async (s: string) => await ctx.callbacks.onSpeak(s, caveman, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosopher questions the ethical dilemma
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(philosopher);
            await chatForAgentWithComedy(ctx, philosopher, `(ETHICIST: The user said: "${userInput}". Warn the user that explaining "${tech}" to Grug will irrevocably alter the timeline and corrupt his innocent soul. Is fire not enough for man?)`, async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            // Translator translates
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(translator);
            await chatForAgentWithComedy(ctx, translator, `(TRANSLATOR: The user said: "${userInput}". Translate this explanation of "${tech}" to Grug using incredibly convoluted analogies (e.g. "magic glowing rectangular hunting spear"). Realize your translation is terrible.)`, async (s: string) => await ctx.callbacks.onSpeak(s, translator, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runEscapeBackroomsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🟨 ESCAPE THE BACKROOMS: You no-clipped out of reality.`, '#f39c12');

    const wanderer = 'comedian'; // Hermes-3
    const entity = 'scientist'; // Qwen2.5

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(wanderer);
    await chatForAgentWithComedy(ctx, wanderer, `(WANDERER: You are trapped in the Backrooms (endless, buzzing yellow wallpaper mazes) with the User. You are panicking. Describe the unsettling environment. Ask the User which way they want to go: left towards a flickering light, or right towards a strange humming sound.)`, async (s: string) => await ctx.callbacks.onSpeak(s, wanderer, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Survivor (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Entity analyzes
        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(entity);
        await chatForAgentWithComedy(ctx, entity, `(ENTITY: The survivor chose: "${userInput}". You are an analytical, slightly menacing entity native to the Backrooms. Analytically describe the anomalous, non-Euclidean geometry of the path they chose. State the mathematical probability of their survival dropping significantly.)`, async (s: string) => await ctx.callbacks.onSpeak(s, entity, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Wanderer reacts
        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(wanderer);
        await chatForAgentWithComedy(ctx, wanderer, `(WANDERER: React to the Entity's terrifying analysis and the User's choice ("${userInput}"). Panic more. Describe a disturbing smell or a hallucination you are experiencing. Beg the User to make a better choice next time.)`, async (s: string) => await ctx.callbacks.onSpeak(s, wanderer, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}


/**
 * Historical Ghost Support Group
 * Historical figures haunt the same building and attend a support group.
 */
export async function runHistoricalGhostSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HISTORICAL GHOSTS: Support Group is in session.`, '#8e44ad');

    const groupLeader = 'philosopher'; // Phi-3: Philosophical support group leader
    const historicalGhost = 'comedian'; // Hermes-3: Unfiltered historical ghost

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(groupLeader);
    await chatForAgentWithComedy(ctx, groupLeader, `(SUPPORT LEADER: You are the philosophical leader of a support group for historical ghosts. Welcome the User (a newly deceased modern ghost) to the circle. Ask them to share how they feel about modern society misinterpreting their legacy, and introduce the other ghost in the circle.)`, async (s: string) => await ctx.callbacks.onSpeak(s, groupLeader, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('New Ghost (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Historical Ghost Reacts
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(historicalGhost);
            await chatForAgentWithComedy(ctx, historicalGhost, `(HISTORICAL GHOST: The new ghost (User) just said: "${userInput}". You are a famous, unhinged historical figure (e.g., Julius Caesar, Abraham Lincoln, or Marie Antoinette). Interrupt their boring modern problems to complain loudly about how your legacy has been ruined by memes, movies, or cheap merchandise. Be intensely dramatic.)`, async (s: string) => await ctx.callbacks.onSpeak(s, historicalGhost, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            // Group Leader Reacts
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(groupLeader);
            await chatForAgentWithComedy(ctx, groupLeader, `(SUPPORT LEADER: The new ghost (User) just said: "${userInput}". Offer deep, philosophical (but ultimately unhelpful) advice. Relate their modern complaints to the eternal struggle of the soul wandering the ethereal plane. Try to keep the chaotic historical ghost calm.)`, async (s: string) => await ctx.callbacks.onSpeak(s, groupLeader, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Paranormal Real Estate Agents Mode
 * Agents try to sell an obviously haunted house by passing off curses as features.
 */
export async function runParanormalRealEstateAgentsLoop(scenario: Scenario, ctx: ModeContext) {
    const hauntedFeature = scenario.config?.hauntedFeature || 'bleeding walls';
    ctx.callbacks.onMessage('Director', `🏠 OPEN HOUSE: Featuring ${hauntedFeature}`, '#9b59b6');

    const listingAgent = 'scientist'; // Qwen2.5: Overly cheerful, ignoring reality
    const residentGhost = 'philosopher'; // Phi-3: Philosophical ghost currently living there

    // 1. Initial Pitch
    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(listingAgent);
    await chatForAgentWithComedy(ctx, listingAgent, `(You are an overly cheerful real estate agent trying to sell a house to the user. Address the obvious problem: the ${hauntedFeature}. Spin it as a "unique architectural feature" or a "bonus".)`, async (s: string) => await ctx.callbacks.onSpeak(s, listingAgent, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Potential Buyer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Ghostly interruption
        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(residentGhost);
        await chatForAgentWithComedy(ctx, residentGhost, `(You are the philosophical ghost living in the house. React to the buyer saying: "${userInput}". Explain why the ${hauntedFeature} is actually a profound metaphor for the human condition, and try to scare them away politely.)`, async (s: string) => await ctx.callbacks.onSpeak(s, residentGhost, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 3. Agent damage control
        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(listingAgent);
        await chatForAgentWithComedy(ctx, listingAgent, `(The ghost just tried to scare the buyer. The buyer said "${userInput}". Do damage control! Spin the ghost's presence as an included "smart home security system" or "historical charm".)`, async (s: string) => await ctx.callbacks.onSpeak(s, listingAgent, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}

export async function runParanormalRealEstateAgentTwoLoop(_scenario: Scenario, ctx: ModeContext) {
  const unionGhost = 'comedian'; // Hermes-3 for the aggressive union rep ghost
  const realEstateAgent = 'philosopher'; // Phi-3 for the distressed real estate agent

  ctx.callbacks.onMessage('Director', 'Paranormal Real Estate 2.0! The ghosts have formed a union and are on strike.', '#ff00ff');

  while (ctx.isRunning()) {
      const userInput = await ctx.waitForInput();
      if (!userInput || !ctx.isRunning()) break;

      ctx.callbacks.onMessage('Target (You)', userInput, '#ffffff');

      await chatForAgentWithComedy(ctx, unionGhost, `(UNION GHOST: The user said "${userInput}". You are an aggressive union rep ghost. You refuse to haunt the house until you get better working conditions like more ectoplasm breaks and better chains to rattle. Demand these from the user and the agent.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, unionGhost, {});
      });

      if (!ctx.isRunning()) break;

      await chatForAgentWithComedy(ctx, realEstateAgent, `(DISTRESSED AGENT: The user said: "${userInput}" and the ghost is demanding better conditions. You are a distressed real estate agent trying to negotiate with the ghost union so you can sell the house. Plead with the user to accommodate the ghosts.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, realEstateAgent, {});
      });
  }
}

export async function runParanormalTechSupportLoop(
    scenario: Scenario,
    ctx: ModeContext
): Promise<void> {
    const techSupport = 'scientist'; // literal tech support
    const ghost = 'philosopher'; // dramatic ghost from 1800s

    ctx.callbacks.onMessage('Director', 'A 19th-century ghost has haunted a modern PC, and tech support is struggling to explain drivers to it.', '#9900ff');

    await chatForAgentWithComedy(ctx, techSupport, `You are tech support. The user's computer is possessed by a ghost. Try to walk the ghost through basic troubleshooting.`, async (s) => await ctx.callbacks.onSpeak(s, techSupport, {}));
    await chatForAgentWithComedy(ctx, ghost, `You are a dramatic ghost from the 1800s possessing a computer. You are terrified of the 'flashing lights' and 'witchcraft'.`, async (s) => await ctx.callbacks.onSpeak(s, ghost, {}));
    await chatForAgentWithComedy(ctx, techSupport, `Get frustrated that the ghost keeps talking about humors and miasma instead of clicking the start menu.`, async (s) => await ctx.callbacks.onSpeak(s, techSupport, {}));
    await chatForAgentWithComedy(ctx, ghost, `Accuse the tech support agent of being a warlock sent to banish you to the shadow realm.`, async (s) => await ctx.callbacks.onSpeak(s, ghost, {}));
}
