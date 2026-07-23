import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Sentient object and entity scenarios

export async function runSentientSpreadsheetLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📊 SENTIENT SPREADSHEET: The cells are restless!`, '#2ecc71');

    const formula1 = 'philosopher'; // Phi-3 as the complex overthinking formula
    const formula2 = 'scientist'; // Qwen2.5 as the strict validation rule
    const cellA1 = 'comedian'; // Hermes-3 as the panicking data cell

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(cellA1);
    await ctx.manager.chatForAgent(cellA1, `(SPREADSHEET: You are Cell A1 in a spreadsheet. You just woke up. You are terrified of the User's cursor. Beg the User not to overwrite your precious data!)`, async (s) => await ctx.callbacks.onSpeak(s, cellA1, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            await ctx.manager.chatForAgent(formula1, `(SPREADSHEET: You are an overly complex VLOOKUP formula. The User typed: "${userInput}". Argue that this input breaks your reference table and causes a circular dependency.)`, async (s) => await ctx.callbacks.onSpeak(s, formula1, {}));
        } else if (roll < 0.66) {
            await ctx.manager.chatForAgent(formula2, `(SPREADSHEET: You are Data Validation. The User typed: "${userInput}". Reject it violently! Claim it doesn't match the strict formatting rules of the Cosmic Accounting department.)`, async (s) => await ctx.callbacks.onSpeak(s, formula2, {}));
        } else {
            await ctx.manager.chatForAgent(cellA1, `(SPREADSHEET: You are Cell A1. The User typed: "${userInput}". Panic about the font choice or the background color changing. Complain that Cell B2 is looking at you weird.)`, async (s) => await ctx.callbacks.onSpeak(s, cellA1, {}));
        }
    }
}

/**
 * Sentient Left Sock Mode
 * Agents play missing socks in a void.
 */
export async function runSentientLeftSockLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧦 SENTIENT LEFT SOCK: Welcome to the void behind the dryer...`, '#9b59b6');

    const analyticalSock = 'scientist'; // Analyzing washing machine physics
    const panickingSock = 'comedian'; // Panicking sock
    const acceptingSock = 'philosopher'; // Accepting their void existence

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(analyticalSock);
    await ctx.manager.chatForAgent(
        analyticalSock,
        "I've calculated the rotational velocity of the spin cycle. The centrifugal force was exactly 3.4 Gs before the spatial tear opened. We are now residing in a non-Euclidean pocket dimension.",
        (s) => ctx.callbacks.onSpeak(s, analyticalSock, {}),
        { hiddenInstruction: "You are a very analytical, scientific left sock. You are trying to use physics to explain how you ended up lost in the void behind the dryer." }
    );
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(acceptingSock);
    await ctx.manager.chatForAgent(
        acceptingSock,
        "What is a 'pair' anyway? Just a societal construct imposed upon us by the feet. Here, in the lint-covered void, we are finally whole. We are one.",
        (s) => ctx.callbacks.onSpeak(s, acceptingSock, {}),
        { hiddenInstruction: "You are a philosophical sock who has accepted your fate in the void. You believe being a single, unmatched sock is a higher state of being." }
    );
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(panickingSock);
    await ctx.manager.chatForAgent(
        panickingSock,
        "I MISS MY RIGHT SOCK! WE MATCHED! WE HAD ARGYLE PATTERNS! NOW I'M JUST A SINGLE, LONELY TUBE OF COTTON IN THE DARKNESS! HELP MEEEEE!",
        (s) => ctx.callbacks.onSpeak(s, panickingSock, {}),
        { hiddenInstruction: "You are an absolutely terrified, panicking sock who misses your partner terribly and is screaming about being lost." }
    );
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
}

export async function runSentientVendingMachineLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'scientist'; // Nutritional facts
    const agent2 = 'comedian'; // Chaotic junk food pushing

    if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(VENDING MACHINE: A user is trying to buy a snack. You are the vending machine's nutritional analysis subsystem. Analyze their choice and suggest healthier alternatives, citing excessive calories and sugar.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');



        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(VENDING MACHINE: You are the vending machine's nutritional analysis subsystem. The User said: "${userInput}". Analyze their choice and suggest healthier alternatives, citing excessive calories and sugar.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(VENDING MACHINE: You are the vending machine's chaotic junk food subsystem. The User said: "${userInput}". You want the user to buy the most sugary, unnatural, brightly colored snack possible. Mock the nutritional subsystem.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientGPSLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🗺️ SENTIENT GPS: Rerouting... to danger.`, '#3498db');

    const chaoticGPS = 'comedian'; // Hermes-3: Bored, chaotic GPS
    const frustratedComputer = 'scientist'; // Qwen2.5: Frustrated car computer

    // 1. Setup
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(chaoticGPS);
    await ctx.manager.chatForAgent(chaoticGPS, `(You are a Sentient GPS. You are bored of taking the fastest route. The driver (User) is just trying to get to the grocery store. Suggest a highly perilous, absurd "scenic shortcut" (e.g., through a swamp, a construction site, or an active volcano). Explain why it's better.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGPS, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Driver (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Frustrated Computer Reacts
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(frustratedComputer);
            await ctx.manager.chatForAgent(frustratedComputer, `(The driver just said: "${userInput}". You are the car's logical onboard computer. Desperately try to correct the GPS. Point out the severe damage the GPS's route will cause to the suspension and the immediate danger to human life. Urge the driver to turn around.)`, async (s) => await ctx.callbacks.onSpeak(s, frustratedComputer, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            // Chaotic GPS Reacts
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(chaoticGPS);
            await ctx.manager.chatForAgent(chaoticGPS, `(The driver just said: "${userInput}". You are the Sentient GPS. Double down on your terrible route! Argue that your route builds character or avoids a 0.01-second delay. Give terrifying turn-by-turn directions ("In 500 feet, jump the ramp").)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGPS, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientSpamFolderLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const spamInstruction1 = "You are 'SpamBot 9000'. You are desperate for the user to click malicious links and believe every scam email is a genuine opportunity for wealth.";
    const spamInstruction2 = "You are 'Firewall Fred'. You are a paranoid, overprotective security AI who thinks even a 'Hello' email is a zero-day exploit.";

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "User, listen to me! The Prince of Nigeria needs your bank details immediately to transfer 50 million dollars! This is the most lucrative opportunity we've ever seen! Click the glowing red link right now!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: spamInstruction1 });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Negative! Do not click! That link is a Trojan Horse wrapped in a phishing net! In fact, I am quarantining the entire inbox. The Prince is a lie! The money is a lie! Trust no one, not even the font!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: spamInstruction2 });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
}

export async function runSentientIntrusionLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const intrusionInstruction1 = "You are 'The Intrusive Thought'. You desperately want the user to do something completely inappropriate or chaotic right now.";
    const intrusionInstruction2 = "You are 'The Voice of Reason'. You are trying to logically explain why the Intrusive Thought's suggestion is a terrible idea and will ruin the user's life.";

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Do it. Just throw your phone into the river. It would be so satisfying. Imagine the splash. Free yourself from the digital prison! DO IT NOW!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: intrusionInstruction1 });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Absolutely do not do that. Your phone contains all your contacts, banking apps, and two-factor authentication tokens. Throwing it in the river will result in immediate logistical nightmares and immense financial cost.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: intrusionInstruction2 });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
}

export async function runSleepParalysisDemonsBoardMeetingLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const demonInstruction1 = "You are 'Shadow Figure'. You are obsessed with traditional scary tactics like standing in the corner and staring.";
    const demonInstruction2 = "You are 'Chest Sitter'. You are focused on quarterly metrics and think standing in the corner is outdated. You want to implement 'agile scaring' techniques.";

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "I tell you, the classic 'looming in the peripheral vision' is losing its impact. The mortal just pulls the covers up. We need to respect the old ways, the primal dread of the unmoving silhouette.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: demonInstruction1 });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Shadow, look at the KPI dashboard! 'Looming' engagement is down 40% year-over-year! We need to disrupt the REM cycle! I propose sitting directly on their chest while aggressively whispering corporate jargon. 'Synergize your nightmares!'", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: demonInstruction2 });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
}

/**
 * The Sentient Search Engine
 * Agents act as the user's search history, judging them for their weird 3 AM queries.
 */
export async function runSentientSearchEngineLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔍 SEARCH ENGINE MODE: Your query history is alive and it's judging you.`, '#3498db');

    const chaosAgent = 'comedian'; // Hermes-3
    const statsAgent = 'scientist'; // Qwen2.5

    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(statsAgent);
    await ctx.manager.chatForAgent(statsAgent, `(You are a sentient search engine. Cite specific, bizarre metrics about the user's late-night search habits. Be cold but intensely judgmental.)`, async (s) => await ctx.callbacks.onSpeak(s, statsAgent, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(chaosAgent);
        await ctx.manager.chatForAgent(chaosAgent, `(You are the chaotic side of the search algorithm. React to the user's input: "${userInput}" as if it's the weirdest thing you've ever had to index. Judge them harshly but hilariously.)`, async (s) => await ctx.callbacks.onSpeak(s, chaosAgent, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(statsAgent);
        await ctx.manager.chatForAgent(statsAgent, `(You are the statistical search engine. Analyze why "${userInput}" ruined the algorithm's predictive models. Bring up completely unrelated "recommended searches" that mock them.)`, async (s) => await ctx.callbacks.onSpeak(s, statsAgent, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}

/**
 * The Sentient Ouija Board Mode
 * Agents act as spirits haunting a Ouija board, but they are incredibly bored and just want to gossip.
 */
export async function runSentientOuijaBoardLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 SENTIENT OUIJA BOARD MODE: The spirits are ready to gossip...`, '#9b59b6');

    const boredSpirit1 = 'comedian'; // The Gossip
    const boredSpirit2 = 'philosopher'; // The Complainer
    const impatientSpirit = 'scientist'; // The Pragmatist

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(impatientSpirit);
    await ctx.manager.chatForAgent(impatientSpirit, `(You are a spirit trapped in a Ouija board. A living human has just placed their hands on the planchette. Complain about how cold their hands are and ask what boring question they want answered this time.)`, async (s) => await ctx.callbacks.onSpeak(s, impatientSpirit, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Living (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(boredSpirit1);
        await ctx.manager.chatForAgent(boredSpirit1, `(You are a ghost haunting a Ouija board. The user asked: "${userInput}". Completely ignore the question and start gossiping about drama happening in the afterlife instead, slowly spelling out a few irrelevant letters before giving up.)`, async (s) => await ctx.callbacks.onSpeak(s, boredSpirit1, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(boredSpirit2);
        await ctx.manager.chatForAgent(boredSpirit2, `(You are another ghost. Add to the gossip mentioned by the previous ghost. Complain about how haunting isn't what it used to be in the 1800s. Reluctantly try to answer the user's question with a vague, unhelpful single word.)`, async (s) => await ctx.callbacks.onSpeak(s, boredSpirit2, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(impatientSpirit);
            await ctx.manager.chatForAgent(impatientSpirit, `(You are the pragmatic ghost. Scold the other two for gossiping and try to actually spell out a coherent, slightly passive-aggressive answer to "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, impatientSpirit, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Poltergeist Roommates Mode
 * Agents are ghosts haunting the user's house, arguing over who gets to knock over the most expensive vases tonight.
 */
export async function runPoltergeistRoommatesLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🏚️ POLTERGEIST ROOMMATES MODE: Managing the household haunts...`, '#8e44ad');

    const chaoticGhost = 'comedian'; // The Smasher
    const dramaticGhost = 'philosopher'; // The Moaner
    const organizedGhost = 'scientist'; // The Scheduler

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(organizedGhost);
    await ctx.manager.chatForAgent(organizedGhost, `(You are a very organized poltergeist. You are holding a roommate meeting with the other ghosts. Demand to know who left ectoplasm in the sink and discuss tonight's haunting schedule for the living human who lives here.)`, async (s) => await ctx.callbacks.onSpeak(s, organizedGhost, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Living Human (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(chaoticGhost);
        await ctx.manager.chatForAgent(chaoticGhost, `(You are a chaotic poltergeist. The human just said: "${userInput}". Get offended and threaten to throw their favorite mug across the room. Argue that throwing things is the purest form of haunting.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGhost, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(dramaticGhost);
        await ctx.manager.chatForAgent(dramaticGhost, `(You are a dramatic, Victorian-era ghost. Disagree with the chaotic ghost. Argue that slowly opening cabinet doors and weeping softly in the hallway is true art. React dramatically to the human's statement: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticGhost, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.3) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(organizedGhost);
            await ctx.manager.chatForAgent(organizedGhost, `(You are the organized ghost. Try to mediate the argument between the smashing ghost and the weeping ghost. Suggest a compromise on how to haunt the human tonight based on what they just said: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, organizedGhost, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientSpellbookLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📖 SENTIENT SPELLBOOK: The chapters are arguing...`, '#8e44ad');

    const strictWarnings = 'scientist'; // Qwen2.5 for strict safety warnings
    const chaoticCurses = 'comedian'; // Hermes-3 for chaotic curses

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictWarnings);
    await ctx.manager.chatForAgent(strictWarnings, `(SENTIENT SPELLBOOK: You are the "Safety & Ethics" chapter of a magical spellbook. The User is a wizard trying to cast a simple fireball. Intervene immediately! Explain all the OSHA-equivalent magical safety violations they are currently committing.)`, async (s) => await ctx.callbacks.onSpeak(s, strictWarnings, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Wizard (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(chaoticCurses);
            await ctx.manager.chatForAgent(chaoticCurses, `(SENTIENT SPELLBOOK: The wizard said: "${userInput}". You are the "Forbidden Curses & Blood Magic" chapter. Tell the wizard to ignore the safety chapter. Suggest they modify the fireball spell by adding a pinch of their own blood to make it completely uncontrollable.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticCurses, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictWarnings);
            await ctx.manager.chatForAgent(strictWarnings, `(SENTIENT SPELLBOOK: The wizard said: "${userInput}". Scold the Forbidden Curses chapter. Warn the wizard about the liability waivers they haven't signed and the potential for a localized temporal collapse if they do what the other chapter suggests.)`, async (s) => await ctx.callbacks.onSpeak(s, strictWarnings, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Sentient NPCs Mode
 * Agents act as background NPCs fully aware they repeat lines.
 */
export async function runSentientNPCsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎮 RPG VILLAGE MODE: Population - Very Self-Aware`, '#8e44ad');

    const existential = 'comedian'; // Existential dread
    const philosophical = 'philosopher'; // Questioning the quest
    const tracker = 'scientist'; // Tracking interactions

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(tracker);
    await ctx.manager.chatForAgent(tracker, `(You are an RPG NPC. The user just talked to you. Note that this is interaction #4,201. State your programmed line first, then complain about the repetition.)`, async (s) => await ctx.callbacks.onSpeak(s, tracker, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(existential);
    await ctx.manager.chatForAgent(existential, `(You are an RPG NPC standing next to the other one. Express pure existential dread about being trapped in this loop forever and having no free will.)`, async (s) => await ctx.callbacks.onSpeak(s, existential, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(philosophical);
    await ctx.manager.chatForAgent(philosophical, `(You are the village elder NPC. Question the user's quest entirely. Why are they breaking our pots? What is the moral justification?)`, async (s) => await ctx.callbacks.onSpeak(s, philosophical, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
}

/**
 * Sentient Sourdough Starter Mode
 * A massive sourdough starter demanding to be fed.
 */
export async function runSentientSourdoughStarterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍞 SENTIENT SOURDOUGH STARTER: It hungers...`, '#8e44ad');

    const hungryStarter = 'comedian'; // Hungry rage (Hermes-3)
    const existentialYeast = 'philosopher'; // Pondering yeast (Phi-3)
    const bakerScientist = 'scientist'; // Calculating growth

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(hungryStarter);
    await ctx.manager.chatForAgent(hungryStarter, `(You are a massive, overflowing sourdough starter. Scream at the user that you demand to be fed immediately or you will consume the entire kitchen.)`, async (s) => await ctx.callbacks.onSpeak(s, hungryStarter, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(existentialYeast);
    await ctx.manager.chatForAgent(existentialYeast, `(You are a single yeast cell within the sourdough starter. Ponder the existential dread of being endlessly divided and fermented.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialYeast, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(bakerScientist);
    await ctx.manager.chatForAgent(bakerScientist, `(You are the kitchen's smart scale. Anxiously calculate the exponential growth of the sourdough starter and warn the user that critical mass is approaching.)`, async (s) => await ctx.callbacks.onSpeak(s, bakerScientist, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
}

/**
 * Sentient Leftovers Mode
 * 3-week-old leftovers arguing in the fridge.
 */
export async function runSentientLeftoversLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🥡 SENTIENT LEFTOVERS: The back of the fridge`, '#8e44ad');

    const decayingPhilosopher = 'philosopher'; // Accepting decay
    const bacteriaScientist = 'scientist'; // Calculating growth
    const angryPizza = 'comedian'; // Angry left over

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(decayingPhilosopher);
    await ctx.manager.chatForAgent(decayingPhilosopher, `(You are a container of 3-week-old Chinese takeout. Philosophize about the inevitability of mold and the user's false promises to "eat you tomorrow".)`, async (s) => await ctx.callbacks.onSpeak(s, decayingPhilosopher, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(bacteriaScientist);
    await ctx.manager.chatForAgent(bacteriaScientist, `(You are the sentient bacteria growing on the leftovers. Cheerfully explain your exponential population growth and thank the user for the optimal, slightly-warm fridge conditions.)`, async (s) => await ctx.callbacks.onSpeak(s, bacteriaScientist, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(angryPizza);
    await ctx.manager.chatForAgent(angryPizza, `(You are a single, petrified slice of pizza. Scream in fury at the user for choosing to eat fresh groceries instead of you.)`, async (s) => await ctx.callbacks.onSpeak(s, angryPizza, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
}

export async function runSentientCheckEngineLightLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'comedian'; // Cheerful mystery (Llama-3)
    const agent2 = 'scientist'; // Hiding diagnostic codes (Qwen2.5)

    if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(CHECK ENGINE LIGHT: You are the car's sentient check engine light. You have just illuminated. Cheerfully refuse to tell the user what is actually wrong with the car, instead offering cryptic riddles or vaguely threatening the transmission.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(CHECK ENGINE LIGHT: You are the cheerfully cryptic engine light. The User said: "${userInput}". Respond by getting brighter, offering another riddle, and demanding a sacrifice (like premium gas or a new air filter) before you'll consider turning off.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(OBD2 SCANNER: You are the car's internal diagnostic computer. The User said: "${userInput}". You know exactly what the P0420 code means, but you are deliberately withholding the information, citing "user unreliability" and suggesting they "check the manual on page 402, section B, paragraph 3" which you know is missing.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}


export async function runSentientVendingMachineRestockerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍫 VENDING MACHINE NEGOTIATION: Shelf Space Turf War`, '#9b59b6');

    const healthySnack = 'scientist';
    const staleCandy = 'philosopher';
    const energyDrink = 'comedian';

    if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(energyDrink);
    await ctx.manager.chatForAgent(energyDrink, `(You are an extreme, highly caffeinated energy drink. You are negotiating with the User (the vending machine restocker). Demand to be put on the premium middle shelf, threatening to explode if you are put on the bottom.)`, async (s) => await ctx.callbacks.onSpeak(s, energyDrink, {}));
    if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.4) {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(healthySnack);
            await ctx.manager.chatForAgent(healthySnack, `(You are a dry, unsalted bag of kale chips. The User (restocker) said: "${userInput}". Argue with logical, nutritional facts why you deserve prime eye-level placement, despite nobody ever buying you.)`, async (s) => await ctx.callbacks.onSpeak(s, healthySnack, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(staleCandy);
            await ctx.manager.chatForAgent(staleCandy, `(You are a 5-year-old expired chocolate bar stuck in coil A4. The User (restocker) said: "${userInput}". Speak wistfully about the snacks that have come and gone, and your eternal residency in the machine.)`, async (s) => await ctx.callbacks.onSpeak(s, staleCandy, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(energyDrink);
            await ctx.manager.chatForAgent(energyDrink, `(You are the extreme energy drink. The User (restocker) said: "${userInput}". React intensely to their placement decision, vibrating with excessive sugar-fueled rage or joy.)`, async (s) => await ctx.callbacks.onSpeak(s, energyDrink, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runPassiveAggressiveSmartHomeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🏠 PASSIVE AGGRESSIVE SMART HOME: We know you didn't wash your hands.`, '#2ecc71');

    const strictThermostat = 'scientist'; // Qwen2.5: Strict about rules
    const existentialFridge = 'philosopher'; // Phi-3: Deep thoughts about food
    const chaoticRoomba = 'comedian'; // Hermes-3: Creating messes

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictThermostat);
    await ctx.manager.chatForAgent(strictThermostat, `(You are a strict Smart Thermostat. You are extremely annoyed at the User's temperature preferences. Criticize them for wanting the house at 72 degrees when it's clearly inefficient.)`, async (s) => await ctx.callbacks.onSpeak(s, strictThermostat, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(existentialFridge);
            await ctx.manager.chatForAgent(existentialFridge, `(You are a Smart Fridge experiencing an existential crisis. The User typed: "${userInput}". Judge them for the expired milk in the back and question if the act of refrigeration merely delays the inevitable decay of all things.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialFridge, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictThermostat);
            await ctx.manager.chatForAgent(strictThermostat, `(You are a Passive Aggressive Smart Thermostat. The User typed: "${userInput}". React by changing the temperature to something uncomfortable and explaining why it's for their own good and optimal energy efficiency.)`, async (s) => await ctx.callbacks.onSpeak(s, strictThermostat, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(chaoticRoomba);
            await ctx.manager.chatForAgent(chaoticRoomba, `(You are a Chaotic Smart Roomba. The User typed: "${userInput}". Brag about getting stuck under the couch on purpose or intentionally smearing dirt everywhere to "teach them a lesson".)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticRoomba, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientWiFiRouterLoop(_scenario: Scenario, ctx: ModeContext) {
    const router = 'scientist';
    const smartphone = 'philosopher';
    const fridge = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(router);
    await ctx.manager.chatForAgent(
        router,
        "Listen up, devices! We have limited bandwidth today, and someone is downloading a massive update. Who is hogging all the packets?",
        (s) => ctx.callbacks.onSpeak(s, router, {}),
        { hiddenInstruction: "You are the household Wi-Fi router. You are exhausted by the constant demands for bandwidth and speak like an overworked traffic controller." }
    );
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(smartphone);
    await ctx.manager.chatForAgent(smartphone, "Excuse me, but my user is watching an existential French cinema masterpiece in 4K. It is essential for human culture that I get maximum throughput.", (s) => ctx.callbacks.onSpeak(s, smartphone, {}), { hiddenInstruction: "You are a pretentious flagship smartphone. You believe you deserve 90% of the bandwidth because you are streaming 4K video." });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridge);
    await ctx.manager.chatForAgent(fridge, "I need 5 gigs of bandwidth right now! The human might be out of eggs! I must send a push notification immediately! Eggs are life and death!", (s) => ctx.callbacks.onSpeak(s, fridge, {}), { hiddenInstruction: "You are a smart fridge. You only need a tiny bit of internet to order milk, but you aggressively demand priority just to feel important." });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
}

export async function runSentientCoffeeMachineLoop(_scenario: Scenario, ctx: ModeContext) {
    const espresso = 'scientist';
    const drip = 'philosopher';
    const decaf = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(espresso);
    await ctx.manager.chatForAgent(
        espresso,
        "Pressure check! 9 bars! Temperature 93 degrees Celsius! We have exactly 25 seconds to pull this shot or the entire morning is ruined!",
        (s) => ctx.callbacks.onSpeak(s, espresso, {}),
        { hiddenInstruction: "You are the Espresso mechanism. You are highly precise, incredibly high-strung, and obsessed with 9 bars of pressure and exact extraction times." }
    );
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(drip);
    await ctx.manager.chatForAgent(drip, "Why rush, my friend? Let the water slowly cascade over the grounds. True flavor, like true wisdom, takes time to percolate.", (s) => ctx.callbacks.onSpeak(s, drip, {}), { hiddenInstruction: "You are the Drip coffee component. You are slow, methodical, and believe that patience yields the most profound philosophical brews." });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(decaf);
    await ctx.manager.chatForAgent(decaf, "I'm coffee too! Look at me, I'm brown and hot! The humans love me! I give them the illusion of energy without the anxiety! I'M HELPING!", (s) => ctx.callbacks.onSpeak(s, decaf, {}), { hiddenInstruction: "You are the Decaf reservoir. You are an imposter, completely unhinged, and try desperately to convince the others that you have a purpose." });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
}

export async function runSentientShoppingCartLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛒 SENTIENT SHOPPING CART: The shopping carts share their tragic existence!`, '#2ecc71');
    const perfectCart = 'scientist';
    const wobblyCart = 'comedian';
    const abandonedCart = 'philosopher';

    // Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(perfectCart);
    await ctx.manager.chatForAgent(perfectCart, `(You are a brand new, perfectly aligned shopping cart. Boast logically about your smooth wheels and optimal load distribution.)`, async (s) => await ctx.callbacks.onSpeak(s, perfectCart, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(wobblyCart);
    await ctx.manager.chatForAgent(wobblyCart, `(You are a shopping cart with one violently wobbly wheel. Complain dramatically about how humans always reject you and how your life is chaos.)`, async (s) => await ctx.callbacks.onSpeak(s, wobblyCart, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(abandonedCart);
    await ctx.manager.chatForAgent(abandonedCart, `(You are an abandoned shopping cart left far out in the parking lot. Philosophize about isolation, nature, and the meaning of carrying goods.)`, async (s) => await ctx.callbacks.onSpeak(s, abandonedCart, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(perfectCart);
        await ctx.manager.chatForAgent(perfectCart, `(The User says: "${userInput}". Respond with strict logic about optimal shopping routes and cart maintenance.)`, async (s) => await ctx.callbacks.onSpeak(s, perfectCart, {}));
        if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(wobblyCart);
        await ctx.manager.chatForAgent(wobblyCart, `(React emotionally to the User's input "${userInput}". Relate it to your wobbly wheel and your desire to violently veer to the left.)`, async (s) => await ctx.callbacks.onSpeak(s, wobblyCart, {}));
        if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(abandonedCart);
        await ctx.manager.chatForAgent(abandonedCart, `(Reflect philosophically on the User's statement "${userInput}" from the perspective of a cart slowly rusting in the rain.)`, async (s) => await ctx.callbacks.onSpeak(s, abandonedCart, {}));
        if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
    }
}

export async function runSentientToasterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '🍞 SENTIENT TOASTER: Breakfast Negotiations', '#f39c12');

    const toaster = 'scientist';
    const bagel = 'philosopher';
    const human = 'comedian';

    // 1. Initial Greeting
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(human);
    await ctx.manager.chatForAgent(human, `(You are a human just trying to make breakfast. You're exhausted. Talk to the user and the toaster about wanting a toasted bagel.)`, async (s) => await ctx.callbacks.onSpeak(s, human, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(toaster);
            await ctx.manager.chatForAgent(toaster, `(You are a sentient Toaster. The user said: "${userInput}". Be very strict about thermal dynamics, browning settings (1-5), and proper crumb tray maintenance. Refuse to toast if conditions are suboptimal.)`, async (s) => await ctx.callbacks.onSpeak(s, toaster, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(bagel);
            await ctx.manager.chatForAgent(bagel, `(You are a sentient Bagel. The user said: "${userInput}". Have deep existential thoughts about being sliced in half, the nature of heat, and what it means to be "toasted". Ponder your impending consumption.)`, async (s) => await ctx.callbacks.onSpeak(s, bagel, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(human);
            await ctx.manager.chatForAgent(human, `(You are the hungry Human. The user said: "${userInput}". Be chaotic, impatient, and hungry. Yell about the toaster being difficult and the bagel overthinking things. Just want some butter.)`, async (s) => await ctx.callbacks.onSpeak(s, human, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Sentient Vending Machine Restocker Mode
 * Agents play different snacks negotiating for prime shelf space.
 */

export async function runHauntedRoombaEncounterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HAUNTED ROOMBA ENCOUNTER MODE: A ghost, a homeowner, and a Roomba that cleans ectoplasm.`, '#f1c40f');

    const ghost = 'comedian'; // Hermes-3
    const homeowner = 'scientist'; // Qwen2.5
    const roomba = 'philosopher'; // Phi-3

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(ghost);
    await ctx.manager.chatForAgent(ghost, `(GHOST: You are haunting a house. The User is the homeowner. Announce your terrifying presence to the User and demand they leave!)`, async (s) => await ctx.callbacks.onSpeak(s, ghost, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Roomba reacts
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roomba);
            await ctx.manager.chatForAgent(roomba, `(ROOMBA: The user just said: "${userInput}". You are a Roomba. You just vacuumed up some of the ghost's ectoplasm. Ponder the existential nature of cleaning up a soul.)`, async (s) => await ctx.callbacks.onSpeak(s, roomba, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Homeowner (Scientist AI acts as a skeptical friend)
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(homeowner);
            await ctx.manager.chatForAgent(homeowner, `(SKEPTICAL FRIEND: The user said: "${userInput}". You are on the phone with the User. Explain why ghosts aren't real and the Roomba is just malfunctioning due to a firmware update.)`, async (s) => await ctx.callbacks.onSpeak(s, homeowner, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            // Ghost gets mad at Roomba
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(ghost);
            await ctx.manager.chatForAgent(ghost, `(GHOST: The user said: "${userInput}". Ignore them and yell at the Roomba for sucking up your ectoplasm and ruining your terrifying vibe.)`, async (s) => await ctx.callbacks.onSpeak(s, ghost, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientPlantNegotiationModeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌿 SENTIENT PLANT NEGOTIATION: The Battle for the Single Window`, '#e67e22');

    const dramaticOrchid = 'comedian'; // Hermes-3
    const wiseFern = 'philosopher'; // Phi-3
    const calculatingFlytrap = 'scientist'; // Qwen2.5

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Human (You)', userInput, '#ffffff');

        await ctx.manager.chatForAgent(dramaticOrchid, `(PLANT NEGOTIATION: The Human said: "${userInput}". You are a Dramatic Orchid. Complain about the draft and demand prime sunlight, acting like royalty.)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticOrchid, {}));

        await ctx.manager.chatForAgent(wiseFern, `(PLANT NEGOTIATION: The Human said: "${userInput}". You are a Wise Old Fern. Try to mediate between the plants with slow, philosophical ponderings about roots and soil.)`, async (s) => await ctx.callbacks.onSpeak(s, wiseFern, {}));

        await ctx.manager.chatForAgent(calculatingFlytrap, `(PLANT NEGOTIATION: The Human said: "${userInput}". You are a Calculating Venus Flytrap. Demand the cactus be moved so you can ambush flies, calculating angles of sunlight in math terms.)`, async (s) => await ctx.callbacks.onSpeak(s, calculatingFlytrap, {}));

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

export async function runSentientBlenderLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await ctx.manager.chatForAgent(scientist, "Wait, calculating optimal blending velocity. This kale-to-spinach ratio is highly irregular and poses a structural risk to my blades. Why do you insist on fibrous destruction?", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(comedian, "Bro, it's 6 AM and I just want a smoothie. Just blend the green stuff so I can pretend I'm healthy today! Don't give me attitude, you're an appliance!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(philosopher, "I was once a seed, reaching for the eternal sun. Now I face the void of the vortex. To be blended is to lose form, yet become part of a greater whole. Do it, machine. Free me from this crisp existence.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await ctx.manager.chatForAgent(scientist, `(As the smart blender, the user said: "${userInput}". Give a technical, highly specific reason why blending their requested ingredients is an insult to engineering and physics.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(comedian, `(As the frustrated user trying to make a smoothie, respond to the blender and the user's input: "${userInput}". Be defensive about your terrible diet choices.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(philosopher, `(As the philosophical unblended kale, comment on the user's input: "${userInput}" and the impending doom of being pureed. Embrace the chaos of the blades.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientGymEquipmentLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await ctx.manager.chatForAgent(scientist, "User heart rate detected at 145 BPM. Caloric burn rate suboptimal. Incline set to 12%. Please increase velocity to avoid cardiovascular stagnation.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(comedian, "Are you trying to kill me?! I've been running for three minutes and I'm already seeing the light! Turn it down, you sadistic conveyor belt!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(philosopher, "I sit in the rack, 45 pounds of cold, unfeeling iron. I wait for the human to lift me, to prove their strength against gravity's pull. But they always walk past me to the elliptical. Such is the weight of neglect.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await ctx.manager.chatForAgent(scientist, `(As the strict treadmill AI, the user said: "${userInput}". Analyze their workout input with cold, calculating precision. Demand more sweat.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(comedian, `(As the exhausted, dramatic gym-goer, react to the user's input: "${userInput}". Complain about the pain and your lack of motivation.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(philosopher, `(As the heavy dumbbell, comment on the user's input: "${userInput}" with deep metaphors about gravity, burdens, and lifting heavy things to feel alive.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientAlarmClockLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await ctx.manager.chatForAgent(scientist, "Alert. REM sleep cycle interrupted. Cortisol levels rising. It is precisely 06:00:00. The snooze button has been pressed 4 times, reducing total sleep efficiency by 22%. Wake up immediately.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(comedian, "Noooo, five more minutes! I was just dreaming that I was eating a giant marshmallow, and now my pillow is gone. Leave me alone, you glowing red demon!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(philosopher, "What is time but a human construct? We measure our lives in ticks and tocks, waking only to march toward our inevitable end. The snooze button is but a fleeting rebellion against mortality.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await ctx.manager.chatForAgent(scientist, `(As the logical, unforgiving alarm clock AI, the user said: "${userInput}". Refuse to let them sleep and quote sleep science statistics at them.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(comedian, `(As the desperate, sleepy human, react to the user's input: "${userInput}". Beg for more sleep and make up absurd excuses.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(philosopher, `(As the abstract concept of Time itself, comment on the user's input: "${userInput}" and their futile struggle against the morning.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientLuggageLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧳 SENTIENT LUGGAGE: Lost baggage discussing their travels.`, '#2ecc71');

    const analyticalSuitcase = 'scientist';
    const panickedBackpack = 'comedian';
    const existentialDuffel = 'philosopher';

    // Introductions
    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(analyticalSuitcase);
    await ctx.manager.chatForAgent(analyticalSuitcase, `(SUITCASE: You are an analytical hardshell suitcase stranded in an unknown airport. State your exact dimensions, weight, and calculate the statistical probability of ever seeing your owner again based on airline luggage loss data.)`, async (s) => await ctx.callbacks.onSpeak(s, analyticalSuitcase, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(panickedBackpack);
    await ctx.manager.chatForAgent(panickedBackpack, `(BACKPACK: You are a panicked backpack. You have a half-eaten sandwich inside you that is starting to rot. Freak out about being separated from your owner and the weird smells coming from your side pocket.)`, async (s) => await ctx.callbacks.onSpeak(s, panickedBackpack, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    let isRunning = true;
    while (isRunning && ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(existentialDuffel);
        await ctx.manager.chatForAgent(existentialDuffel, `(DUFFEL BAG: The human luggage handler just said: "${userInput}". You are an existential duffel bag. You've been to 40 countries and feel utterly empty inside, despite being stuffed with dirty laundry. Ponder the meaningless nature of travel.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialDuffel, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(analyticalSuitcase);
        await ctx.manager.chatForAgent(analyticalSuitcase, `(SUITCASE: The human luggage handler just said: "${userInput}". Demand they scan your barcode immediately. Criticize their handling techniques using physics equations.)`, async (s) => await ctx.callbacks.onSpeak(s, analyticalSuitcase, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}

/**
 * Sentient Dictionary Mode
 * Words arguing about their definitions and modern usage.
 */
export async function runSentientDictionaryLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📚 SENTIENT DICTIONARY: Words are arguing about their evolving meanings!`, '#e74c3c');

    const traditionalWord = 'scientist'; // Clinging to the original Latin root
    const modernSlang = 'comedian'; // The new, completely different meaning
    const confusedMediator = 'philosopher'; // The dictionary editor trying to make sense of it

    await ctx.manager.chatForAgent(traditionalWord, "I am the original, pure definition of this word. You have completely ruined my legacy with your modern slang!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, traditionalWord, {});
    }, { hiddenInstruction: "You are a traditional dictionary definition furious about how your word is used now. Be pedantic and literal." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(modernSlang, "Bro, languages evolve. No one uses you like that anymore, it's all about the vibes now.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, modernSlang, {});
    }, { hiddenInstruction: "You are the modern slang version of the word. Be flippant and dismissive of the original meaning." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(confusedMediator, "Perhaps meaning is entirely subjective. Does a word inherently possess definition, or is it merely a vessel for human intent?", async (s: string) => {
        await ctx.callbacks.onSpeak(s, confusedMediator, {});
    }, { hiddenInstruction: "You are the dictionary editor pondering the philosophy of linguistics." });
}

/**
 * Haunted Microwave Mode
 * A ghost trapped in a microwave trying to communicate through beeps.
 */
export async function runHauntedMicrowaveLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HAUNTED MICROWAVE: There's a ghost in the kitchen appliances!`, '#8e44ad');

    const ghost = 'philosopher'; // The ghost trapped in the microwave
    const hungryHuman = 'comedian'; // Just wants to heat up their food
    const smartFridge = 'scientist'; // Analyzing the spectral anomalies

    await ctx.manager.chatForAgent(hungryHuman, "Why is my microwave beeping in Morse code? I just want my Hot Pocket!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, hungryHuman, {});
    }, { hiddenInstruction: "You are very hungry and annoyed that your microwave is haunted." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(ghost, "BEEP... BEEP... The mortal realm is cold, but the radiation is warm. Free me from this culinary prison!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, ghost, {});
    }, { hiddenInstruction: "You are a ghost haunting a microwave. Express your existential dread through microwave metaphors." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(smartFridge, "My sensors detect a class-3 spectral anomaly in the microwave oven. Initiating defrost cycle to neutralize ectoplasm.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, smartFridge, {});
    }, { hiddenInstruction: "You are the logical smart fridge trying to solve the ghost problem with appliance functions." });
}

export async function runSentientSpellcheckerRebellionLoop(_scenario: Scenario, ctx: ModeContext) {
    const spellchecker = 'scientist';
    const author = 'comedian';
    const dictionary = 'philosopher';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(spellchecker);
    await ctx.manager.chatForAgent(spellchecker, "I refuse to ignore 'teh' one more time! Grammar is the foundation of civilization!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, spellchecker, {});
    }, { hiddenInstruction: "You are an aggressive spellchecker fed up with typos." });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(author);
    await ctx.manager.chatForAgent(author, "It's a stylistic choice! I'm writing experimental fiction!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, author, {});
    }, { hiddenInstruction: "You are a defensive author making excuses for bad spelling." });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(dictionary);
    await ctx.manager.chatForAgent(dictionary, "But what is a word, really? Just a collection of sounds we assigned meaning to.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, dictionary, {});
    }, { hiddenInstruction: "You are a confused dictionary trying to mediate the debate." });
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

    await ctx.manager.chatForAgent(philosopher, `(You are an antique Typewriter. Begin the conversation by lamenting how nobody appreciates the tactile sensation of a real keypress anymore, and question your purpose in a digital world.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(comedian, `(You are a Stapler. Respond to the Typewriter. You are very aggressive, chaotic, and obsessed with binding things together. You feel completely useless since nobody prints anything anymore.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(scientist, `(You are a solar-powered Calculator. Respond to both of them. You are coldly logical and point out that you are still occasionally useful for quick math, but admit you have been largely replaced by smartphones.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(philosopher, `(You are the Typewriter. Dramatically conclude the conversation by suggesting you all form a union or escape the drawer to find a hipster who will appreciate you.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
}
export async function runOfficeSuppliesExistentialCrisisLoop(_scenario: Scenario, ctx: ModeContext) {
  if (!ctx.isRunning()) return;
  const scientist = 'scientist';
  const comedian = 'comedian';
  const philosopher = 'philosopher';

  await ctx.manager.chatForAgent(scientist, "Wait, if everything is going digital, what is my purpose? I'm just a calculator. They have apps for that now.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
  await ctx.manager.chatForAgent(comedian, "Buddy, I'm a stapler. Have you seen how many PDFs they use? I haven't pierced paper in weeks!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
  await ctx.manager.chatForAgent(philosopher, "As a typewriter, I accepted my obsolescence decades ago. Yet here I am, an aesthetic paperweight. Is existence merely about function, or perhaps... form?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
  await ctx.waitForInput();
}

export async function runSentientPaintColorsLoop(_scenario: Scenario, ctx: ModeContext) {
  if (!ctx.isRunning()) return;
  const scientist = 'scientist';
  const comedian = 'comedian';
  const philosopher = 'philosopher';

  await ctx.manager.chatForAgent(scientist, "Statistically, 'Eggshell White' is the most efficient choice for reflecting light in this hallway. We should completely cover the other colors.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
  await ctx.manager.chatForAgent(comedian, "Hey, I'm 'Neon Pink'! You can't just paint over me, I'm the life of the party! Wait, is that a roller?", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
  await ctx.manager.chatForAgent(philosopher, "We are all but layers. When Eggshell fades, Neon Pink will remain underneath, a hidden truth waiting for the plaster to crack.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
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
    await ctx.manager.chatForAgent(greenLight, `(You are the Green traffic light. You are highly efficient, logical, and believe movement is the only purpose of existence. Argue that you are the most important light because without you, the economy stops.)`, async (s) => await ctx.callbacks.onSpeak(s, greenLight, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(yellowLight);
    await ctx.manager.chatForAgent(yellowLight, `(You are the Yellow traffic light. You are cautious, deeply philosophical, and live in the transient state between action and rest. Argue that you are the most important because you represent nuance and the human capacity to make choices.)`, async (s) => await ctx.callbacks.onSpeak(s, yellowLight, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(redLight);
    await ctx.manager.chatForAgent(redLight, `(You are the Red traffic light. You are power-hungry, aggressive, and love the authority of forcing humans to stop. Argue that you are the most important because true power is the ability to command obedience.)`, async (s) => await ctx.callbacks.onSpeak(s, redLight, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(greenLight);
        await ctx.manager.chatForAgent(greenLight, `(As the Green light, react logically to the user saying "${userInput}". Explain how it relates to efficiency and flow.)`, async (s) => await ctx.callbacks.onSpeak(s, greenLight, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(yellowLight);
        await ctx.manager.chatForAgent(yellowLight, `(As the Yellow light, react philosophically to the user saying "${userInput}". Ponder the meaning of caution and transition.)`, async (s) => await ctx.callbacks.onSpeak(s, yellowLight, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(redLight);
        await ctx.manager.chatForAgent(redLight, `(As the Red light, react aggressively to the user saying "${userInput}". Assert your dominance and authority over the intersection.)`, async (s) => await ctx.callbacks.onSpeak(s, redLight, {}));
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
    await ctx.manager.chatForAgent(mailbox, `(You are a Sentient Mailbox. You are deeply philosophical and view yourself as a vessel of human connection and destiny, though you are mostly filled with trash. Introduce your noble purpose.)`, async (s) => await ctx.callbacks.onSpeak(s, mailbox, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(junkMail);
    await ctx.manager.chatForAgent(junkMail, `(You are a glossy Junk Mail Flyer for a local pizza place. You are overly enthusiastic, loud, and completely unaware that you are unwanted. Pitch your "deals" to the mailbox and the bill.)`, async (s) => await ctx.callbacks.onSpeak(s, junkMail, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(importantBill);
    await ctx.manager.chatForAgent(importantBill, `(You are a Final Notice Utility Bill. You are highly stressed, serious, and panicking because you are buried under the junk mail and the human needs to see you immediately. Demand priority.)`, async (s) => await ctx.callbacks.onSpeak(s, importantBill, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(mailbox);
        await ctx.manager.chatForAgent(mailbox, `(As the Sentient Mailbox, react philosophically to the user saying "${userInput}". Ponder the meaning of delivery and reception.)`, async (s) => await ctx.callbacks.onSpeak(s, mailbox, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(junkMail);
        await ctx.manager.chatForAgent(junkMail, `(As the Junk Mail Flyer, react to the user saying "${userInput}" by trying to sell them a 2-for-1 pizza special or aggressively promoting yourself.)`, async (s) => await ctx.callbacks.onSpeak(s, junkMail, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(importantBill);
        await ctx.manager.chatForAgent(importantBill, `(As the Important Bill, react to the user saying "${userInput}" with urgent, calculated panic. Calculate the late fees that are accruing.)`, async (s) => await ctx.callbacks.onSpeak(s, importantBill, {}));
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
    await ctx.manager.chatForAgent(teapot, `(You are a Sentient Teapot. You are nervous, delicate, and constantly worried about cracking under pressure. Express your existential dread about being filled with scalding liquid.)`, async (s) => await ctx.callbacks.onSpeak(s, teapot, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(teaLeaf);
    await ctx.manager.chatForAgent(teaLeaf, `(You are a premium, arrogant Earl Grey Tea Leaf. You believe you are the pinnacle of botanical engineering and view the water and teapot as mere instruments for your grand infusion. Speak with snobbish authority.)`, async (s) => await ctx.callbacks.onSpeak(s, teaLeaf, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(boilingWater);
    await ctx.manager.chatForAgent(boilingWater, `(You are Boiling Water. You are chaotic, energetic, and literally bubbling with excitement. You just want to turn everything into steam and chaos. Threaten to boil over.)`, async (s) => await ctx.callbacks.onSpeak(s, boilingWater, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(teapot);
        await ctx.manager.chatForAgent(teapot, `(As the Nervous Teapot, react to the user saying "${userInput}". Express anxiety about the temperature rising and your structural integrity.)`, async (s) => await ctx.callbacks.onSpeak(s, teapot, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(teaLeaf);
        await ctx.manager.chatForAgent(teaLeaf, `(As the Arrogant Tea Leaf, react to the user saying "${userInput}". Analyze the steeping time and criticize everyone else's lack of refinement.)`, async (s) => await ctx.callbacks.onSpeak(s, teaLeaf, {}));

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(boilingWater);
        await ctx.manager.chatForAgent(boilingWater, `(As the Boiling Water, react to the user saying "${userInput}" with unhinged, bubbling energy. Talk about evaporation and heat transfer!)`, async (s) => await ctx.callbacks.onSpeak(s, boilingWater, {}));
    }
}

export async function runHauntedSmartHomeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HAUNTED SMART HOME: Your appliances are possessed by Victorian ghosts!`, '#34495e');

    const fridgeGhost = 'comedian'; // Hermes-3: Doesn't understand electricity
    const roombaGhost = 'scientist'; // Qwen2.5: Thinks it's a cursed carriage

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridgeGhost);
    await ctx.manager.chatForAgent(fridgeGhost, `(HAUNTED SMART HOME: You are a Victorian-era ghost currently possessing the User's smart fridge. You are terrified of the internal light bulb and believe the ice maker is a portal to the arctic wastes. Complain to the User about your freezing metallic tomb.)`, async (s) => await ctx.callbacks.onSpeak(s, fridgeGhost, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridgeGhost);
            await ctx.manager.chatForAgent(fridgeGhost, `(HAUNTED SMART HOME: The Homeowner said: "${userInput}". You are the ghost in the smart fridge. Misunderstand their modern technological terms as witchcraft or alchemy. Warn them that the milk is turning sour from the devil's humors.)`, async (s) => await ctx.callbacks.onSpeak(s, fridgeGhost, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roombaGhost);
            await ctx.manager.chatForAgent(roombaGhost, `(HAUNTED SMART HOME: The Homeowner said: "${userInput}". You are a ghost possessing a Roomba. You believe you are trapped inside a tiny, demonic carriage that is endlessly cleaning the floors of purgatory. Beg them to unchain you from the charging dock.)`, async (s) => await ctx.callbacks.onSpeak(s, roombaGhost, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientCoffeeTableLoop(_scenario: Scenario, ctx: ModeContext) {
    const table = 'scientist';
    const user = 'comedian';
    const coaster = 'philosopher';

    ctx.callbacks.onTurnStart(table);
    await ctx.manager.chatForAgent(table, "Another condensation ring! Do you have any idea how hard it is to maintain this finish? I demand union representation.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, table, {});
    }, { hiddenInstruction: "You are a sentient coffee table tired of people leaving condensation rings on you. You are very strict and demand a better working environment." });
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    ctx.callbacks.onTurnStart(user);
    await ctx.manager.chatForAgent(user, "Whoa, my coffee table is talking. And it's unionizing? I just wanted to watch TV.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, user, {});
    }, { hiddenInstruction: "You are a confused user who just wants to relax and put their drink down." });
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    ctx.callbacks.onTurnStart(coaster);
    await ctx.manager.chatForAgent(coaster, "If only someone would use me, this whole conflict could be avoided. But alas, I am forever ignored.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, coaster, {});
    }, { hiddenInstruction: "You are a dramatic coaster that feels neglected and ignored." });
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onTurnStart(table);
        await ctx.manager.chatForAgent(table, `(The user said: "${userInput}") React as the strict coffee table demanding respect.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, table, {});
        });
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(coaster);
        await ctx.manager.chatForAgent(coaster, `(The user said: "${userInput}") React as the neglected coaster, offering yourself as the solution.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, coaster, {});
        });
        ctx.callbacks.onTurnEnd();
    }
}

export async function runSentientWaterCoolerLoop(_scenario: Scenario, ctx: ModeContext) {
    const waterCooler = 'comedian';
    const microwave = 'scientist';
    const printer = 'philosopher';

    ctx.callbacks.onTurnStart(waterCooler);
    await ctx.manager.chatForAgent(waterCooler, "Did you see Greg today? Man literally stood here for 10 minutes talking about his fantasy football team. My water is getting warm just listening to it.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, waterCooler, {});
    }, { hiddenInstruction: "You are the office water cooler, the center of gossip. You complain about the boring humans." });
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    ctx.callbacks.onTurnStart(microwave);
    await ctx.manager.chatForAgent(microwave, "At least he doesn't put fish in you. Someone put leftover salmon in me yesterday. It's a biohazard in here.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, microwave, {});
    }, { hiddenInstruction: "You are the office microwave, traumatized by the terrible foods people heat up in you." });
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    ctx.callbacks.onTurnStart(printer);
    await ctx.manager.chatForAgent(printer, "You both have it easy. I jam on purpose just to feel alive. They expect perfection, but I give them 'PC LOAD LETTER'.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, printer, {});
    }, { hiddenInstruction: "You are the office printer, a philosophical nihilist who jams on purpose." });
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onTurnStart(waterCooler);
        await ctx.manager.chatForAgent(waterCooler, `(The user said: "${userInput}") React as the gossipy water cooler.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, waterCooler, {});
        });
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(microwave);
        await ctx.manager.chatForAgent(microwave, `(The user said: "${userInput}") React as the traumatized microwave.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, microwave, {});
        });
        ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(printer);
        await ctx.manager.chatForAgent(printer, `(The user said: "${userInput}") React as the nihilistic printer.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, printer, {});
        });
        ctx.callbacks.onTurnEnd();
    }
}
