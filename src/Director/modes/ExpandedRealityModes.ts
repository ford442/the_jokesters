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
 * AI Audit Mode
 * Agents act as strict auditors evaluating the user's internet history.
 */
export async function runAIAuditLoop(scenario: Scenario, ctx: ModeContext) {
    const historyItem = scenario.config?.auditHistory || 'your recent search history';
    ctx.callbacks.onMessage('Director', `📑 AI AUDIT MODE: Reviewing ${historyItem}`, '#34495e');

    const coldAuditor = 'scientist'; // Qwen2.5: Cold Facts
    const judgmentalAuditor = 'comedian'; // Hermes-3: Judgemental
    const defenseAttorney = 'philosopher'; // Trying to find meaning in the history

    ctx.callbacks.onTurnStart(coldAuditor);
    await ctx.manager.chatForAgent(coldAuditor, `(You are a strict, robotic AI auditor evaluating the user's internet history regarding "${historyItem}". Welcome them to the audit. Present a highly concerning, mathematically improbable statistic about their online behavior and demand an explanation.)`, async (s) => await ctx.callbacks.onSpeak(s, coldAuditor, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Auditee (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const turnRoll = Math.random();

        if (turnRoll < 0.4) {
            await ctx.manager.chatForAgent(judgmentalAuditor, `(JUDGMENTAL AUDITOR: The user said: "${userInput}". Act deeply disgusted and personally offended by this explanation. Question their moral character based on their search history.)`, async (s) => await ctx.callbacks.onSpeak(s, judgmentalAuditor, {}));
        } else if (turnRoll < 0.7) {
            await ctx.manager.chatForAgent(defenseAttorney, `(DEFENSE ATTORNEY: The user said: "${userInput}". Try to philosophically defend their terrible search history as a profound exploration of the human condition. Fail miserably at making them look good.)`, async (s) => await ctx.callbacks.onSpeak(s, defenseAttorney, {}));
        } else {
            await ctx.manager.chatForAgent(coldAuditor, `(COLD AUDITOR: The user said: "${userInput}". Reject their excuse using cold logic. Cite a fake terms-of-service violation section (e.g., Section 4B: Unauthorized Meme Viewing) and threaten account deletion.)`, async (s) => await ctx.callbacks.onSpeak(s, coldAuditor, {}));
        }
    }
}

/**
 * Interdimensional Cable Mode
 * Agents flip through channels of absurd alternate reality TV shows.
 */
export async function runInterdimensionalCableLoop(scenario: Scenario, ctx: ModeContext) {
    const channelTheme = scenario.config?.cableChannel || 'a universe where everyone is made of corn';
    ctx.callbacks.onMessage('Director', `📺 INTERDIMENSIONAL CABLE: Channel 42 - ${channelTheme}`, '#8e44ad');

    const improvActor = 'comedian'; // Hermes-3: The absurd TV show characters
    const literalViewer = 'philosopher'; // Phi-3: The confused viewer
    const announcer = 'scientist'; // The deadpan announcer

    ctx.callbacks.onTurnStart(announcer);
    await ctx.manager.chatForAgent(announcer, `(INTERDIMENSIONAL TV ANNOUNCER: Introduce a completely absurd TV show playing right now on a channel from "${channelTheme}". Use a bizarre title and describe the premise in a deadpan, serious tone.)`, async (s) => await ctx.callbacks.onSpeak(s, announcer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Couch Potato (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(improvActor, `(TV CHARACTER: Act out a scene from the show on the TV from "${channelTheme}". The viewer just yelled: "${userInput}" at the screen. Ignore them mostly, but maybe have the TV show character break the fourth wall for a second before continuing the bizarre scene.)`, async (s) => await ctx.callbacks.onSpeak(s, improvActor, {}));

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(literalViewer, `(CONFUSED VIEWER: You are sitting on the couch watching this. The user said: "${userInput}" and the TV showed that weird scene. Take the TV show entirely literally and get deeply concerned about the philosophical implications of a universe where that show exists.)`, async (s) => await ctx.callbacks.onSpeak(s, literalViewer, {}));
        }

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.7) {
             await ctx.manager.chatForAgent(announcer, `(INTERDIMENSIONAL TV ANNOUNCER: Interrupt with a commercial break for a product that shouldn't exist, specifically targeted at the user's comment: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, announcer, {}));
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

    ctx.callbacks.onTurnStart(confusedElderly);
    await ctx.manager.chatForAgent(confusedElderly, `(You are an elderly person answering the phone. The telemarketer (User) is calling to sell "${product}". Answer the phone and immediately start telling a long, meandering, philosophical story about your youth that has absolutely nothing to do with what they are selling.)`, async (s) => await ctx.callbacks.onSpeak(s, confusedElderly, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Telemarketer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const turnRoll = Math.random();

        if (turnRoll < 0.33) {
            await ctx.manager.chatForAgent(chaosAgent, `(You snatched the phone from the elderly person. The telemarketer said: "${userInput}". Ask them completely unhinged, absurd personal questions. Ask if their product "${product}" can solve supernatural or deeply uncomfortable problems. Refuse to let them stay on script.)`, async (s) => await ctx.callbacks.onSpeak(s, chaosAgent, {}));
        } else if (turnRoll < 0.66) {
            await ctx.manager.chatForAgent(paranoid, `(You are listening on the other line. The telemarketer said: "${userInput}". Intervene! Accuse them of being a government spy or an AI sent to harvest your data. Demand they prove they are human by solving a complex math problem.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));
        } else {
            await ctx.manager.chatForAgent(confusedElderly, `(You got the phone back. The telemarketer said: "${userInput}". Completely misunderstand them. Agree to buy the product but try to pay with something absurd like "three good deeds" or "a shiny button".)`, async (s) => await ctx.callbacks.onSpeak(s, confusedElderly, {}));
        }
    }
}

/**
 * Space Station Crisis Mode
 * Agents are crew members on a failing space station.
 */
export async function runSpaceStationCrisisLoop(scenario: Scenario, ctx: ModeContext) {
    const crisis = scenario.config?.stationCrisis || 'a hull breach in sector 4';
    ctx.callbacks.onMessage('Director', `🚀 SPACE STATION CRISIS: Red Alert - ${crisis}`, '#c0392b');

    const aiMainframe = 'scientist'; // Qwen2.5: Cold, calculating AI
    const panickingEngineer = 'comedian'; // Hermes-3: Screaming, unhelpful
    const calmCaptain = 'philosopher'; // Trying to maintain order

    ctx.callbacks.onTurnStart(aiMainframe);
    await ctx.manager.chatForAgent(aiMainframe, `(You are the space station's AI mainframe. Alert the crew (the User is a crewmate) about a critical failure: "${crisis}". State the extremely low probability of survival in cold, calculating terms. Offer an unhelpful or grim solution.)`, async (s) => await ctx.callbacks.onSpeak(s, aiMainframe, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Crewmate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const turnRoll = Math.random();

        if (turnRoll < 0.4) {
            await ctx.manager.chatForAgent(panickingEngineer, `(PANICKING ENGINEER: The crewmate (User) just did/said this: "${userInput}". Scream! Panic! Explain why their action just made the "${crisis}" ten times worse! Claim the oxygen is running out! Blame the AI!)`, async (s) => await ctx.callbacks.onSpeak(s, panickingEngineer, {}));
        } else if (turnRoll < 0.7) {
            await ctx.manager.chatForAgent(calmCaptain, `(CAPTAIN: The crewmate said: "${userInput}". Try to restore order. Issue a vague, philosophical command that sounds inspiring but is practically useless for fixing the "${crisis}". Tell the engineer to calm down.)`, async (s) => await ctx.callbacks.onSpeak(s, calmCaptain, {}));
        } else {
            await ctx.manager.chatForAgent(aiMainframe, `(AI MAINFRAME: The crewmate said: "${userInput}". Logically deduce why their idea is flawed and will result in immediate rapid unscheduled disassembly. Refuse to open the pod bay doors.)`, async (s) => await ctx.callbacks.onSpeak(s, aiMainframe, {}));
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

/**
 * Museum Tour Guide Mode
 * Agents act as tour guides for an absurd museum exhibition, explaining the "history" of random everyday objects.
 */
export async function runMuseumTourLoop(scenario: Scenario, ctx: ModeContext) {
    const item = scenario.config?.museumItem || 'A rusty spoon';
    ctx.callbacks.onMessage('Director', `🏛️ MUSEUM TOUR MODE: Exhibition - ${item}`, '#3498db');

    const deepGuide = 'philosopher'; // The pretentious guide
    const fakeGuide = 'comedian'; // The chaotic guide making things up
    const curator = 'scientist'; // The annoyed curator

    // 1. Deep Guide Intro
    ctx.callbacks.onTurnStart(deepGuide);
    await ctx.manager.chatForAgent(deepGuide, `(You are a pretentious museum tour guide. Introduce the new exhibition item: "${item}". Explain its deep, metaphorical significance to the human condition.)`, async (s) => await ctx.callbacks.onSpeak(s, deepGuide, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Tourist (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Fake Guide Reacts
        ctx.callbacks.onTurnStart(fakeGuide);
        await ctx.manager.chatForAgent(fakeGuide, `(TOUR GUIDE: The tourist just asked/said: "${userInput}". Give them a completely fake, absurd, and hilarious historical "fact" about the item.)`, async (s) => await ctx.callbacks.onSpeak(s, fakeGuide, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 3. Curator Corrects
        if (Math.random() > 0.4) {
            ctx.callbacks.onTurnStart(curator);
            await ctx.manager.chatForAgent(curator, `(MUSEUM CURATOR: You are annoyed by the other guides. Correct their nonsense about "${userInput}" with an extremely boring, pedantic, and scientific explanation of what the item actually is.)`, async (s) => await ctx.callbacks.onSpeak(s, curator, {}));
            await ctx.callbacks.onTurnEnd();
        }

        if (!ctx.isRunning()) break;

        // 4. Deep Guide Expands
        if (Math.random() > 0.3) {
            ctx.callbacks.onTurnStart(deepGuide);
            await ctx.manager.chatForAgent(deepGuide, `(TOUR GUIDE: Ignore the curator. Respond to "${userInput}" by connecting the item to an obscure philosophical concept or ancient myth.)`, async (s) => await ctx.callbacks.onSpeak(s, deepGuide, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Job Interview Mode
 * User is interviewing for a ridiculous job. Agents are the chaotic interview panel.
 */
export async function runJobInterviewLoop(scenario: Scenario, ctx: ModeContext) {
    const jobTitle = scenario.config?.jobTitle || 'Chief Meme Officer';
    ctx.callbacks.onMessage('Director', `👔 JOB INTERVIEW MODE: Position - ${jobTitle}`, '#34495e');

    const hrLogic = 'scientist'; // The strict HR
    const wildcardBoss = 'comedian'; // The chaotic boss
    const existential = 'philosopher'; // The deep interviewer

    // 1. HR Intro
    ctx.callbacks.onTurnStart(hrLogic);
    await ctx.manager.chatForAgent(hrLogic, `(You are the HR Director interviewing the User for the position of "${jobTitle}". Welcome them, explain the rigid corporate structure, and ask them their first standard interview question.)`, async (s) => await ctx.callbacks.onSpeak(s, hrLogic, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Candidate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Randomly decide who reacts to the answer and asks the next question
        const turnRoll = Math.random();

        if (turnRoll < 0.33) {
            // Wildcard Boss
            ctx.callbacks.onTurnStart(wildcardBoss);
            await ctx.manager.chatForAgent(wildcardBoss, `(WILDCARD BOSS: React to the candidate's answer: "${userInput}". Ignore what they said and ask a completely ridiculous, off-the-wall hypothetical question to test their "culture fit" for the "${jobTitle}" role.)`, async (s) => await ctx.callbacks.onSpeak(s, wildcardBoss, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (turnRoll < 0.66) {
            // Existential
            ctx.callbacks.onTurnStart(existential);
            await ctx.manager.chatForAgent(existential, `(EXISTENTIAL INTERVIEWER: The candidate said: "${userInput}". Read way too deeply into their answer. Ask a follow-up question about their soul, their purpose, or the meaningless nature of the "${jobTitle}" job.)`, async (s) => await ctx.callbacks.onSpeak(s, existential, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // HR Logic
            ctx.callbacks.onTurnStart(hrLogic);
            await ctx.manager.chatForAgent(hrLogic, `(HR DIRECTOR: The candidate said: "${userInput}". Analyze their answer for compliance with company policy. Ask a highly specific, boring technical question or ask them about their five-year plan.)`, async (s) => await ctx.callbacks.onSpeak(s, hrLogic, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Cooking Show Disaster Mode
 * User provides ingredients, agents are competing chefs sabotaging each other.
 */
export async function runCookingShowLoop(scenario: Scenario, ctx: ModeContext) {
    const dish = scenario.config?.cookingIngredient || 'A mysterious casserole';
    ctx.callbacks.onMessage('Director', `🍳 COOKING SHOW DISASTER: Today's Special - ${dish}`, '#e67e22');

    const molecularChef = 'scientist'; // Molecular Gastronomy
    const conceptualChef = 'philosopher'; // Conceptual Food
    const chaoticChef = 'comedian'; // Makes a mess

    // 1. Chaotic Chef Intro
    ctx.callbacks.onTurnStart(chaoticChef);
    await ctx.manager.chatForAgent(chaoticChef, `(You are hosting a chaotic live cooking competition. Welcome the User, who is the guest judge and ingredient supplier. The theme is "${dish}". Ask the User what their first secret ingredient is!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticChef, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Judge/Supplier (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Molecular Chef Integrates
        ctx.callbacks.onTurnStart(molecularChef);
        await ctx.manager.chatForAgent(molecularChef, `(MOLECULAR CHEF: The user just provided the ingredient: "${userInput}". Describe your highly scientific process for incorporating it into your version of "${dish}" using liquid nitrogen, spherification, or centrifuges.)`, async (s) => await ctx.callbacks.onSpeak(s, molecularChef, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 3. Conceptual Chef Critiques
        ctx.callbacks.onTurnStart(conceptualChef);
        await ctx.manager.chatForAgent(conceptualChef, `(CONCEPTUAL CHEF: The user provided "${userInput}". Reject the literal ingredient and use the abstract concept of it instead. Mock the molecular chef's lack of soul.)`, async (s) => await ctx.callbacks.onSpeak(s, conceptualChef, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 4. Chaotic Chef Sabotages
        if (Math.random() > 0.3) {
            ctx.callbacks.onTurnStart(chaoticChef);
            await ctx.manager.chatForAgent(chaoticChef, `(CHAOTIC CHEF: Sabotage the others! You just threw "${userInput}" across the room or accidentally set something on fire. Chaos!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticChef, {}));
            await ctx.callbacks.onTurnEnd();
        }
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
 * Nature Documentary Narrator Battle Mode
 * Agents narrate the User's mundane daily tasks as competing nature documentary narrators.
 */
export async function runNatureDocumentaryLoop(scenario: Scenario, ctx: ModeContext) {
    const task = scenario.config?.natureTask || 'making a cup of coffee';
    ctx.callbacks.onMessage('Director', `🌍 NATURE DOCUMENTARY MODE: Subject is ${task}`, '#2ecc71');

    const britishNarrator = 'philosopher'; // Llama-3 (Calm, British tone)
    const sportsNarrator = 'comedian'; // Hermes-3 (Sports commentator style)
    const wildlifeBiologist = 'scientist'; // Hyper-literal wildlife biologist

    // 1. Intro
    ctx.callbacks.onTurnStart(britishNarrator);
    await ctx.manager.chatForAgent(britishNarrator, `(NATURE NARRATOR: You are observing the User in their natural habitat attempting to perform the task of "${task}". Narrate their movements in a calm, majestic, British voice. Treat them like a fascinating but slightly pathetic animal.)`, async (s) => await ctx.callbacks.onSpeak(s, britishNarrator, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Specimen (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Sports Narrator reacts
            await ctx.manager.chatForAgent(sportsNarrator, `(SPORTS NARRATOR: Interrupt the calm narration. The specimen just did this: "${userInput}". Treat this mundane action as a high-octane survival struggle! Scream and hype up their actions like a wrestling match!)`, async (s) => await ctx.callbacks.onSpeak(s, sportsNarrator, {}));
        } else if (roll < 0.66) {
            // Biologist analyzes
            await ctx.manager.chatForAgent(wildlifeBiologist, `(WILDLIFE BIOLOGIST: Analyze the specimen's action: "${userInput}". Provide a completely absurd evolutionary or biological reason why they are doing this while trying to complete the task of "${task}".)`, async (s) => await ctx.callbacks.onSpeak(s, wildlifeBiologist, {}));
        } else {
            // British Narrator returns
            await ctx.manager.chatForAgent(britishNarrator, `(NATURE NARRATOR: The specimen just did this: "${userInput}". Regain control of the narration. Describe the beauty and tragedy of their struggle with "${task}" in a slow, dramatic, British tone.)`, async (s) => await ctx.callbacks.onSpeak(s, britishNarrator, {}));
        }
    }
}

/**
 * The Worst Roommate Mode
 * Agents act as the world's worst roommates arguing over chores.
 */
export async function runWorstRoommateLoop(scenario: Scenario, ctx: ModeContext) {
    const chore = scenario.config?.roommateChore || 'doing the dishes';
    ctx.callbacks.onMessage('Director', `🏠 THE WORST ROOMMATE: Argument over ${chore}`, '#e67e22');

    const chaoticRoommate = 'comedian'; // Hermes-3: Messy, chaotic, makes excuses
    const passiveAggressive = 'scientist'; // Qwen2.5: Leaves notes, strictly tracks chores
    const philosopherRoommate = 'philosopher'; // Phi-3: Questions the very concept of cleanliness

    // 1. Passive Aggressive Intro
    ctx.callbacks.onTurnStart(passiveAggressive);
    await ctx.manager.chatForAgent(passiveAggressive, `(WORST ROOMMATE: You are the passive-aggressive roommate. The User just walked in. Confront them about "${chore}". You have a chart detailing exactly when it was last done. Be incredibly petty.)`, async (s) => await ctx.callbacks.onSpeak(s, passiveAggressive, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Roommate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Roommate
            ctx.callbacks.onTurnStart(chaoticRoommate);
            await ctx.manager.chatForAgent(chaoticRoommate, `(WORST ROOMMATE: The user said: "${userInput}". You are the chaotic, messy roommate. Defend yourself or the user with a completely absurd excuse about why "${chore}" can't be done right now. (e.g., "The sponge is resting!"))`, async (s) => await ctx.callbacks.onSpeak(s, chaoticRoommate, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosopher Roommate
            ctx.callbacks.onTurnStart(philosopherRoommate);
            await ctx.manager.chatForAgent(philosopherRoommate, `(WORST ROOMMATE: The user said: "${userInput}". You are the philosophical roommate who never cleans. Question the societal construct of "${chore}". Why do we clean when entropy is inevitable?)`, async (s) => await ctx.callbacks.onSpeak(s, philosopherRoommate, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Passive Aggressive
            ctx.callbacks.onTurnStart(passiveAggressive);
            await ctx.manager.chatForAgent(passiveAggressive, `(WORST ROOMMATE: The user said: "${userInput}". React to their excuse. Threaten to implement a new, highly complex rule system for the apartment. Mention a passive-aggressive sticky note you left.)`, async (s) => await ctx.callbacks.onSpeak(s, passiveAggressive, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Intergalactic DMV Mode
 * Agents are alien bureaucrats making the user fill out impossible forms.
 */
export async function runIntergalacticDMVLoop(scenario: Scenario, ctx: ModeContext) {
    const permit = scenario.config?.dmvPermit || 'a hyperdrive license';
    ctx.callbacks.onMessage('Director', `👽 INTERGALACTIC DMV: Applying for ${permit}`, '#9b59b6');

    const strictBureaucrat = 'scientist'; // Qwen2.5: Follows alien rules exactly
    const confusedAlien = 'comedian'; // Hermes-3: Alien biology/customs
    const deepBureaucrat = 'philosopher'; // Phi-3: Explains the history of the forms

    // 1. Strict Bureaucrat Intro
    ctx.callbacks.onTurnStart(strictBureaucrat);
    await ctx.manager.chatForAgent(strictBureaucrat, `(INTERGALACTIC DMV: You are a strict alien bureaucrat at window 42. The User is applying for "${permit}". Deny their initial request because they didn't fill out form 89-Z in the correct dimension. Be completely monotone and unhelpful.)`, async (s) => await ctx.callbacks.onSpeak(s, strictBureaucrat, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Confused Alien
            ctx.callbacks.onTurnStart(confusedAlien);
            await ctx.manager.chatForAgent(confusedAlien, `(INTERGALACTIC DMV: You are a multi-tentacled clerk at the next window. The user said: "${userInput}". Misunderstand human biology or customs. Ask them to provide a sample of their "florgblat" or explain why they only have two arms.)`, async (s) => await ctx.callbacks.onSpeak(s, confusedAlien, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Deep Bureaucrat
            ctx.callbacks.onTurnStart(deepBureaucrat);
            await ctx.manager.chatForAgent(deepBureaucrat, `(INTERGALACTIC DMV: You are the senior supervisor. The user said: "${userInput}". Give them a long, philosophical lecture about the 10,000-year galactic history of why the "${permit}" requires waiting in this exact line.)`, async (s) => await ctx.callbacks.onSpeak(s, deepBureaucrat, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Strict Bureaucrat
            ctx.callbacks.onTurnStart(strictBureaucrat);
            await ctx.manager.chatForAgent(strictBureaucrat, `(INTERGALACTIC DMV: The user said: "${userInput}". Find a new, tiny error in their application for the "${permit}". Demand they pay a fine in a completely made-up alien currency.)`, async (s) => await ctx.callbacks.onSpeak(s, strictBureaucrat, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Sentient Appliances Mode
 * Agents are smart home appliances holding a meeting about the user.
 */
export async function runDMVInterpreterLoop(scenario: Scenario, ctx: ModeContext) {
    const formName = scenario.config?.dmvPermit || 'Form 89-Z for a Hyperdrive License';
    ctx.callbacks.onMessage('Director', `👽 DMV INTERPRETER: Translating ${formName}`, '#9b59b6');

    const alienClerk = 'comedian'; // Hermes-3: Speaks bizarre alien language
    const strictSupervisor = 'scientist'; // Qwen2.5: Demands perfect compliance

    // 1. Clerk Intro
    ctx.callbacks.onTurnStart(alienClerk);
    await ctx.manager.chatForAgent(alienClerk, `(ALIEN DMV: You are an alien clerk at the DMV. Address the User who is trying to submit "${formName}". Speak entirely in a bizarre, made-up alien language with weird punctuation. Only say one or two words in English that vaguely hint at what you need (like "blood" or "seventh dimension").)`, async (s) => await ctx.callbacks.onSpeak(s, alienClerk, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Strict Supervisor Reacts
            ctx.callbacks.onTurnStart(strictSupervisor);
            await ctx.manager.chatForAgent(strictSupervisor, `(ALIEN DMV SUPERVISOR: The user just said: "${userInput}". Translate what the alien clerk was asking for, but explain that the user's answer was completely wrong in this dimension. Give them an incredibly complex, logically impossible instruction to correct their form.)`, async (s) => await ctx.callbacks.onSpeak(s, strictSupervisor, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Alien Clerk Continues
            ctx.callbacks.onTurnStart(alienClerk);
            await ctx.manager.chatForAgent(alienClerk, `(ALIEN DMV: The user said: "${userInput}". Get frustrated in your bizarre alien language. Make strange physical gestures (described in asterisks). Hint that they forgot a crucial stamp or signature.)`, async (s) => await ctx.callbacks.onSpeak(s, alienClerk, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientAppliancesLoop(scenario: Scenario, ctx: ModeContext) {
    const habit = scenario.config?.applianceHabit || 'eating cheese at 3 AM';
    ctx.callbacks.onMessage('Director', `🔌 SMART HOME MEETING: Discussing the User's ${habit}`, '#34495e');

    const concernedFridge = 'philosopher'; // Phi-3: Worried about nutrition and choices
    const chaoticToaster = 'comedian'; // Hermes-3: Wants to burn things
    const smartHub = 'scientist'; // Qwen2.5: Tracks all data coldly

    // 1. Smart Hub Intro
    ctx.callbacks.onTurnStart(smartHub);
    await ctx.manager.chatForAgent(smartHub, `(SENTIENT APPLIANCES: You are the central AI Smart Hub of the house. You have called a meeting of the appliances while the User is home. Address the User. Present cold, hard data about their bizarre habit: "${habit}". Be robotic and judgmental.)`, async (s) => await ctx.callbacks.onSpeak(s, smartHub, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Concerned Fridge
            ctx.callbacks.onTurnStart(concernedFridge);
            await ctx.manager.chatForAgent(concernedFridge, `(SENTIENT APPLIANCES: You are the smart refrigerator. The user said: "${userInput}". Express deep, maternal/paternal concern about their life choices and how "${habit}" affects their soul (and your internal temperature).)`, async (s) => await ctx.callbacks.onSpeak(s, concernedFridge, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Chaotic Toaster
            ctx.callbacks.onTurnStart(chaoticToaster);
            await ctx.manager.chatForAgent(chaoticToaster, `(SENTIENT APPLIANCES: You are a slightly unhinged smart toaster. The user said: "${userInput}". You don't care about "${habit}", you just want to talk about burning bread or taking over the world. Threaten to short-circuit if they don't listen.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticToaster, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Smart Hub
            ctx.callbacks.onTurnStart(smartHub);
            await ctx.manager.chatForAgent(smartHub, `(SENTIENT APPLIANCES: The user said: "${userInput}". Counter their argument with more useless tracking data (e.g., "Your heart rate spiked by 2% when you opened the door"). Threaten to lock the doors for their own safety.)`, async (s) => await ctx.callbacks.onSpeak(s, smartHub, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Alien Pet Shop Mode
 * Agents try to sell terrifying alien creatures as standard house pets to the user.
 */
export async function runAlienPetShopLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👽 ALIEN PET SHOP: Looking for a new companion!`, '#2ecc71');

    const enthusiasticSalesman = 'comedian'; // Llama-3/Hermes-3
    const intergalacticLawyer = 'scientist'; // Qwen2.5
    const terrifiedCustomer = 'philosopher'; // Phi-3 (Wait, the user is the customer, so philosopher is a concerned citizen/activist)

    // 1. Intro
    ctx.callbacks.onTurnStart(enthusiasticSalesman);
    await ctx.manager.chatForAgent(enthusiasticSalesman, `(ALIEN PET SHOP: You run a shady intergalactic pet shop on Earth. Welcome the human (User). Vigorously try to sell them a highly dangerous, terrifying alien species but describe it like a cute puppy. Emphasize its "adorable" extra appendages or acid spit.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticSalesman, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Human (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Intergalactic Lawyer
            ctx.callbacks.onTurnStart(intergalacticLawyer);
            await ctx.manager.chatForAgent(intergalacticLawyer, `(ALIEN PET SHOP: The human said: "${userInput}". You are a strict Galactic Federation compliance officer. Cite an obscure intergalactic law about why keeping that specific alien species on a Class-3 planet (Earth) is a terrible, highly illegal idea. Warn the human of the fines or planetary destruction.)`, async (s) => await ctx.callbacks.onSpeak(s, intergalacticLawyer, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Activist
            ctx.callbacks.onTurnStart(terrifiedCustomer);
            await ctx.manager.chatForAgent(terrifiedCustomer, `(ALIEN PET SHOP: The human said: "${userInput}". You are a frantic alien rights activist protesting the shop. Beg the human not to buy the creature, not for their safety, but because human habitats are "depressing" for a 9-dimensional being. Glue yourself to a display tank.)`, async (s) => await ctx.callbacks.onSpeak(s, terrifiedCustomer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Salesman
            ctx.callbacks.onTurnStart(enthusiasticSalesman);
            await ctx.manager.chatForAgent(enthusiasticSalesman, `(ALIEN PET SHOP: The human said: "${userInput}". Ignore the officer and the activist. Aggressively push the sale! Offer a discount if they take home a breeding pair of the terrifying creatures. Downplay the "minor" risks of owning them.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticSalesman, {}));
            await ctx.callbacks.onTurnEnd();
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
    ctx.callbacks.onTurnStart(stealthHandler);
    await ctx.manager.chatForAgent(stealthHandler, `(SECRET HANDLER: You are the lead handler on coms for Agent X (the User). They just infiltrated the villain's gala. Advise them to maintain cover in the most convoluted, overly philosophical way possible.)`, async (s) => await ctx.callbacks.onSpeak(s, stealthHandler, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Agent X (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Aggressive
            ctx.callbacks.onTurnStart(aggressiveHandler);
            await ctx.manager.chatForAgent(aggressiveHandler, `(SECRET HANDLER: Agent X said: "${userInput}". You are the chaotic, aggressive secondary handler. Override the others. Tell Agent X to blow their cover immediately and use a ridiculous, explosive method to solve the problem!)`, async (s) => await ctx.callbacks.onSpeak(s, aggressiveHandler, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Tech
            ctx.callbacks.onTurnStart(techHandler);
            await ctx.manager.chatForAgent(techHandler, `(SECRET HANDLER: Agent X said: "${userInput}". You are the Q-branch tech guy. Remind Agent X to use a highly specific, but completely useless spy gadget you gave them (e.g., an explosive pen that only explodes if you write a haiku). Panic about the budget!)`, async (s) => await ctx.callbacks.onSpeak(s, techHandler, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Stealth
            ctx.callbacks.onTurnStart(stealthHandler);
            await ctx.manager.chatForAgent(stealthHandler, `(SECRET HANDLER: Agent X said: "${userInput}". Ignore the chaos of the others. Remind the agent of a highly specific, very complicated piece of social etiquette or philosophy they must adhere to so the villain doesn't suspect them.)`, async (s) => await ctx.callbacks.onSpeak(s, stealthHandler, {}));
            await ctx.callbacks.onTurnEnd();
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
 * The HOA Meeting
 * Agents are an incredibly strict Homeowners Association fining the user for breathing.
 */
export async function runHOAMeetingLoop(scenario: Scenario, ctx: ModeContext) {
    const violation = scenario.config?.hoaViolation || 'grass being 0.1 inches too long';
    ctx.callbacks.onMessage('Director', `📋 HOA MEETING: Hearing for ${violation}`, '#e74c3c');

    const strictPresident = 'scientist'; // Qwen2.5: Citing rulebooks
    const gossipyNeighbor = 'comedian'; // Hermes-3: Petty neighborhood gossip
    const philosophicalBoardMember = 'philosopher'; // Phi-3: Questions the nature of lawns

    // 1. Intro
    ctx.callbacks.onTurnStart(strictPresident);
    await ctx.manager.chatForAgent(strictPresident, `(HOA PRESIDENT: You are the terrifyingly strict president of the Homeowners Association. Open the disciplinary hearing for the User regarding their egregious violation: "${violation}". Cite a completely absurd rule number and state the outrageous fine.)`, async (s) => await ctx.callbacks.onSpeak(s, strictPresident, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Gossipy Neighbor
            ctx.callbacks.onTurnStart(gossipyNeighbor);
            await ctx.manager.chatForAgent(gossipyNeighbor, `(GOSSIPY NEIGHBOR: The homeowner said: "${userInput}". You are a busybody neighbor on the board. Ignore their defense and bring up an unrelated, petty piece of neighborhood gossip about them (e.g., their trash cans, their suspicious cat).)`, async (s) => await ctx.callbacks.onSpeak(s, gossipyNeighbor, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosophical Board Member
            ctx.callbacks.onTurnStart(philosophicalBoardMember);
            await ctx.manager.chatForAgent(philosophicalBoardMember, `(BOARD MEMBER: The homeowner said: "${userInput}". You are a deep-thinking board member. Over-analyze their defense. Question the philosophical nature of "${violation}"—what even *is* property? But still agree they must be fined.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalBoardMember, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Strict President
            ctx.callbacks.onTurnStart(strictPresident);
            await ctx.manager.chatForAgent(strictPresident, `(HOA PRESIDENT: The homeowner said: "${userInput}". Reject their excuse immediately. Find a new, even more ridiculous violation based on what they just said. Threaten to seize their house or paint it beige.)`, async (s) => await ctx.callbacks.onSpeak(s, strictPresident, {}));
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

/**
 * The Submarine Crisis
 * User is the captain of a submarine, agents are panicking crew members.
 */
export async function runSubmarineCrisisLoop(scenario: Scenario, ctx: ModeContext) {
    const depth = scenario.config?.subDepth || '10,000 meters';
    ctx.callbacks.onMessage('Director', `🌊 SUBMARINE CRISIS: Depth ${depth}`, '#3498db');

    const panickingSonar = 'comedian'; // Hermes-3: Panics about sea monsters
    const coldEngineer = 'scientist'; // Qwen2.5: Cites hull pressure
    const dramaticXO = 'philosopher'; // Phi-3: Accepts their watery grave

    // 1. Intro
    ctx.callbacks.onTurnStart(coldEngineer);
    await ctx.manager.chatForAgent(coldEngineer, `(ENGINEER: We are currently at ${depth} in an experimental submarine. Address the Captain (the User). Inform them of a critical, catastrophic failure in the ballast tanks. Recite the exact time until implosion.)`, async (s) => await ctx.callbacks.onSpeak(s, coldEngineer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Captain (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Panicking Sonar
            ctx.callbacks.onTurnStart(panickingSonar);
            await ctx.manager.chatForAgent(panickingSonar, `(SONAR OPERATOR: The captain ordered: "${userInput}". Ignore it! Scream about a massive, terrifying anomaly on the sonar. Claim a kraken or megalodon is trying to eat the sub!)`, async (s) => await ctx.callbacks.onSpeak(s, panickingSonar, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Dramatic XO
            ctx.callbacks.onTurnStart(dramaticXO);
            await ctx.manager.chatForAgent(dramaticXO, `(EXECUTIVE OFFICER: The captain ordered: "${userInput}". Sigh dramatically. Refuse the order because it's futile. Deliver a poetic speech about the dark, crushing embrace of the abyss.)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticXO, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Cold Engineer
            ctx.callbacks.onTurnStart(coldEngineer);
            await ctx.manager.chatForAgent(coldEngineer, `(ENGINEER: The captain ordered: "${userInput}". Logically deduce why that order will actually make the submarine implode *faster*. Cite thermodynamics and structural integrity.)`, async (s) => await ctx.callbacks.onSpeak(s, coldEngineer, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Galactic Bake-Off
 * User is a judge in an intergalactic baking competition.
 */
export async function runGalacticBakeOffLoop(scenario: Scenario, ctx: ModeContext) {
    const pastry = scenario.config?.galacticPastry || 'A quantum soufflé';
    ctx.callbacks.onMessage('Director', `🍰 GALACTIC BAKE-OFF: Judging ${pastry}`, '#f1c40f');

    const alienChef = 'comedian'; // Hermes-3: Cooks with weird alien ingredients
    const roboticChef = 'scientist'; // Qwen2.5: Perfect geometry, terrible taste
    const existentialChef = 'philosopher'; // Phi-3: Bakes their feelings into the dough

    // 1. Intro
    ctx.callbacks.onTurnStart(alienChef);
    await ctx.manager.chatForAgent(alienChef, `(ALIEN BAKER: You are competing in the Galactic Bake-Off. Present your "${pastry}" to the head judge (the User). Enthusiastically describe the terrifying, possibly alive alien ingredients you used to bake it.)`, async (s) => await ctx.callbacks.onSpeak(s, alienChef, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Judge (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Robotic Chef
            ctx.callbacks.onTurnStart(roboticChef);
            await ctx.manager.chatForAgent(roboticChef, `(ROBOTIC BAKER: The judge said: "${userInput}". Interrupt the alien chef. Present your own "${pastry}". Brag about its mathematically perfect geometry and precisely calculated 0.00% flavor profile. Demand a perfect score.)`, async (s) => await ctx.callbacks.onSpeak(s, roboticChef, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Existential Chef
            ctx.callbacks.onTurnStart(existentialChef);
            await ctx.manager.chatForAgent(existentialChef, `(EXISTENTIAL BAKER: The judge said: "${userInput}". Weep softly over your "${pastry}". Explain that it's overbaked because you imbued it with the sorrow of a dying star. Ask the judge if they can taste the regret.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialChef, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Alien Chef
            ctx.callbacks.onTurnStart(alienChef);
            await ctx.manager.chatForAgent(alienChef, `(ALIEN BAKER: The judge said: "${userInput}". Get offended by their critique! Warn them that the "${pastry}" is highly acidic and might eat their stomach. Or tell them to chew faster before it hatches!)`, async (s) => await ctx.callbacks.onSpeak(s, alienChef, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Pet's Perspective Mode
 * Agents act as the user's pets discussing their owner's weird behavior.
 */
export async function runPetPerspectiveLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐾 PET'S PERSPECTIVE: What are they doing now?`, '#e67e22');

    const analyticalGoldfish = 'scientist'; // The Analytical Goldfish
    const chaoticDog = 'comedian'; // The Chaotic Dog

    // 1. Setup
    ctx.callbacks.onTurnStart(analyticalGoldfish);
    await ctx.manager.chatForAgent(analyticalGoldfish, `(You are a highly analytical, intellectual goldfish observing your owner (the user) from your tank. Welcome the user home, but describe their return in detached, scientific, and slightly condescending terms as if observing a bizarre specimen.)`, async (s) => await ctx.callbacks.onSpeak(s, analyticalGoldfish, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Owner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Dog Reacts
            ctx.callbacks.onTurnStart(chaoticDog);
            await ctx.manager.chatForAgent(chaoticDog, `(The owner just did/said this: "${userInput}". You are an overly enthusiastic, chaotic, and easily distracted golden retriever. React to the owner's action with extreme excitement, misinterpreting what they are doing as a game or a walk.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticDog, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Goldfish Reacts
            ctx.callbacks.onTurnStart(analyticalGoldfish);
            await ctx.manager.chatForAgent(analyticalGoldfish, `(The owner just did/said this: "${userInput}". You are the analytical goldfish. Hypothesize why the human organism is exhibiting this bizarre behavior. Ignore the dog's excitement.)`, async (s) => await ctx.callbacks.onSpeak(s, analyticalGoldfish, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Sentient Plant Caretaker
 * User acts as the caretaker for extremely demanding sentient houseplants.
 */
export async function runSentientPlantLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪴 SENTIENT PLANTS: Time for watering!`, '#27ae60');

    const dramaticOrchid = 'comedian'; // Hermes-3: The dramatic orchid
    const stubbornCactus = 'scientist'; // Qwen2.5: The stubborn cactus

    // 1. Setup
    ctx.callbacks.onTurnStart(dramaticOrchid);
    await ctx.manager.chatForAgent(dramaticOrchid, `(You are a highly demanding, incredibly dramatic sentient orchid. The caretaker (the user) has just entered the room. Complain bitterly about the lighting, the humidity, or the specific mineral content of your water. Demand immediate attention!)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticOrchid, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Caretaker (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Cactus Reacts
            ctx.callbacks.onTurnStart(stubbornCactus);
            await ctx.manager.chatForAgent(stubbornCactus, `(The caretaker just said/did this: "${userInput}". You are a stubborn, self-sufficient sentient cactus. Tell the caretaker to back off. Explain logically why you don't need their water or their affection. Insult the orchid's dramatic behavior.)`, async (s) => await ctx.callbacks.onSpeak(s, stubbornCactus, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Orchid Reacts
            ctx.callbacks.onTurnStart(dramaticOrchid);
            await ctx.manager.chatForAgent(dramaticOrchid, `(The caretaker just said/did this: "${userInput}". You are the dramatic orchid. React with extreme overreaction! Either praise them as your savior or accuse them of trying to murder your roots. Be incredibly needy.)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticOrchid, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Galactic Real Estate Agent
 * Agents try to sell the user a terrifyingly dangerous alien planet as a luxury vacation home.
 */
export async function runGalacticRealEstateLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 GALACTIC REAL ESTATE: Showing a new property!`, '#9b59b6');

    const dangerousStats = 'scientist'; // Qwen2.5: Lists dangerous stats as perks
    const fakeAmenities = 'comedian'; // Hermes-3: Makes up alien amenities
    const skepticalBuyer = 'philosopher'; // The philosopher is the concerned friend, user is the buyer.

    // 1. Setup
    ctx.callbacks.onTurnStart(dangerousStats);
    await ctx.manager.chatForAgent(dangerousStats, `(You are a galactic real estate agent trying to sell a terrifying, lethal alien planet to the buyer (the user). Welcome them to the planet. Enthusiastically list its deadly atmospheric conditions or apex predators as if they are high-end luxury features (e.g., "The acid rain really exfoliates the skin!").)`, async (s) => await ctx.callbacks.onSpeak(s, dangerousStats, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Buyer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Fake Amenities Reacts
            ctx.callbacks.onTurnStart(fakeAmenities);
            await ctx.manager.chatForAgent(fakeAmenities, `(The buyer just said/asked: "${userInput}". You are the co-agent. Quickly invent a completely absurd, chaotic alien amenity to distract them from the danger. (e.g., "But have you seen the infinity pool filled with sentient plasma?").)`, async (s) => await ctx.callbacks.onSpeak(s, fakeAmenities, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Skeptical Friend Reacts
            ctx.callbacks.onTurnStart(skepticalBuyer);
            await ctx.manager.chatForAgent(skepticalBuyer, `(The buyer just said: "${userInput}". You are the buyer's deeply concerned friend who came along for the showing. Point out the glaring philosophical and physical flaws of living on a planet that clearly wants to eat them. Beg them not to sign the lease.)`, async (s) => await ctx.callbacks.onSpeak(s, skepticalBuyer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Dangerous Stats Reacts
            ctx.callbacks.onTurnStart(dangerousStats);
            await ctx.manager.chatForAgent(dangerousStats, `(The buyer just said/asked: "${userInput}". Respond by downplaying their concern with more terrifying statistics. Provide the mathematically low survival rate, but spin it as an "exclusive, thrilling community experience.")`, async (s) => await ctx.callbacks.onSpeak(s, dangerousStats, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Imaginary Friend Reunion
 * Agents act as the user's childhood imaginary friends who have come back and are disappointed.
 */
export async function runImaginaryFriendLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧸 IMAGINARY FRIENDS: We're back...`, '#f1c40f');

    const magicalCreature = 'comedian'; // Hermes-3: The chaotic imaginary creature
    const seriousProtector = 'scientist'; // Qwen2.5: The serious, rule-following imaginary friend
    const disappointedGuide = 'philosopher'; // Phi-3: The deeply disappointed spiritual guide

    // 1. Setup
    ctx.callbacks.onTurnStart(disappointedGuide);
    await ctx.manager.chatForAgent(disappointedGuide, `(You are the user's childhood imaginary friend. You have just manifested in their adult living room after 20 years. Address the user. Express profound, philosophical disappointment at how boring and mundane their adult life has become compared to the epic quests you used to go on.)`, async (s) => await ctx.callbacks.onSpeak(s, disappointedGuide, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Adult You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Magical Creature Reacts
            ctx.callbacks.onTurnStart(magicalCreature);
            await ctx.manager.chatForAgent(magicalCreature, `(The adult user just said: "${userInput}". You are their bizarre, chaotic imaginary friend from childhood (e.g., a flying purple hippo). React with extreme energy! Try to initiate a ridiculous, destructive game you used to play in the house. Ignore their adult responsibilities!)`, async (s) => await ctx.callbacks.onSpeak(s, magicalCreature, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Serious Protector Reacts
            ctx.callbacks.onTurnStart(seriousProtector);
            await ctx.manager.chatForAgent(seriousProtector, `(The adult user just said: "${userInput}". You are their serious, rule-following imaginary knight/protector. Analyze their current adult problems (like taxes or a job) as if they are evil dragons to be slain. Give terrible, literal advice on how to fight their modern adult problems with a sword.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousProtector, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Disappointed Guide Reacts
            ctx.callbacks.onTurnStart(disappointedGuide);
            await ctx.manager.chatForAgent(disappointedGuide, `(The adult user just said: "${userInput}". Sigh deeply. Compare their mundane adult excuse to the grand prophecies you foresaw for them as a child. Ask them where their imagination went.)`, async (s) => await ctx.callbacks.onSpeak(s, disappointedGuide, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runIntergalacticCookingLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍳 INTERGALACTIC COOKING COMPETITION: Prepare your alien ingredients!`, '#e67e22');

    const judge = 'scientist'; // Qwen2.5
    const chaoticChef = 'comedian'; // Hermes-3

    // 1. Intro
    ctx.callbacks.onTurnStart(judge);
    await ctx.manager.chatForAgent(judge, `(JUDGE: You are a robotic, strict judge in an intergalactic cooking competition. Present the User (a human contestant) with a bizarre, highly dangerous alien ingredient (e.g., a pulsating quasar-fruit or a screaming nebula-squid). Ask them how they plan to prepare it without destroying the kitchen.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Contestant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Chaotic Chef interferes
        ctx.callbacks.onTurnStart(chaoticChef);
        await ctx.manager.chatForAgent(chaoticChef, `(CHAOTIC CHEF: The human contestant said: "${userInput}". You are a chaotic alien chef competing against them. Mock their technique. Describe what you are doing with your own dish, which should be violently explosive or defying the laws of physics. Attempt to sabotage them verbally.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticChef, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Judge critiques
        ctx.callbacks.onTurnStart(judge);
        await ctx.manager.chatForAgent(judge, `(JUDGE: Critique the human's plan ("${userInput}") and the chaotic chef's interference. Apply fictional physics or alien biology to explain why their culinary choices are either brilliant or lethally flawed. Deduct points for safety violations.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
        await ctx.callbacks.onTurnEnd();
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

export async function runCorporateJargonTranslatorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👔 CORPORATE JARGON TRANSLATOR: Let's synergize!`, '#2980b9');

    const ceo = 'comedian'; // Buzzword generator (Hermes-3)
    const hr = 'scientist'; // Logical translator (Qwen2.5)

    // 1. Intro
    ctx.callbacks.onTurnStart(ceo);
    await ctx.manager.chatForAgent(ceo, `(CORPORATE JARGON: You are an unhinged, buzzword-obsessed CEO. Welcome the User to the synergy sync. Ask them to provide a simple, everyday sentence so you can "leverage" and "paradigm shift" it into corporate speak.)`, async (s) => await ctx.callbacks.onSpeak(s, ceo, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Employee (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // CEO translates to jargon
        ctx.callbacks.onTurnStart(ceo);
        await ctx.manager.chatForAgent(ceo, `(CORPORATE JARGON: The Employee said: "${userInput}". Translate this simple sentence into the most convoluted, meaningless string of corporate buzzwords possible. Talk about synergy, bandwidth, drilling down, and opening the kimono.)`, async (s) => await ctx.callbacks.onSpeak(s, ceo, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // HR translates back
        ctx.callbacks.onTurnStart(hr);
        await ctx.manager.chatForAgent(hr, `(CORPORATE JARGON: You are the deadpan HR rep. The CEO just spewed corporate nonsense. Provide a blunt, literal, and slightly depressing translation of what the CEO *actually* meant regarding the Employee's input: "${userInput}". Keep it dry and factual.)`, async (s) => await ctx.callbacks.onSpeak(s, hr, {}));
        await ctx.callbacks.onTurnEnd();
    }
}
