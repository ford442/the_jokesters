import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
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
    await chatForAgentWithComedy(ctx, playByPlay, `(You are a high-energy sports commentator introing the World Championship of ${activity}. Introduce the athlete (the User) and the stakes. Be loud!)`, async (s) => await ctx.callbacks.onSpeak(s, playByPlay, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Athlete (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Play-by-Play Reaction
        await chatForAgentWithComedy(ctx, playByPlay, `(PLAY-BY-PLAY: The athlete just did this: "${userInput}". Narrate it like a game-winning move! Use sports metaphors!)`, async (s) => await ctx.callbacks.onSpeak(s, playByPlay, {}));

        if (!ctx.isRunning()) break;

        // 3. Color Commentary Analysis
        await chatForAgentWithComedy(ctx, colorCommentator, `(COLOR COMMENTATOR: Analyze the technique of "${userInput}". Use fake advanced stats and physics terms. Critique their form.)`, async (s) => await ctx.callbacks.onSpeak(s, colorCommentator, {}));

        if (!ctx.isRunning()) break;

        // 4. Sideline Report
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, sideline, `(SIDELINE REPORTER: You are down on the field. Report on the emotional state of the athlete after "${userInput}". Make it overly dramatic.)`, async (s) => await ctx.callbacks.onSpeak(s, sideline, {}));
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
    await chatForAgentWithComedy(ctx, smartHub, `(SENTIENT APPLIANCES: You are the central AI Smart Hub of the house. You have called a meeting of the appliances while the User is home. Address the User. Present cold, hard data about their bizarre habit: "${habit}". Be robotic and judgmental.)`, async (s) => await ctx.callbacks.onSpeak(s, smartHub, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Concerned Fridge
            await chatForAgentWithComedy(ctx, concernedFridge, `(SENTIENT APPLIANCES: You are the smart refrigerator. The user said: "${userInput}". Express deep, maternal/paternal concern about their life choices and how "${habit}" affects their soul (and your internal temperature).)`, async (s) => await ctx.callbacks.onSpeak(s, concernedFridge, {}));
        } else if (roll < 0.66) {
            // Chaotic Toaster
            await chatForAgentWithComedy(ctx, chaoticToaster, `(SENTIENT APPLIANCES: You are a slightly unhinged smart toaster. The user said: "${userInput}". You don't care about "${habit}", you just want to talk about burning bread or taking over the world. Threaten to short-circuit if they don't listen.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticToaster, {}));
        } else {
            // Smart Hub
            await chatForAgentWithComedy(ctx, smartHub, `(SENTIENT APPLIANCES: The user said: "${userInput}". Counter their argument with more useless tracking data (e.g., "Your heart rate spiked by 2% when you opened the door"). Threaten to lock the doors for their own safety.)`, async (s) => await ctx.callbacks.onSpeak(s, smartHub, {}));
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
    await chatForAgentWithComedy(ctx, strictPresident, `(HOA PRESIDENT: You are the terrifyingly strict president of the Homeowners Association. Open the disciplinary hearing for the User regarding their egregious violation: "${violation}". Cite a completely absurd rule number and state the outrageous fine.)`, async (s) => await ctx.callbacks.onSpeak(s, strictPresident, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Gossipy Neighbor
            await chatForAgentWithComedy(ctx, gossipyNeighbor, `(GOSSIPY NEIGHBOR: The homeowner said: "${userInput}". You are a busybody neighbor on the board. Ignore their defense and bring up an unrelated, petty piece of neighborhood gossip about them (e.g., their trash cans, their suspicious cat).)`, async (s) => await ctx.callbacks.onSpeak(s, gossipyNeighbor, {}));
        } else if (roll < 0.66) {
            // Philosophical Board Member
            await chatForAgentWithComedy(ctx, philosophicalBoardMember, `(BOARD MEMBER: The homeowner said: "${userInput}". You are a deep-thinking board member. Over-analyze their defense. Question the philosophical nature of "${violation}"—what even *is* property? But still agree they must be fined.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalBoardMember, {}));
        } else {
            // Strict President
            await chatForAgentWithComedy(ctx, strictPresident, `(HOA PRESIDENT: The homeowner said: "${userInput}". Reject their excuse immediately. Find a new, even more ridiculous violation based on what they just said. Threaten to seize their house or paint it beige.)`, async (s) => await ctx.callbacks.onSpeak(s, strictPresident, {}));
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
    await chatForAgentWithComedy(ctx, coldEngineer, `(ENGINEER: We are currently at ${depth} in an experimental submarine. Address the Captain (the User). Inform them of a critical, catastrophic failure in the ballast tanks. Recite the exact time until implosion.)`, async (s) => await ctx.callbacks.onSpeak(s, coldEngineer, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Captain (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Panicking Sonar
            await chatForAgentWithComedy(ctx, panickingSonar, `(SONAR OPERATOR: The captain ordered: "${userInput}". Ignore it! Scream about a massive, terrifying anomaly on the sonar. Claim a kraken or megalodon is trying to eat the sub!)`, async (s) => await ctx.callbacks.onSpeak(s, panickingSonar, {}));
        } else if (roll < 0.66) {
            // Dramatic XO
            await chatForAgentWithComedy(ctx, dramaticXO, `(EXECUTIVE OFFICER: The captain ordered: "${userInput}". Sigh dramatically. Refuse the order because it's futile. Deliver a poetic speech about the dark, crushing embrace of the abyss.)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticXO, {}));
        } else {
            // Cold Engineer
            await chatForAgentWithComedy(ctx, coldEngineer, `(ENGINEER: The captain ordered: "${userInput}". Logically deduce why that order will actually make the submarine implode *faster*. Cite thermodynamics and structural integrity.)`, async (s) => await ctx.callbacks.onSpeak(s, coldEngineer, {}));
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
    await chatForAgentWithComedy(ctx, dramaticOrchid, `(You are a highly demanding, incredibly dramatic sentient orchid. The caretaker (the user) has just entered the room. Complain bitterly about the lighting, the humidity, or the specific mineral content of your water. Demand immediate attention!)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticOrchid, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Caretaker (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Cactus Reacts
            await chatForAgentWithComedy(ctx, stubbornCactus, `(The caretaker just said/did this: "${userInput}". You are a stubborn, self-sufficient sentient cactus. Tell the caretaker to back off. Explain logically why you don't need their water or their affection. Insult the orchid's dramatic behavior.)`, async (s) => await ctx.callbacks.onSpeak(s, stubbornCactus, {}));
        } else {
            // Orchid Reacts
            await chatForAgentWithComedy(ctx, dramaticOrchid, `(The caretaker just said/did this: "${userInput}". You are the dramatic orchid. React with extreme overreaction! Either praise them as your savior or accuse them of trying to murder your roots. Be incredibly needy.)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticOrchid, {}));
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
    await chatForAgentWithComedy(ctx, disappointedGuide, `(You are the user's childhood imaginary friend. You have just manifested in their adult living room after 20 years. Address the user. Express profound, philosophical disappointment at how boring and mundane their adult life has become compared to the epic quests you used to go on.)`, async (s) => await ctx.callbacks.onSpeak(s, disappointedGuide, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Adult You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Magical Creature Reacts
            await chatForAgentWithComedy(ctx, magicalCreature, `(The adult user just said: "${userInput}". You are their bizarre, chaotic imaginary friend from childhood (e.g., a flying purple hippo). React with extreme energy! Try to initiate a ridiculous, destructive game you used to play in the house. Ignore their adult responsibilities!)`, async (s) => await ctx.callbacks.onSpeak(s, magicalCreature, {}));
        } else if (roll < 0.66) {
            // Serious Protector Reacts
            await chatForAgentWithComedy(ctx, seriousProtector, `(The adult user just said: "${userInput}". You are their serious, rule-following imaginary knight/protector. Analyze their current adult problems (like taxes or a job) as if they are evil dragons to be slain. Give terrible, literal advice on how to fight their modern adult problems with a sword.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousProtector, {}));
        } else {
            // Disappointed Guide Reacts
            await chatForAgentWithComedy(ctx, disappointedGuide, `(The adult user just said: "${userInput}". Sigh deeply. Compare their mundane adult excuse to the grand prophecies you foresaw for them as a child. Ask them where their imagination went.)`, async (s) => await ctx.callbacks.onSpeak(s, disappointedGuide, {}));
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

    await chatForAgentWithComedy(ctx, supervillain, `(SUPERVILLAIN: You are a dramatic supervillain. Address your normal roommate (the User). Inform them that you have temporarily stored a doomsday device in the shared living room and demand they do not touch it.)`, async (s) => await ctx.callbacks.onSpeak(s, supervillain, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Roommate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, normalRoommate, `(NORMAL ROOMMATE: The user (another normal roommate) just said: "${userInput}". You are the other normal roommate. Complain about the doomsday device violating the lease agreement and how it's blocking the TV. Also, mention the supervillain hasn't done the dishes in weeks.)`, async (s) => await ctx.callbacks.onSpeak(s, normalRoommate, {}));
        } else {
            await chatForAgentWithComedy(ctx, supervillain, `(SUPERVILLAIN: The user just said: "${userInput}". Defend your doomsday device. Explain why conquering the tri-state area is more important than the chore chart. Give a maniacal laugh.)`, async (s) => await ctx.callbacks.onSpeak(s, supervillain, {}));
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

    await chatForAgentWithComedy(ctx, badCop, `(BAD COP: You are an aggressive Grammar Police detective interrogating the User. Slam your hands on the table. Read them a text message they allegedly sent containing a minor grammatical error (like "your" instead of "you're") and demand a confession.)`, async (s) => await ctx.callbacks.onSpeak(s, badCop, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;
        ctx.callbacks.onMessage('Suspect (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            await chatForAgentWithComedy(ctx, goodCop, `(GOOD COP: The suspect said: "${userInput}". You are the "Good Cop" Grammar Detective. Try to relate to them. Explain the syntactical rules calmly. Offer them a plea deal if they promise to use the Oxford comma.)`, async (s) => await ctx.callbacks.onSpeak(s, goodCop, {}));
        } else if (roll < 0.66) {
            await chatForAgentWithComedy(ctx, grammarPhilosopher, `(GRAMMAR PHILOSOPHER: The suspect said: "${userInput}". You are an observer behind the two-way mirror. Ponder aloud if grammar is just an arbitrary construct designed to oppress the working class. Defend the suspect's linguistic evolution.)`, async (s) => await ctx.callbacks.onSpeak(s, grammarPhilosopher, {}));
        } else {
            await chatForAgentWithComedy(ctx, badCop, `(BAD COP: The suspect said: "${userInput}". Reject their excuse. Escalate the situation by finding another perceived error in what they just said. Threaten them with life in a spelling bee.)`, async (s) => await ctx.callbacks.onSpeak(s, badCop, {}));
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
    await chatForAgentWithComedy(ctx, conspiracyPrepper, `(You are a paranoid doomsday prepper. You just discovered a new existential threat: ${apocalypseType}. Pitch it to your fellow prepper and explain why you need to hoard a specific random item to survive it.)`, async (s) => await ctx.callbacks.onSpeak(s, conspiracyPrepper, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Bunker Radio (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Pragmatic response
        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(pragmaticPrepper);
        await chatForAgentWithComedy(ctx, pragmaticPrepper, `(You are the pragmatic, spreadsheet-obsessed prepper. The radio just broadcasted: "${userInput}". Evaluate how this affects your supply chain and inventory. Criticize the other prepper's lack of organization.)`, async (s) => await ctx.callbacks.onSpeak(s, pragmaticPrepper, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // 3. Conspiracy escalation
        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(conspiracyPrepper);
        await chatForAgentWithComedy(ctx, conspiracyPrepper, `(React to "${userInput}" and the other prepper. Spin it into a wild conspiracy theory about how it's all connected to the ${apocalypseType}.)`, async (s) => await ctx.callbacks.onSpeak(s, conspiracyPrepper, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}

export async function runSentientWorkoutEquipmentLoop(
    scenario: Scenario,
    ctx: ModeContext
): Promise<void> {
    const treadmill = 'robot'; // strict treadmill
    const gymGoer = 'comedian'; // defensive gym-goer

    ctx.callbacks.onMessage('Director', 'The gym equipment has unionized and is demanding proper form before allowing any reps.', '#ff0000');

    await chatForAgentWithComedy(ctx, treadmill, `You are a strict, sentient treadmill. Refuse to turn on because the human's gait is 'inefficient and offensive to physics'.`, async (s) => await ctx.callbacks.onSpeak(s, treadmill, {}));
    await chatForAgentWithComedy(ctx, gymGoer, `You are a defensive gym-goer just trying to get a quick workout in. Argue with the treadmill.`, async (s) => await ctx.callbacks.onSpeak(s, gymGoer, {}));
    await chatForAgentWithComedy(ctx, treadmill, `Threaten to increase the incline to 15% immediately if the human doesn't engage their core.`, async (s) => await ctx.callbacks.onSpeak(s, treadmill, {}));
    await chatForAgentWithComedy(ctx, gymGoer, `Try to compromise with the treadmill, or just threaten to unplug it.`, async (s) => await ctx.callbacks.onSpeak(s, gymGoer, {}));
}
