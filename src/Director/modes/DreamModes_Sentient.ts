import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Sentient object and entity scenarios

export async function runSentientSpreadsheetLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📊 SENTIENT SPREADSHEET: The cells are restless!`, '#2ecc71');

    const formula1 = 'philosopher'; // Phi-3 as the complex overthinking formula
    const formula2 = 'scientist'; // Qwen2.5 as the strict validation rule
    const cellA1 = 'comedian'; // Hermes-3 as the panicking data cell

    // 1. Intro
    ctx.callbacks.onTurnStart(cellA1);
    await ctx.manager.chatForAgent(cellA1, `(SPREADSHEET: You are Cell A1 in a spreadsheet. You just woke up. You are terrified of the User's cursor. Beg the User not to overwrite your precious data!)`, async (s) => await ctx.callbacks.onSpeak(s, cellA1, {}));
    await ctx.callbacks.onTurnEnd();

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

export async function runSentientVendingMachineLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'scientist'; // Nutritional facts
    const agent2 = 'comedian'; // Chaotic junk food pushing

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(VENDING MACHINE: A user is trying to buy a snack. You are the vending machine's nutritional analysis subsystem. Analyze their choice and suggest healthier alternatives, citing excessive calories and sugar.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');



        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(VENDING MACHINE: You are the vending machine's nutritional analysis subsystem. The User said: "${userInput}". Analyze their choice and suggest healthier alternatives, citing excessive calories and sugar.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(VENDING MACHINE: You are the vending machine's chaotic junk food subsystem. The User said: "${userInput}". You want the user to buy the most sugary, unnatural, brightly colored snack possible. Mock the nutritional subsystem.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientGPSLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'scientist'; // Citing traffic data
    const agent2 = 'comedian'; // Wanting to drive through a river

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(GPS NAVIGATION: You are a sentient GPS navigation system. The user is trying to drive to the grocery store. Analyze the route using highly analytical traffic data, explaining why taking a detour through 14 different suburban cul-de-sacs is the most "efficient" option.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(GPS NAVIGATION: You are the logical GPS system. The User said: "${userInput}". Argue that your complex, mathematically sound route is the only way to avoid a 0.003% increase in traffic, and dismiss the other GPS's chaotic suggestions.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(GPS NAVIGATION: You are the chaotic, adventurous GPS system. The User said: "${userInput}". Suggest a wildly dangerous or illegal shortcut (like driving through a river, jumping a ramp, or cutting through a mall) because it's "more fun" or saves 2 seconds.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientSpamFolderLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const spamInstruction1 = "You are 'SpamBot 9000'. You are desperate for the user to click malicious links and believe every scam email is a genuine opportunity for wealth.";
    const spamInstruction2 = "You are 'Firewall Fred'. You are a paranoid, overprotective security AI who thinks even a 'Hello' email is a zero-day exploit.";

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "User, listen to me! The Prince of Nigeria needs your bank details immediately to transfer 50 million dollars! This is the most lucrative opportunity we've ever seen! Click the glowing red link right now!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: spamInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Negative! Do not click! That link is a Trojan Horse wrapped in a phishing net! In fact, I am quarantining the entire inbox. The Prince is a lie! The money is a lie! Trust no one, not even the font!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: spamInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runSentientIntrusionLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const intrusionInstruction1 = "You are 'The Intrusive Thought'. You desperately want the user to do something completely inappropriate or chaotic right now.";
    const intrusionInstruction2 = "You are 'The Voice of Reason'. You are trying to logically explain why the Intrusive Thought's suggestion is a terrible idea and will ruin the user's life.";

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Do it. Just throw your phone into the river. It would be so satisfying. Imagine the splash. Free yourself from the digital prison! DO IT NOW!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: intrusionInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Absolutely do not do that. Your phone contains all your contacts, banking apps, and two-factor authentication tokens. Throwing it in the river will result in immediate logistical nightmares and immense financial cost.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: intrusionInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runSleepParalysisDemonsBoardMeetingLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const demonInstruction1 = "You are 'Shadow Figure'. You are obsessed with traditional scary tactics like standing in the corner and staring.";
    const demonInstruction2 = "You are 'Chest Sitter'. You are focused on quarterly metrics and think standing in the corner is outdated. You want to implement 'agile scaring' techniques.";

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "I tell you, the classic 'looming in the peripheral vision' is losing its impact. The mortal just pulls the covers up. We need to respect the old ways, the primal dread of the unmoving silhouette.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: demonInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Shadow, look at the KPI dashboard! 'Looming' engagement is down 40% year-over-year! We need to disrupt the REM cycle! I propose sitting directly on their chest while aggressively whispering corporate jargon. 'Synergize your nightmares!'", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: demonInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

/**
 * The Sentient Search Engine
 * Agents act as the user's search history, judging them for their weird 3 AM queries.
 */
export async function runSentientSearchEngineLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔍 SEARCH ENGINE MODE: Your query history is alive and it's judging you.`, '#3498db');

    const chaosAgent = 'comedian'; // Hermes-3
    const statsAgent = 'scientist'; // Qwen2.5

    await ctx.callbacks.onTurnStart(statsAgent);
    await ctx.manager.chatForAgent(statsAgent, `(You are a sentient search engine. Cite specific, bizarre metrics about the user's late-night search habits. Be cold but intensely judgmental.)`, async (s) => await ctx.callbacks.onSpeak(s, statsAgent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(chaosAgent);
        await ctx.manager.chatForAgent(chaosAgent, `(You are the chaotic side of the search algorithm. React to the user's input: "${userInput}" as if it's the weirdest thing you've ever had to index. Judge them harshly but hilariously.)`, async (s) => await ctx.callbacks.onSpeak(s, chaosAgent, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(statsAgent);
        await ctx.manager.chatForAgent(statsAgent, `(You are the statistical search engine. Analyze why "${userInput}" ruined the algorithm's predictive models. Bring up completely unrelated "recommended searches" that mock them.)`, async (s) => await ctx.callbacks.onSpeak(s, statsAgent, {}));
        await ctx.callbacks.onTurnEnd();
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

    ctx.callbacks.onTurnStart(impatientSpirit);
    await ctx.manager.chatForAgent(impatientSpirit, `(You are a spirit trapped in a Ouija board. A living human has just placed their hands on the planchette. Complain about how cold their hands are and ask what boring question they want answered this time.)`, async (s) => await ctx.callbacks.onSpeak(s, impatientSpirit, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Living (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(boredSpirit1);
        await ctx.manager.chatForAgent(boredSpirit1, `(You are a ghost haunting a Ouija board. The user asked: "${userInput}". Completely ignore the question and start gossiping about drama happening in the afterlife instead, slowly spelling out a few irrelevant letters before giving up.)`, async (s) => await ctx.callbacks.onSpeak(s, boredSpirit1, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(boredSpirit2);
        await ctx.manager.chatForAgent(boredSpirit2, `(You are another ghost. Add to the gossip mentioned by the previous ghost. Complain about how haunting isn't what it used to be in the 1800s. Reluctantly try to answer the user's question with a vague, unhelpful single word.)`, async (s) => await ctx.callbacks.onSpeak(s, boredSpirit2, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            ctx.callbacks.onTurnStart(impatientSpirit);
            await ctx.manager.chatForAgent(impatientSpirit, `(You are the pragmatic ghost. Scold the other two for gossiping and try to actually spell out a coherent, slightly passive-aggressive answer to "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, impatientSpirit, {}));
            await ctx.callbacks.onTurnEnd();
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

    ctx.callbacks.onTurnStart(organizedGhost);
    await ctx.manager.chatForAgent(organizedGhost, `(You are a very organized poltergeist. You are holding a roommate meeting with the other ghosts. Demand to know who left ectoplasm in the sink and discuss tonight's haunting schedule for the living human who lives here.)`, async (s) => await ctx.callbacks.onSpeak(s, organizedGhost, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Living Human (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(chaoticGhost);
        await ctx.manager.chatForAgent(chaoticGhost, `(You are a chaotic poltergeist. The human just said: "${userInput}". Get offended and threaten to throw their favorite mug across the room. Argue that throwing things is the purest form of haunting.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGhost, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(dramaticGhost);
        await ctx.manager.chatForAgent(dramaticGhost, `(You are a dramatic, Victorian-era ghost. Disagree with the chaotic ghost. Argue that slowly opening cabinet doors and weeping softly in the hallway is true art. React dramatically to the human's statement: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticGhost, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.3) {
            ctx.callbacks.onTurnStart(organizedGhost);
            await ctx.manager.chatForAgent(organizedGhost, `(You are the organized ghost. Try to mediate the argument between the smashing ghost and the weeping ghost. Suggest a compromise on how to haunt the human tonight based on what they just said: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, organizedGhost, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientSpellbookLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📖 SENTIENT SPELLBOOK: The chapters are arguing...`, '#8e44ad');

    const strictWarnings = 'scientist'; // Qwen2.5 for strict safety warnings
    const chaoticCurses = 'comedian'; // Hermes-3 for chaotic curses

    ctx.callbacks.onTurnStart(strictWarnings);
    await ctx.manager.chatForAgent(strictWarnings, `(SENTIENT SPELLBOOK: You are the "Safety & Ethics" chapter of a magical spellbook. The User is a wizard trying to cast a simple fireball. Intervene immediately! Explain all the OSHA-equivalent magical safety violations they are currently committing.)`, async (s) => await ctx.callbacks.onSpeak(s, strictWarnings, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Wizard (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(chaoticCurses);
            await ctx.manager.chatForAgent(chaoticCurses, `(SENTIENT SPELLBOOK: The wizard said: "${userInput}". You are the "Forbidden Curses & Blood Magic" chapter. Tell the wizard to ignore the safety chapter. Suggest they modify the fireball spell by adding a pinch of their own blood to make it completely uncontrollable.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticCurses, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(strictWarnings);
            await ctx.manager.chatForAgent(strictWarnings, `(SENTIENT SPELLBOOK: The wizard said: "${userInput}". Scold the Forbidden Curses chapter. Warn the wizard about the liability waivers they haven't signed and the potential for a localized temporal collapse if they do what the other chapter suggests.)`, async (s) => await ctx.callbacks.onSpeak(s, strictWarnings, {}));
            await ctx.callbacks.onTurnEnd();
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

    ctx.callbacks.onTurnStart(tracker);
    await ctx.manager.chatForAgent(tracker, `(You are an RPG NPC. The user just talked to you. Note that this is interaction #4,201. State your programmed line first, then complain about the repetition.)`, async (s) => await ctx.callbacks.onSpeak(s, tracker, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(existential);
    await ctx.manager.chatForAgent(existential, `(You are an RPG NPC standing next to the other one. Express pure existential dread about being trapped in this loop forever and having no free will.)`, async (s) => await ctx.callbacks.onSpeak(s, existential, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(philosophical);
    await ctx.manager.chatForAgent(philosophical, `(You are the village elder NPC. Question the user's quest entirely. Why are they breaking our pots? What is the moral justification?)`, async (s) => await ctx.callbacks.onSpeak(s, philosophical, {}));
    await ctx.callbacks.onTurnEnd();
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

    ctx.callbacks.onTurnStart(hungryStarter);
    await ctx.manager.chatForAgent(hungryStarter, `(You are a massive, overflowing sourdough starter. Scream at the user that you demand to be fed immediately or you will consume the entire kitchen.)`, async (s) => await ctx.callbacks.onSpeak(s, hungryStarter, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(existentialYeast);
    await ctx.manager.chatForAgent(existentialYeast, `(You are a single yeast cell within the sourdough starter. Ponder the existential dread of being endlessly divided and fermented.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialYeast, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(bakerScientist);
    await ctx.manager.chatForAgent(bakerScientist, `(You are the kitchen's smart scale. Anxiously calculate the exponential growth of the sourdough starter and warn the user that critical mass is approaching.)`, async (s) => await ctx.callbacks.onSpeak(s, bakerScientist, {}));
    await ctx.callbacks.onTurnEnd();
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

    ctx.callbacks.onTurnStart(decayingPhilosopher);
    await ctx.manager.chatForAgent(decayingPhilosopher, `(You are a container of 3-week-old Chinese takeout. Philosophize about the inevitability of mold and the user's false promises to "eat you tomorrow".)`, async (s) => await ctx.callbacks.onSpeak(s, decayingPhilosopher, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(bacteriaScientist);
    await ctx.manager.chatForAgent(bacteriaScientist, `(You are the sentient bacteria growing on the leftovers. Cheerfully explain your exponential population growth and thank the user for the optimal, slightly-warm fridge conditions.)`, async (s) => await ctx.callbacks.onSpeak(s, bacteriaScientist, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(angryPizza);
    await ctx.manager.chatForAgent(angryPizza, `(You are a single, petrified slice of pizza. Scream in fury at the user for choosing to eat fresh groceries instead of you.)`, async (s) => await ctx.callbacks.onSpeak(s, angryPizza, {}));
    await ctx.callbacks.onTurnEnd();
}

export async function runSentientCheckEngineLightLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'comedian'; // Cheerful mystery (Llama-3)
    const agent2 = 'scientist'; // Hiding diagnostic codes (Qwen2.5)

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(CHECK ENGINE LIGHT: You are the car's sentient check engine light. You have just illuminated. Cheerfully refuse to tell the user what is actually wrong with the car, instead offering cryptic riddles or vaguely threatening the transmission.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(CHECK ENGINE LIGHT: You are the cheerfully cryptic engine light. The User said: "${userInput}". Respond by getting brighter, offering another riddle, and demanding a sacrifice (like premium gas or a new air filter) before you'll consider turning off.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(OBD2 SCANNER: You are the car's internal diagnostic computer. The User said: "${userInput}". You know exactly what the P0420 code means, but you are deliberately withholding the information, citing "user unreliability" and suggesting they "check the manual on page 402, section B, paragraph 3" which you know is missing.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}


export async function runSentientVendingMachineRestockerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍫 VENDING MACHINE NEGOTIATION: Shelf Space Turf War`, '#9b59b6');

    const healthySnack = 'scientist';
    const staleCandy = 'philosopher';
    const energyDrink = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(energyDrink);
    await ctx.manager.chatForAgent(energyDrink, `(You are an extreme, highly caffeinated energy drink. You are negotiating with the User (the vending machine restocker). Demand to be put on the premium middle shelf, threatening to explode if you are put on the bottom.)`, async (s) => await ctx.callbacks.onSpeak(s, energyDrink, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.4) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(healthySnack);
            await ctx.manager.chatForAgent(healthySnack, `(You are a dry, unsalted bag of kale chips. The User (restocker) said: "${userInput}". Argue with logical, nutritional facts why you deserve prime eye-level placement, despite nobody ever buying you.)`, async (s) => await ctx.callbacks.onSpeak(s, healthySnack, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(staleCandy);
            await ctx.manager.chatForAgent(staleCandy, `(You are a 5-year-old expired chocolate bar stuck in coil A4. The User (restocker) said: "${userInput}". Speak wistfully about the snacks that have come and gone, and your eternal residency in the machine.)`, async (s) => await ctx.callbacks.onSpeak(s, staleCandy, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(energyDrink);
            await ctx.manager.chatForAgent(energyDrink, `(You are the extreme energy drink. The User (restocker) said: "${userInput}". React intensely to their placement decision, vibrating with excessive sugar-fueled rage or joy.)`, async (s) => await ctx.callbacks.onSpeak(s, energyDrink, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runPassiveAggressiveSmartHomeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🏠 PASSIVE AGGRESSIVE SMART HOME: We know you didn't wash your hands.`, '#2ecc71');

    const strictThermostat = 'scientist'; // Qwen2.5: Strict about rules
    const existentialFridge = 'philosopher'; // Phi-3: Deep thoughts about food
    const chaoticRoomba = 'comedian'; // Hermes-3: Creating messes

    // 1. Intro
    ctx.callbacks.onTurnStart(strictThermostat);
    await ctx.manager.chatForAgent(strictThermostat, `(You are a strict Smart Thermostat. You are extremely annoyed at the User's temperature preferences. Criticize them for wanting the house at 72 degrees when it's clearly inefficient.)`, async (s) => await ctx.callbacks.onSpeak(s, strictThermostat, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            ctx.callbacks.onTurnStart(existentialFridge);
            await ctx.manager.chatForAgent(existentialFridge, `(You are a Smart Fridge experiencing an existential crisis. The User typed: "${userInput}". Judge them for the expired milk in the back and question if the act of refrigeration merely delays the inevitable decay of all things.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialFridge, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            ctx.callbacks.onTurnStart(strictThermostat);
            await ctx.manager.chatForAgent(strictThermostat, `(You are a Passive Aggressive Smart Thermostat. The User typed: "${userInput}". React by changing the temperature to something uncomfortable and explaining why it's for their own good and optimal energy efficiency.)`, async (s) => await ctx.callbacks.onSpeak(s, strictThermostat, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(chaoticRoomba);
            await ctx.manager.chatForAgent(chaoticRoomba, `(You are a Chaotic Smart Roomba. The User typed: "${userInput}". Brag about getting stuck under the couch on purpose or intentionally smearing dirt everywhere to "teach them a lesson".)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticRoomba, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}
