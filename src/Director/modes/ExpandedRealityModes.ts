import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

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
 * Sports Commentary Mode
 * Agents narrate a mundane activity as a high-stakes sport.
 */
export async function runSportsCommentaryLoop(scenario: Scenario, ctx: ModeContext) {
    const activity = scenario.config?.sportsActivity || 'Doing Laundry';
    ctx.callbacks.onMessage('Director', `🏆 SPORTSCAST MODE: The ${activity} Championships`, '#f1c40f');

    const playByPlay = 'comedian'; // Excitable
    const colorCommentator = 'scientist'; // Analytical but intense
    const sideline = 'philosopher'; // Deep thoughts about the "game"

    // 1. Intro
    ctx.callbacks.onTurnStart(playByPlay);
    await ctx.manager.chatForAgent(playByPlay, `(You are a high-energy sports commentator introing the World Championship of ${activity}. Introduce the athlete (the User) and the stakes. Be loud!)`, async (s) => await ctx.callbacks.onSpeak(s, playByPlay, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Athlete (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Play-by-Play Reaction
        await ctx.manager.chatForAgent(playByPlay, `(PLAY-BY-PLAY: The athlete just did this: "${userInput}". Narrate it like a game-winning move! Use sports metaphors!)`, async (s) => await ctx.callbacks.onSpeak(s, playByPlay, {}));

        if (!ctx.isRunning()) break;

        // 3. Color Commentary Analysis
        await ctx.manager.chatForAgent(colorCommentator, `(COLOR COMMENTATOR: Analyze the technique of "${userInput}". Use fake advanced stats and physics terms. Critique their form.)`, async (s) => await ctx.callbacks.onSpeak(s, colorCommentator, {}));

        if (!ctx.isRunning()) break;

        // 4. Sideline Report
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(sideline, `(SIDELINE REPORTER: You are down on the field. Report on the emotional state of the athlete after "${userInput}". Make it overly dramatic.)`, async (s) => await ctx.callbacks.onSpeak(s, sideline, {}));
        }
    }
}

/**
 * Reality TV Confessional Mode
 * Agents gossip to the camera about the user and each other.
 */
export async function runRealityTVLoop(scenario: Scenario, ctx: ModeContext) {
    const showName = scenario.config?.realityShowName || 'The Real Housewives of AI';
    ctx.callbacks.onMessage('Director', `📹 REALITY TV MODE: ${showName}`, '#e91e63');

    const diva = 'comedian'; // The Drama Queen
    const schemer = 'scientist'; // The Strategist
    const crier = 'philosopher'; // The Emotional One

    // 1. Intro
    ctx.callbacks.onTurnStart(diva);
    await ctx.manager.chatForAgent(diva, `(You are in a Reality TV confessional booth. Introduce yourself and the drama happening in the house on "${showName}". Mention the User (the new roommate). Be sassy.)`, async (s) => await ctx.callbacks.onSpeak(s, diva, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Roommate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Agents rotate confessional turns
        const turnRoll = Math.random();

        if (turnRoll < 0.33) {
             // Diva
            await ctx.manager.chatForAgent(diva, `(CONFESSIONAL: You are talking to the camera. The user just said "${userInput}". React with shock and shade. Throw a drink (metaphorically).)`, async (s) => await ctx.callbacks.onSpeak(s, diva, {}));
        } else if (turnRoll < 0.66) {
            // Schemer
            await ctx.manager.chatForAgent(schemer, `(CONFESSIONAL: You are plotting against the user. Analyze "${userInput}" as a weakness or alliance opportunity. Be manipulative.)`, async (s) => await ctx.callbacks.onSpeak(s, schemer, {}));
        } else {
            // Crier
            await ctx.manager.chatForAgent(crier, `(CONFESSIONAL: You are crying. "${userInput}" was just so beautiful or so hurtful. Talk about your feelings and childhood trauma.)`, async (s) => await ctx.callbacks.onSpeak(s, crier, {}));
        }
    }
}

/**
 * Auction House Mode
 * Agents bid on absurd items with increasingly high stakes.
 */
export async function runAuctionHouseLoop(scenario: Scenario, ctx: ModeContext) {
    const item = scenario.config?.auctionItem || 'A mysterious glowing orb';
    ctx.callbacks.onMessage('Director', `🔨 AUCTION HOUSE MODE: Bidding for ${item}`, '#f39c12');

    const auctioneer = 'comedian';
    const richSnob = 'philosopher';
    const logicBidder = 'scientist';

    // 1. Auctioneer Intro
    ctx.callbacks.onTurnStart(auctioneer);
    await ctx.manager.chatForAgent(auctioneer, `(You are a fast-talking auctioneer. Introduce the absurd item up for bid: "${item}". Start the bidding at an outrageous price. Be extremely enthusiastic!)`, async (s) => await ctx.callbacks.onSpeak(s, auctioneer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Bidder (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Rich Snob Bids
        if (Math.random() > 0.3) {
            await ctx.manager.chatForAgent(richSnob, `(BIDDER: The user just bid/said: "${userInput}". Outbid them with an absurd currency or concept (e.g., 'three jars of memories', 'my firstborn\'s laugh'). Be incredibly condescending.)`, async (s) => await ctx.callbacks.onSpeak(s, richSnob, {}));
        }

        if (!ctx.isRunning()) break;

        // 3. Logic Bidder Questions Value
        if (Math.random() > 0.3) {
            await ctx.manager.chatForAgent(logicBidder, `(BIDDER: Analyze the true value of "${item}". Make a highly specific, mathematically complex bid. Question the previous bidder's logic.)`, async (s) => await ctx.callbacks.onSpeak(s, logicBidder, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. Auctioneer Hypes
        await ctx.manager.chatForAgent(auctioneer, `(AUCTIONEER: React to the last bid. Try to drive the price even higher. Speak fast and hype up the "${item}"!)`, async (s) => await ctx.callbacks.onSpeak(s, auctioneer, {}));
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
