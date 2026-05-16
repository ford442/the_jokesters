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

