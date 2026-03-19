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
