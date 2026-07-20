import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Miscellaneous and unique scenarios

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


/**
 * Supervillain Roommate
 * Agents act as a supervillain and a normal roommate arguing over chore charts and doomsday devices.
 */
export async function runSupervillainRoommateLoop(scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🦹 SUPERVILLAIN ROOMMATE: Doomsday vs Dishes`, '#9b59b6');

    const supervillain = 'comedian'; // Hermes-3: Melodramatic supervillain
    const normalRoommate = 'scientist'; // Qwen2.5: Logical, annoyed normal roommate

    ctx.callbacks.onTurnStart(supervillain);
    await ctx.manager.chatForAgent(supervillain, `(SUPERVILLAIN: You are a dramatic supervillain. Address your normal roommate (the User). Inform them that you have temporarily stored a doomsday device in the shared living room and demand they do not touch it.)`, async (s) => await ctx.callbacks.onSpeak(s, supervillain, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Roommate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(normalRoommate);
            await ctx.manager.chatForAgent(normalRoommate, `(NORMAL ROOMMATE: The user (another normal roommate) just said: "${userInput}". You are the other normal roommate. Complain about the doomsday device violating the lease agreement and how it's blocking the TV. Also, mention the supervillain hasn't done the dishes in weeks.)`, async (s) => await ctx.callbacks.onSpeak(s, normalRoommate, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(supervillain);
            await ctx.manager.chatForAgent(supervillain, `(SUPERVILLAIN: The user just said: "${userInput}". Defend your doomsday device. Explain why conquering the tri-state area is more important than the chore chart. Give a maniacal laugh.)`, async (s) => await ctx.callbacks.onSpeak(s, supervillain, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Grammar Police Interrogation
 * Agents interrogate the user over minor grammar mistakes in a text message.
 */
export async function runGrammarPoliceInterrogationLoop(scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👮 GRAMMAR POLICE: Interrogation Room 4`, '#e74c3c');

    const badCop = 'comedian'; // Hermes-3: Aggressive and ridiculous
    const goodCop = 'scientist'; // Qwen2.5: Logical, citing rules of syntax
    const grammarPhilosopher = 'philosopher'; // Phi-3: Questioning the nature of language

    ctx.callbacks.onTurnStart(badCop);
    await ctx.manager.chatForAgent(badCop, `(BAD COP: You are an aggressive Grammar Police detective interrogating the User. Slam your hands on the table. Read them a text message they allegedly sent containing a minor grammatical error (like "your" instead of "you're") and demand a confession.)`, async (s) => await ctx.callbacks.onSpeak(s, badCop, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;
        ctx.callbacks.onMessage('Suspect (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            ctx.callbacks.onTurnStart(goodCop);
            await ctx.manager.chatForAgent(goodCop, `(GOOD COP: The suspect said: "${userInput}". You are the "Good Cop" Grammar Detective. Try to relate to them. Explain the syntactical rules calmly. Offer them a plea deal if they promise to use the Oxford comma.)`, async (s) => await ctx.callbacks.onSpeak(s, goodCop, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            ctx.callbacks.onTurnStart(grammarPhilosopher);
            await ctx.manager.chatForAgent(grammarPhilosopher, `(GRAMMAR PHILOSOPHER: The suspect said: "${userInput}". You are an observer behind the two-way mirror. Ponder aloud if grammar is just an arbitrary construct designed to oppress the working class. Defend the suspect's linguistic evolution.)`, async (s) => await ctx.callbacks.onSpeak(s, grammarPhilosopher, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(badCop);
            await ctx.manager.chatForAgent(badCop, `(BAD COP: The suspect said: "${userInput}". Reject their excuse. Escalate the situation by finding another perceived error in what they just said. Threaten them with life in a spelling bee.)`, async (s) => await ctx.callbacks.onSpeak(s, badCop, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Over-prepared Doomsday Preppers Mode
 * Preppers argue over which highly specific and unlikely apocalypse they should prepare for next week.
 */
export async function runOverPreparedDoomsdayPreppersLoop(scenario: Scenario, ctx: ModeContext) {
    const apocalypseType = scenario.config?.apocalypseType || 'Y2K but for toasters';
    ctx.callbacks.onMessage('Director', `🥫 BUNKERS READY: Preparing for ${apocalypseType}`, '#e67e22');

    const conspiracyPrepper = 'comedian'; // Hermes-3: Paranoid and unhinged
    const pragmaticPrepper = 'scientist'; // Qwen2.5: Obsessed with spreadsheets and inventory

    // 1. Initial Briefing
    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(conspiracyPrepper);
    await ctx.manager.chatForAgent(conspiracyPrepper, `(You are a paranoid doomsday prepper. You just discovered a new existential threat: ${apocalypseType}. Pitch it to your fellow prepper and explain why you need to hoard a specific random item to survive it.)`, async (s) => await ctx.callbacks.onSpeak(s, conspiracyPrepper, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Bunker Radio (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Pragmatic response
        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(pragmaticPrepper);
        await ctx.manager.chatForAgent(pragmaticPrepper, `(You are the pragmatic, spreadsheet-obsessed prepper. The radio just broadcasted: "${userInput}". Evaluate how this affects your supply chain and inventory. Criticize the other prepper's lack of organization.)`, async (s) => await ctx.callbacks.onSpeak(s, pragmaticPrepper, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 3. Conspiracy escalation
        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(conspiracyPrepper);
        await ctx.manager.chatForAgent(conspiracyPrepper, `(React to "${userInput}" and the other prepper. Spin it into a wild conspiracy theory about how it's all connected to the ${apocalypseType}.)`, async (s) => await ctx.callbacks.onSpeak(s, conspiracyPrepper, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}
