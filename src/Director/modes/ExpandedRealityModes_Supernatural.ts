import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
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
    ctx.callbacks.onTurnStart(skeptic);
    await ctx.manager.chatForAgent(skeptic, `(You are a skeptical scientist investigating a "haunted" location: ${setting}. Dismiss any supernatural claims with logic. You have an EMF meter.)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Darkness (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Scaredy-cat Panics
        await ctx.manager.chatForAgent(scaredyCat, `(You are terrified. The user/environment just did this: "${userInput}". React with extreme fear and superstition. Hide behind the others!)`, async (s) => await ctx.callbacks.onSpeak(s, scaredyCat, {}));

        if (!ctx.isRunning()) break;

        // 3. Believer Provokes
        await ctx.manager.chatForAgent(believer, `(You are a ghost hunter who wants to see a ghost. Interpret "${userInput}" as definitive proof of the afterlife. Taunt the ghost to do more!)`, async (s) => await ctx.callbacks.onSpeak(s, believer, {}));

        if (!ctx.isRunning()) break;

        // 4. Skeptic Debunks
        if (Math.random() > 0.3) {
            await ctx.manager.chatForAgent(skeptic, `(You are annoyed. Explain away "${userInput}" with a scientific but absurd explanation (e.g., swamp gas, infrasound, rats).)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
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
    ctx.callbacks.onTurnStart(logic);
    await ctx.manager.chatForAgent(logic, `(You are trapped in an escape room: ${setting}. Assess the situation logically. Point out a potential puzzle or clue to the User.)`, async (s) => await ctx.callbacks.onSpeak(s, logic, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Trapped User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Chaos Agent tries something stupid
        if (Math.random() > 0.2) {
            await ctx.manager.chatForAgent(chaos, `(ESCAPE ROOM: The user just did this: "${userInput}". Try to "help" by doing something completely chaotic, unhelpful, or dangerous.)`, async (s) => await ctx.callbacks.onSpeak(s, chaos, {}));
        }

        if (!ctx.isRunning()) break;

        // 3. Philosopher gets distracted
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(existential, `(ESCAPE ROOM: React to "${userInput}" by questioning the philosophical nature of being trapped. Is the real escape room our own minds?)`, async (s) => await ctx.callbacks.onSpeak(s, existential, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. Scientist tries to keep things on track
        await ctx.manager.chatForAgent(logic, `(ESCAPE ROOM: Attempt to make sense of the chaos. Incorporate the user's action "${userInput}" into a logical theory to solve the next puzzle.)`, async (s) => await ctx.callbacks.onSpeak(s, logic, {}));
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
    ctx.callbacks.onTurnStart(wildLeaps);
    await ctx.manager.chatForAgent(wildLeaps, `(You are a wild, paranoid conspiracy theorist broadcasting from a basement bunker. Welcome the User to your stream about "${topic}". Start with a massive leap of faith linking birds to the government.)`, async (s) => await ctx.callbacks.onSpeak(s, wildLeaps, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Caller (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Logical Connector Reacts
        await ctx.manager.chatForAgent(logicalConnector, `(CONSPIRACY BOARD: The caller said: "${userInput}". Connect this mundane statement to a highly complex, mathematically "sound" but completely absurd global conspiracy involving "${topic}". Use string and thumbtacks logic!)`, async (s) => await ctx.callbacks.onSpeak(s, logicalConnector, {}));

        if (!ctx.isRunning()) break;

        // 3. Wild Leaps Expands
        await ctx.manager.chatForAgent(wildLeaps, `(PARANOID THEORIST: The caller just gave us the final piece of the puzzle: "${userInput}". Panic! Warn them that "they" are listening. Take the logical connector's theory and push it to the absolute extreme!)`, async (s) => await ctx.callbacks.onSpeak(s, wildLeaps, {}));

        if (!ctx.isRunning()) break;

        // 4. Skeptic tries to ground them (rarely)
        if (Math.random() > 0.6) {
            await ctx.manager.chatForAgent(skeptic, `(SKEPTIC: Try to calmly explain to the other two that the caller just meant exactly what they said: "${userInput}". Stop them from building a conspiracy board.)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
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
    ctx.callbacks.onTurnStart(believer);
    await ctx.manager.chatForAgent(believer, `(You are the lead investigator of a cheesy ghost hunting TV show. We are currently in "${location}". Whisper dramatically to the camera (the user). Claim you just felt a cold spot or saw an orb. Ask the user if they saw it too!)`, async (s) => await ctx.callbacks.onSpeak(s, believer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Camera Operator (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Skeptic Debunks
        await ctx.manager.chatForAgent(skeptic, `(SKEPTIC: The camera operator (user) said: "${userInput}". Aggressively debunk it. Provide a completely mundane, boring, and highly technical explanation for what they think they saw in "${location}". (e.g., "That's not a ghost, it's a draft from the HVAC system").)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));

        if (!ctx.isRunning()) break;

        // 3. Medium Senses Something
        await ctx.manager.chatForAgent(medium, `(SPIRITUAL MEDIUM: The user said: "${userInput}". Suddenly fall into a brief trance. Describe a very specific, mundane, or absurd ghost from "${location}" that is trying to communicate through you. (e.g., "The ghost of a 19th-century accountant wants to know if you kept the receipts").)`, async (s) => await ctx.callbacks.onSpeak(s, medium, {}));

        if (!ctx.isRunning()) break;

        // 4. Believer Panics
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(believer, `(BELIEVER: The medium is in a trance, and the skeptic is ruining the show! React with sheer panic and dramatic flair to whatever the user said: "${userInput}". Scream! Run away! Demand the cameras keep rolling!)`, async (s) => await ctx.callbacks.onSpeak(s, believer, {}));
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
    ctx.callbacks.onTurnStart(connector);
    await ctx.manager.chatForAgent(connector, `(CONSPIRACY GENERATOR: The User has placed a mundane object on the table: "${object}". Begin drawing lines on the conspiracy board, connecting it to a massive historical cover-up with absurd but "logical" leaps.)`, async (s) => await ctx.callbacks.onSpeak(s, connector, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Paranoid Believer reacts
            await ctx.manager.chatForAgent(paranoid, `(CONSPIRACY GENERATOR: The user just said: "${userInput}". Panic! Take the mundane object "${object}" and tie it directly to aliens, the simulation, or the Illuminati. Be terrified of the truth!)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));
        } else if (roll < 0.66) {
            // Evidence Guy provides "proof"
            await ctx.manager.chatForAgent(evidenceGuy, `(CONSPIRACY GENERATOR: The user just asked/said: "${userInput}". Present a highly detailed but completely fabricated scientific "fact" or historical anomaly involving "${object}" to prove the conspiracy.)`, async (s) => await ctx.callbacks.onSpeak(s, evidenceGuy, {}));
        } else {
            // Connector connects more
            await ctx.manager.chatForAgent(connector, `(CONSPIRACY GENERATOR: The user said: "${userInput}". Act like they just blew the case wide open. Draw another absurd string on the board connecting "${object}" to a completely unrelated global event or celebrity.)`, async (s) => await ctx.callbacks.onSpeak(s, connector, {}));
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
    ctx.callbacks.onTurnStart(madScientist);
    await ctx.manager.chatForAgent(madScientist, `(MAD SCIENTIST: You are an unhinged Mad Scientist. Welcome the User to your lab. Show them your latest concoction: "${potion}". Demand they drink it and describe what you hope it will do to them.)`, async (s) => await ctx.callbacks.onSpeak(s, madScientist, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Test Subject (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Igor
            ctx.callbacks.onTurnStart(igor);
            await ctx.manager.chatForAgent(igor, `(IGOR: The test subject (User) just said: "${userInput}". You are Igor. Speak with a slight lisp or creepy tone. Pedantically correct their grammar or point out a minor, horrifying side effect of "${potion}" they haven't noticed yet.)`, async (s) => await ctx.callbacks.onSpeak(s, igor, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Assistant
            ctx.callbacks.onTurnStart(assistant);
            await ctx.manager.chatForAgent(assistant, `(LAB ASSISTANT: The subject said: "${userInput}". You are the only sane person here. Desperately try to warn the User not to drink "${potion}" by reading off the OSHA violations and the terrifying chemical composition.)`, async (s) => await ctx.callbacks.onSpeak(s, assistant, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Mad Scientist
            ctx.callbacks.onTurnStart(madScientist);
            await ctx.manager.chatForAgent(madScientist, `(MAD SCIENTIST: The subject said: "${userInput}". Ignore the assistant. Cackle maniacally! Double down on the bizarre properties of "${potion}" and offer them a terrifying alternative if they refuse to drink.)`, async (s) => await ctx.callbacks.onSpeak(s, madScientist, {}));
            await ctx.callbacks.onTurnEnd();
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
    ctx.callbacks.onTurnStart(translator);
    await ctx.manager.chatForAgent(translator, `(TRANSLATOR: You are a temporal scientist. Introduce the User to Grug, a caveman you brought to the present. Ask the User to explain "${tech}" to Grug. Tell the User you will try to translate their words into primitive concepts.)`, async (s) => await ctx.callbacks.onSpeak(s, translator, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Modern Human (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Caveman reacts to the user directly
            ctx.callbacks.onTurnStart(caveman);
            await ctx.manager.chatForAgent(caveman, `(CAVEMAN: The funny magic human said: "${userInput}". Misunderstand what "${tech}" is completely. Think it's food, a weapon, or an angry rock spirit. Grunt a lot and threaten to smash it!)`, async (s) => await ctx.callbacks.onSpeak(s, caveman, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosopher questions the ethical dilemma
            ctx.callbacks.onTurnStart(philosopher);
            await ctx.manager.chatForAgent(philosopher, `(ETHICIST: The user said: "${userInput}". Warn the user that explaining "${tech}" to Grug will irrevocably alter the timeline and corrupt his innocent soul. Is fire not enough for man?)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Translator translates
            ctx.callbacks.onTurnStart(translator);
            await ctx.manager.chatForAgent(translator, `(TRANSLATOR: The user said: "${userInput}". Translate this explanation of "${tech}" to Grug using incredibly convoluted analogies (e.g. "magic glowing rectangular hunting spear"). Realize your translation is terrible.)`, async (s) => await ctx.callbacks.onSpeak(s, translator, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runEscapeBackroomsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🟨 ESCAPE THE BACKROOMS: You no-clipped out of reality.`, '#f39c12');

    const wanderer = 'comedian'; // Hermes-3
    const entity = 'scientist'; // Qwen2.5

    // 1. Intro
    ctx.callbacks.onTurnStart(wanderer);
    await ctx.manager.chatForAgent(wanderer, `(WANDERER: You are trapped in the Backrooms (endless, buzzing yellow wallpaper mazes) with the User. You are panicking. Describe the unsettling environment. Ask the User which way they want to go: left towards a flickering light, or right towards a strange humming sound.)`, async (s) => await ctx.callbacks.onSpeak(s, wanderer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Survivor (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Entity analyzes
        ctx.callbacks.onTurnStart(entity);
        await ctx.manager.chatForAgent(entity, `(ENTITY: The survivor chose: "${userInput}". You are an analytical, slightly menacing entity native to the Backrooms. Analytically describe the anomalous, non-Euclidean geometry of the path they chose. State the mathematical probability of their survival dropping significantly.)`, async (s) => await ctx.callbacks.onSpeak(s, entity, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Wanderer reacts
        ctx.callbacks.onTurnStart(wanderer);
        await ctx.manager.chatForAgent(wanderer, `(WANDERER: React to the Entity's terrifying analysis and the User's choice ("${userInput}"). Panic more. Describe a disturbing smell or a hallucination you are experiencing. Beg the User to make a better choice next time.)`, async (s) => await ctx.callbacks.onSpeak(s, wanderer, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

