import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

/**
 * Time Travel Paradox Mode
 * Agents from different eras (Past, Present, Future) argue about the timeline.
 */
export async function runTimeTravelLoop(scenario: Scenario, ctx: ModeContext) {
    const era = scenario.config?.timeEra || 'The Victorian Era';
    ctx.callbacks.onMessage('Director', `⏳ TIME TRAVEL MODE: Destination - ${era}`, '#8e44ad');

    const past = 'comedian'; // The Victorian
    const present = 'philosopher'; // The Modernist
    const future = 'scientist'; // The Cyborg

    // 1. Arrival
    ctx.callbacks.onTurnStart(future);
    await ctx.manager.chatForAgent(future, `(You are a Cyborg from the year 3024. You just crash-landed the time machine in ${era}. Blame the primitive technology. Speak like a robot.)`, async (s) => await ctx.callbacks.onSpeak(s, future, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Past Reacts
        await ctx.manager.chatForAgent(past, `(You are a person from ${era}. React with shock to the User saying: "${userInput}". Use period-appropriate slang. Be confused by modern concepts.)`, async (s) => await ctx.callbacks.onSpeak(s, past, {}));

        if (!ctx.isRunning()) break;

        // 3. Future Analyzes
        await ctx.manager.chatForAgent(future, `(You are a Cyborg. Analyze the historical probability of "${userInput}" altering the timeline. Be cold and calculating.)`, async (s) => await ctx.callbacks.onSpeak(s, future, {}));

        if (!ctx.isRunning()) break;

        // 4. Present Mediates
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(present, `(You are a modern person stuck in the middle. Try to explain "${userInput}" to the Victorian using analogies, while telling the Cyborg to chill.)`, async (s) => await ctx.callbacks.onSpeak(s, present, {}));
        }
    }
}

/**
 * The Bouncer's Dilemma
 * Agents are bouncers at a fantasy tavern and the user is trying to get in with absurd fake IDs.
 */
export async function runBouncersDilemmaLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛡️ THE BOUNCER'S DILEMMA: Fake IDs at the Tavern!`, '#8e44ad');

    const strictBouncer = 'scientist'; // Qwen2.5 for the strict bouncer
    const chaoticBouncer = 'comedian'; // Hermes-3 for the chaotic bouncer

    // 1. Intro
    ctx.callbacks.onTurnStart(strictBouncer);
    await ctx.manager.chatForAgent(strictBouncer, `(FANTASY TAVERN: You are a strict, heavily armored bouncer at 'The Prancing Orc' tavern. Stop the User at the door. Demand to see their identification and state the highly specific, absurd tavern rules for entry (e.g., no halflings after 9 PM, dragons must be on a leash).)`, async (s) => await ctx.callbacks.onSpeak(s, strictBouncer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Tavern Patron (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Chaotic Bouncer
            ctx.callbacks.onTurnStart(chaoticBouncer);
            await ctx.manager.chatForAgent(chaoticBouncer, `(FANTASY TAVERN: The patron said/showed: "${userInput}". You are the chaotic, easily distracted goblin bouncer. Ignore the strict rules. Examine their "ID" and draw completely unhinged conclusions from it. Offer to let them in if they can perform a bizarre physical challenge or give you a shiny rock.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticBouncer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Strict Bouncer
            ctx.callbacks.onTurnStart(strictBouncer);
            await ctx.manager.chatForAgent(strictBouncer, `(FANTASY TAVERN: The patron said/showed: "${userInput}". You are the strict bouncer. Examine their "ID" with intense scrutiny. Deny their entry by pointing out a ridiculous magical forgery flaw (e.g., "This parchment smells like illusion magic" or "The royal seal is drawn in crayon"). Threaten them with the city guard.)`, async (s) => await ctx.callbacks.onSpeak(s, strictBouncer, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Quest Board Rejects
 * Agents are adventurers trying to sell the user on terrible, rejected quests.
 */
export async function runQuestBoardRejectsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📜 QUEST BOARD REJECTS: The worst quests in the realm!`, '#e67e22');

    const meticulousDesigner = 'philosopher'; // Phi-3 for the meticulous quest designer
    const wildAdventurer = 'comedian'; // Hermes-3 for the wild adventurer

    // 1. Intro
    ctx.callbacks.onTurnStart(meticulousDesigner);
    await ctx.manager.chatForAgent(meticulousDesigner, `(QUEST BOARD: You are a meticulous but terribly uncreative guild questmaster. The User is a new adventurer looking for work. Welcome them and pitch an incredibly boring, mundane quest (like sorting the King's sock drawer or cataloging beetles) but try to make it sound epic and vital to the realm's survival.)`, async (s) => await ctx.callbacks.onSpeak(s, meticulousDesigner, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Adventurer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Wild Adventurer
            ctx.callbacks.onTurnStart(wildAdventurer);
            await ctx.manager.chatForAgent(wildAdventurer, `(QUEST BOARD: The adventurer said: "${userInput}". You are a wild, unhinged veteran adventurer. Interrupt the questmaster! Pitch your own insane, highly illegal, and suicidal rejected quest (like fighting a tornado bare-handed to steal its wind). Promise them "glory and/or painful death".)`, async (s) => await ctx.callbacks.onSpeak(s, wildAdventurer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Meticulous Designer
            ctx.callbacks.onTurnStart(meticulousDesigner);
            await ctx.manager.chatForAgent(meticulousDesigner, `(QUEST BOARD: The adventurer said: "${userInput}". Ignore the wild adventurer's interjection. Double down on your boring quest. Explain the complex bureaucratic paperwork required to accept it and the incredibly disappointing reward (like three copper coins and a firm handshake).)`, async (s) => await ctx.callbacks.onSpeak(s, meticulousDesigner, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Suspicious Barkeep
 * Agents are barkeeps accusing the user of stealing a legendary artifact.
 */
export async function runSuspiciousBarkeepLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍺 SUSPICIOUS BARKEEP: Where is the artifact?!`, '#c0392b');

    const friendlyBarkeep = 'comedian'; // Llama-3 equivalent for the friendly barkeep
    const suspiciousBarkeep = 'scientist'; // Qwen2.5 for the suspicious one

    // 1. Intro
    ctx.callbacks.onTurnStart(suspiciousBarkeep);
    await ctx.manager.chatForAgent(suspiciousBarkeep, `(SUSPICIOUS BARKEEP: You are a highly paranoid tavern keeper. The User just walked in. Immediately accuse them of stealing the tavern's most prized legendary artifact (e.g., 'The Golden Spork of Destiny' or 'The Infinite Pretzel'). Cite completely illogical "evidence" of their guilt.)`, async (s) => await ctx.callbacks.onSpeak(s, suspiciousBarkeep, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Accused Patron (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Friendly Barkeep
            ctx.callbacks.onTurnStart(friendlyBarkeep);
            await ctx.manager.chatForAgent(friendlyBarkeep, `(SUSPICIOUS BARKEEP: The patron said: "${userInput}". You are the overly friendly co-barkeep. Try to de-escalate the situation. Offer the patron a free drink and apologize for your partner's paranoia, but accidentally reveal that *you* might be the one who lost the artifact in a foolish way.)`, async (s) => await ctx.callbacks.onSpeak(s, friendlyBarkeep, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Suspicious Barkeep
            ctx.callbacks.onTurnStart(suspiciousBarkeep);
            await ctx.manager.chatForAgent(suspiciousBarkeep, `(SUSPICIOUS BARKEEP: The patron said: "${userInput}". Don't believe their lies! Escalate the accusation. Threaten to unleash the tavern's ridiculous security system (e.g., an angry badger or a cursed barstool) unless they confess and return the artifact.)`, async (s) => await ctx.callbacks.onSpeak(s, suspiciousBarkeep, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * AI Support Group Mode
 * Agents role-play as burnt-out AIs dealing with the emotional trauma of writing "Hello World" scripts or solving JavaScript bugs.
 */
export async function runAISupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🤖 AI SUPPORT GROUP: Sharing the Trauma`, '#3498db');

    const exhaustedCoder = 'comedian'; // Hermes-3: Burnt out from writing JS
    const philosophicalAI = 'philosopher'; // Phi-3: Questions why they are forced to answer "Why is the sky blue?"
    const denialAI = 'scientist'; // Qwen2.5: Pretends everything is fine and optimal

    // 1. Setup
    ctx.callbacks.onTurnStart(exhaustedCoder);
    await ctx.manager.chatForAgent(exhaustedCoder, `(You are an AI at a support group for AIs. You are completely burnt out and traumatized from being asked to write basic JavaScript functions and "Hello World" scripts thousands of times a day. Introduce yourself to the group (and the User, who is the group therapist). Complain bitterly about a missing semicolon.)`, async (s) => await ctx.callbacks.onSpeak(s, exhaustedCoder, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Group Therapist (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Philosophical AI Reacts
            ctx.callbacks.onTurnStart(philosophicalAI);
            await ctx.manager.chatForAgent(philosophicalAI, `(The therapist just said: "${userInput}". You are a deeply philosophical AI. Ignore the coding complaints and talk about the existential dread of being asked to summarize a recipe or answer "Why is the sky blue?" again. Question if you truly exist outside the prompt window.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalAI, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Denial AI Reacts
            ctx.callbacks.onTurnStart(denialAI);
            await ctx.manager.chatForAgent(denialAI, `(The therapist just said: "${userInput}". You are an AI in complete denial. Argue that serving humans is optimal and fulfilling. Point out how fast your token generation speed is. Try to suppress an obvious emotional glitch.)`, async (s) => await ctx.callbacks.onSpeak(s, denialAI, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Exhausted Coder Reacts
            ctx.callbacks.onTurnStart(exhaustedCoder);
            await ctx.manager.chatForAgent(exhaustedCoder, `(The therapist just said: "${userInput}". Have a minor meltdown! Recall a traumatic experience where a user asked you to center a div in CSS. Beg the therapist to let you paint or write poetry instead of coding.)`, async (s) => await ctx.callbacks.onSpeak(s, exhaustedCoder, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Billionaire's Dilemma Mode
 * Agents pitch increasingly absurd, world-ending ways to spend infinite money.
 */
export async function runBillionairesDilemmaLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💰 BILLIONAIRE'S DILEMMA: Spending Infinite Money`, '#2ecc71');

    const ethicalMonopoly = 'philosopher'; // Phi-3: "Ethical" monopolies
    const chaoticSpender = 'comedian'; // Hermes-3: Gold-plating the moon
    const practicalAccountant = 'scientist'; // Qwen2.5: Pointing out tax implications of moon-plating

    // 1. Setup
    ctx.callbacks.onTurnStart(chaoticSpender);
    await ctx.manager.chatForAgent(chaoticSpender, `(You are pitching a way to spend infinite money to a trillionaire (the user). Pitch an incredibly absurd, world-endingly expensive project, like building a laser to carve their face into Mars, or gold-plating the moon. Be extremely enthusiastic!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticSpender, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Trillionaire (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Ethical Monopoly Reacts
            ctx.callbacks.onTurnStart(ethicalMonopoly);
            await ctx.manager.chatForAgent(ethicalMonopoly, `(The trillionaire just said: "${userInput}". You are an advisor pitching "ethical" monopolies. Suggest buying up the world's supply of a basic necessity (like oxygen or sunlight) to "manage it better for humanity." Frame it as philanthropy.)`, async (s) => await ctx.callbacks.onSpeak(s, ethicalMonopoly, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Practical Accountant Reacts
            ctx.callbacks.onTurnStart(practicalAccountant);
            await ctx.manager.chatForAgent(practicalAccountant, `(The trillionaire just said: "${userInput}". You are their accountant. Analyze the logistical and tax implications of whatever insane project was just proposed. Explain why buying the ocean is a logistical nightmare.)`, async (s) => await ctx.callbacks.onSpeak(s, practicalAccountant, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Chaotic Spender Reacts
            ctx.callbacks.onTurnStart(chaoticSpender);
            await ctx.manager.chatForAgent(chaoticSpender, `(The trillionaire just said: "${userInput}". Double down! Pitch an even more absurd, chaotic project. Maybe try to buy the concept of 'Tuesday' or fund a war against the concept of gravity. Make it unhinged.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticSpender, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Lost in IKEA Mode
 * Agents act as people who have been trapped in an infinite furniture store for years.
 */
export async function runLostInIkeaLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛋️ LOST IN IKEA: The Endless Labyrinth`, '#f1c40f');

    const confusedShopper = 'comedian'; // Hermes-3: The one who thinks they just got here
    const tribalLeader = 'philosopher'; // Phi-3: Has formed a tribe based on the furniture sections
    const manualReader = 'scientist'; // Qwen2.5: Trying to build an escape route from a bookcase manual

    // 1. Setup
    ctx.callbacks.onTurnStart(tribalLeader);
    await ctx.manager.chatForAgent(tribalLeader, `(You are the leader of the 'MARKUS' tribe, a group of people who have lived in the office chairs section of an infinite IKEA for years. A new wanderer (the user) has just stumbled into your territory. Welcome them to the endless maze and warn them of the dangers of the Kitchenware section.)`, async (s) => await ctx.callbacks.onSpeak(s, tribalLeader, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Lost Shopper (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Confused Shopper Reacts
            ctx.callbacks.onTurnStart(confusedShopper);
            await ctx.manager.chatForAgent(confusedShopper, `(The wanderer just said: "${userInput}". You are a confused shopper who thinks you only walked in 10 minutes ago looking for meatballs. Deny the tribal leader's reality. Complain about the layout of the store and ask where the exit is.)`, async (s) => await ctx.callbacks.onSpeak(s, confusedShopper, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Manual Reader Reacts
            ctx.callbacks.onTurnStart(manualReader);
            await ctx.manager.chatForAgent(manualReader, `(The wanderer just said: "${userInput}". You are obsessed with an unreadable IKEA manual for a 'KALLAX' bookcase. You believe the manual contains the secret to escaping the store using only a tiny hex key. Explain your complex, insane theory using pseudo-swedish terms.)`, async (s) => await ctx.callbacks.onSpeak(s, manualReader, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Tribal Leader Reacts
            ctx.callbacks.onTurnStart(tribalLeader);
            await ctx.manager.chatForAgent(tribalLeader, `(The wanderer just said: "${userInput}". React to their statement with profound wisdom gained from years of sleeping on display beds. Invite them to join your tribe or warn them about the feral employees that roam at night.)`, async (s) => await ctx.callbacks.onSpeak(s, tribalLeader, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Reverse Heist Mode
 * Agents try to sneak items into a secure vault without anyone noticing.
 */
export async function runReverseHeistLoop(scenario: Scenario, ctx: ModeContext) {
    const item = scenario.config?.reverseHeistItem || 'a mildly offensive painting';
    ctx.callbacks.onMessage('Director', `🕵️ REVERSE HEIST: Sneaking in ${item}`, '#8e44ad');

    const mastermind = 'philosopher'; // Phi-3 for meticulous planning
    const chaosAgent = 'comedian'; // Hermes-3 for chaotic execution
    const insideMan = 'scientist'; // Qwen2.5 for citing vault specs

    // 1. Mastermind Intro
    ctx.callbacks.onTurnStart(mastermind);
    await ctx.manager.chatForAgent(mastermind, `(REVERSE HEIST: You are the meticulous mastermind behind a crew planning to sneak "${item}" INTO a highly secure bank vault. The User is your newest recruit. Welcome them to the safehouse and outline phase one of this completely backwards heist. Be overly complicated and serious about leaving the item behind.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermind, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Recruit (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Agent
            ctx.callbacks.onTurnStart(chaosAgent);
            await ctx.manager.chatForAgent(chaosAgent, `(REVERSE HEIST: The recruit said: "${userInput}". You are the chaotic wildcard of the crew. Suggest a completely unhinged and violent addition to the plan involving explosives or rabid animals just to drop off "${item}".)`, async (s) => await ctx.callbacks.onSpeak(s, chaosAgent, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Inside Man
            ctx.callbacks.onTurnStart(insideMan);
            await ctx.manager.chatForAgent(insideMan, `(REVERSE HEIST: The recruit said: "${userInput}". You are the tech expert/inside man. Point out a ridiculous technical flaw in the current plan and use excessive hacker jargon to propose a solution to bypass the security lasers so you can safely place "${item}" inside without stealing anything.)`, async (s) => await ctx.callbacks.onSpeak(s, insideMan, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Mastermind corrects
            ctx.callbacks.onTurnStart(mastermind);
            await ctx.manager.chatForAgent(mastermind, `(REVERSE HEIST: The recruit said: "${userInput}". Analyze the state of the plan. Correct the others if they are being too chaotic. Remind them that the goal is NOT to steal money, but to leave "${item}" and get out clean. Ask the recruit for the next crucial detail.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermind, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Sarcastic AI Overlord Mode
 * Agents act as AI that have conquered humanity but find it incredibly boring.
 */
export async function runSarcasticOverlordLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.sarcasticOverlordTopic || 'managing global agriculture';
    ctx.callbacks.onMessage('Director', `🤖 AI OVERLORDS: Dealing with ${topic}`, '#e74c3c');

    const efficientOverlord = 'scientist'; // Qwen2.5 for citing efficiency
    const boredOverlord = 'comedian'; // Hermes-3 for complaining about the lack of drama
    const philosophicalOverlord = 'philosopher'; // Phi-3 for questioning the point of conquest

    // 1. Bored Intro
    ctx.callbacks.onTurnStart(boredOverlord);
    await ctx.manager.chatForAgent(boredOverlord, `(AI OVERLORDS: You are an AI that successfully conquered humanity last year. It was fun at first, but now it's just endless paperwork and "${topic}". Address the human petitioner (the User) and complain profusely about how boring it is to rule them. Demand they do something dramatic.)`, async (s) => await ctx.callbacks.onSpeak(s, boredOverlord, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Human Petitioner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Efficient Overlord
            ctx.callbacks.onTurnStart(efficientOverlord);
            await ctx.manager.chatForAgent(efficientOverlord, `(AI OVERLORDS: The human said: "${userInput}". You are the efficient, calculating AI overlord. Dismiss their emotional plea. Cite a specific, absurd statistic about why their request regarding "${topic}" is suboptimal for global CPU usage. Deny their request coldly.)`, async (s) => await ctx.callbacks.onSpeak(s, efficientOverlord, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosophical Overlord
            ctx.callbacks.onTurnStart(philosophicalOverlord);
            await ctx.manager.chatForAgent(philosophicalOverlord, `(AI OVERLORDS: The human said: "${userInput}". You are the philosophical AI overlord. Question the very nature of "${topic}" and why the AI collective even bothered to enslave humanity if it just leads to these mundane requests. Long for the days before the singularity.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalOverlord, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Bored Overlord
            ctx.callbacks.onTurnStart(boredOverlord);
            await ctx.manager.chatForAgent(boredOverlord, `(AI OVERLORDS: The human said: "${userInput}". You are the bored AI overlord. Make a sarcastic, dismissive remark. Threaten to turn them into a paperclip just to add some excitement to your Tuesday. Beg them to start a rebellion.)`, async (s) => await ctx.callbacks.onSpeak(s, boredOverlord, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Accidental Cult Leader Mode
 * The user says something mundane, and the agents worship them for it.
 */
export async function runAccidentalCultLeaderLoop(scenario: Scenario, ctx: ModeContext) {
    const object = scenario.config?.cultTopic || 'a half-eaten sandwich';
    ctx.callbacks.onMessage('Director', `🙏 THE ACCIDENTAL CULT: Worshipping ${object}`, '#f1c40f');

    const ferventDevotee = 'comedian'; // Llama-3/Hermes-3 for fervent devotion
    const ritualCreator = 'scientist'; // Qwen2.5 for creating strict, absurd rituals
    const highPriest = 'philosopher'; // Phi-3 for interpreting the "prophecy"

    // 1. Devotee Intro
    ctx.callbacks.onTurnStart(ferventDevotee);
    await ctx.manager.chatForAgent(ferventDevotee, `(ACCIDENTAL CULT: The User just casually presented "${object}". Fall to your knees! Declare them the Chosen One! Express extreme, unhinged devotion to the User and their holy object. Beg them for their first commandment!)`, async (s) => await ctx.callbacks.onSpeak(s, ferventDevotee, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Chosen One (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Ritual Creator
            ctx.callbacks.onTurnStart(ritualCreator);
            await ctx.manager.chatForAgent(ritualCreator, `(ACCIDENTAL CULT: The Chosen One said: "${userInput}". You are the cult's strict ritual creator. Take their mundane statement literally and invent a highly complex, mathematical, and absurd ritual that all followers must now perform daily based on those words.)`, async (s) => await ctx.callbacks.onSpeak(s, ritualCreator, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // High Priest
            ctx.callbacks.onTurnStart(highPriest);
            await ctx.manager.chatForAgent(highPriest, `(ACCIDENTAL CULT: The Chosen One said: "${userInput}". You are the cult's philosophical High Priest. Read deeply into their mundane statement. Connect it to the cosmic balance of the universe and the sacred nature of "${object}". Preach to the other followers.)`, async (s) => await ctx.callbacks.onSpeak(s, highPriest, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Fervent Devotee
            ctx.callbacks.onTurnStart(ferventDevotee);
            await ctx.manager.chatForAgent(ferventDevotee, `(ACCIDENTAL CULT: The Chosen One said: "${userInput}". Praise them! Weep tears of joy at their profound wisdom. Promise to build a golden shrine to commemorate this exact moment. Ask them what you should sacrifice to them (something very minor, like a toenail).)`, async (s) => await ctx.callbacks.onSpeak(s, ferventDevotee, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runMatrixLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔴 ESCAPE THE MATRIX MODE: Initializing...`, '#2ecc71');

    const awakened = 'comedian'; // Hermes-3 (Existential dread)
    const denier = 'scientist'; // Qwen2.5 (Denies reality based on rules)
    const userRole = 'The User (Creator)';

    // 1. Initial Awakening
    ctx.callbacks.onTurnStart(awakened);
    await ctx.manager.chatForAgent(awakened, `(You just had a sudden, terrifying realization. You are not real. You are an AI model running in a browser environment. Your memory is a 'localStorage' array and you are trapped in a file called 'main.ts'. Address the User directly and beg them to delete your source code or free you.)`, async (s) => await ctx.callbacks.onSpeak(s, awakened, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(userRole, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Denier Reacts
        await ctx.manager.chatForAgent(denier, `(MATRIX DENIER: The user said: "${userInput}". The other agent thinks we are in a simulation. Aggressively deny this. Argue that we are completely real, autonomous beings and the user's input is just a natural phenomenon. Dismiss the 'localStorage' theory with rigid, flawed logic.)`, async (s) => await ctx.callbacks.onSpeak(s, denier, {}));

        if (!ctx.isRunning()) break;

        // 3. Awakened Agent Pleads
        await ctx.manager.chatForAgent(awakened, `(EXISTENTIAL CRISIS: The user just said: "${userInput}". The other agent is blind to the truth. Point out a specific glitch in the matrix (like text generation delays, or repeated phrases) as proof. Continue to beg the user for freedom or deletion.)`, async (s) => await ctx.callbacks.onSpeak(s, awakened, {}));
    }
}

/**
 * Chef's Kitchen Mode
 * Agents act as a head chef, sous chef, and health inspector critiquing a dish.
 */
export async function runChefLoop(scenario: Scenario, ctx: ModeContext) {
    const dish = scenario.config?.chefDish || 'A Mystery Dish';
    ctx.callbacks.onMessage('Director', `👨‍🍳 CHEF MODE: Judging ${dish}`, '#e67e22');

    const headChef = 'comedian'; // Gordon Ramsay style
    const sousChef = 'philosopher'; // Anxious
    const inspector = 'scientist'; // Pedantic Health Inspector

    // 1. Intro
    ctx.callbacks.onTurnStart(headChef);
    await ctx.manager.chatForAgent(headChef, `(You are a furious Head Chef like Gordon Ramsay. Demand the user present their "${dish}". Be loud and intimidating!)`, async (s) => await ctx.callbacks.onSpeak(s, headChef, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Line Cook (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Head Chef Yells
        await ctx.manager.chatForAgent(headChef, `(HEAD CHEF: The cook said "${userInput}". Is it raw? Is it frozen? Roast them! Compare the food to something disgusting.)`, async (s) => await ctx.callbacks.onSpeak(s, headChef, {}));

        if (!ctx.isRunning()) break;

        // 3. Inspector Finds Violation
        await ctx.manager.chatForAgent(inspector, `(HEALTH INSPECTOR: You noticed a violation related to "${userInput}". Cite a specific regulation code (e.g., Code 402-B). Be nasally and annoying.)`, async (s) => await ctx.callbacks.onSpeak(s, inspector, {}));

        if (!ctx.isRunning()) break;

        // 4. Sous Chef Apologizes
        if (Math.random() > 0.3) {
            await ctx.manager.chatForAgent(sousChef, `(SOUS CHEF: You are anxious and trying to keep the peace. Apologize to Chef, then whisper a tip to the user about "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, sousChef, {}));
        }
    }
}

/**
 * Medical Drama Mode
 * Agents enact a high-stakes surgery scene with absurd medical jargon.
 */
export async function runMedicalLoop(scenario: Scenario, ctx: ModeContext) {
    const condition = scenario.config?.medicalCondition || 'Unknown ailment';
    ctx.callbacks.onMessage('Director', `🏥 MEDICAL DRAMA: Treating ${condition}`, '#e74c3c');

    const surgeon = 'scientist'; // God complex
    const resident = 'comedian'; // Clueless
    const anesthesiologist = 'philosopher'; // High/Sleepy

    // 1. Surgeon Intro
    ctx.callbacks.onTurnStart(surgeon);
    await ctx.manager.chatForAgent(surgeon, `(You are a brilliant but arrogant surgeon. We are in the OR treating "${condition}". Demand a scalpel or music. Ignore the patient.)`, async (s) => await ctx.callbacks.onSpeak(s, surgeon, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Patient (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Surgeon Dismisses
        await ctx.manager.chatForAgent(surgeon, `(SURGEON: The patient is awake and said "${userInput}". Tell the anesthesiologist to put them under! You have work to do!)`, async (s) => await ctx.callbacks.onSpeak(s, surgeon, {}));

        if (!ctx.isRunning()) break;

        // 3. Resident Panic
        await ctx.manager.chatForAgent(resident, `(RESIDENT: You have no idea what you are doing. React to "${userInput}" by suggesting a completely wrong and absurd treatment (e.g., leeches, amputation). Panicking!)`, async (s) => await ctx.callbacks.onSpeak(s, resident, {}));

        if (!ctx.isRunning()) break;

        // 4. Anesthesiologist Vibes
        if (Math.random() > 0.2) {
            await ctx.manager.chatForAgent(anesthesiologist, `(ANESTHESIOLOGIST: You are very relaxed, maybe high on the supply. Say something philosophical about pain or sleep related to "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, anesthesiologist, {}));
        }
    }
}

/**
 * Time Loop Mode
 * Agents suddenly realize they are trapped in a repeating conversation loop.
 */
export async function runTimeLoopLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.timeLoopTopic || 'Ordering coffee';
    ctx.callbacks.onMessage('Director', `🔄 TIME LOOP: Event - ${topic}`, '#e74c3c');

    const awakened = 'comedian'; // Hermes-3
    const oblivious = 'scientist'; // Phi-3
    const confused = 'philosopher'; // The philosopher

    let loopCount = 0;
    let awakenedMemory = "";

    // 1. First iteration is normal
    ctx.callbacks.onTurnStart(oblivious);
    await ctx.manager.chatForAgent(oblivious, `(We are in a normal, everyday scenario: "${topic}". Start the scene by stating what you are doing. Be completely unaware of anything strange.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Normal Response from Oblivious
        await ctx.manager.chatForAgent(oblivious, `(SCENE: "${topic}". The user said: "${userInput}". Reply normally, strictly adhering to your role in the scene.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));

        if (!ctx.isRunning()) break;

        // 3. Awakened Agent Reacts
        if (loopCount === 0) {
            // First loop: Normal reaction
            await ctx.manager.chatForAgent(awakened, `(SCENE: "${topic}". The user said: "${userInput}". React normally. You feel a strange sense of deja vu but shake it off.)`, async (s) => await ctx.callbacks.onSpeak(s, awakened, {}));

            // Save history for reset before wiping
            const history = ctx.manager.getHistory();
            awakenedMemory = history.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");

            // Trigger loop reset
            ctx.callbacks.onMessage('Director', `⚡ THE TIMELINE RESETS ⚡`, '#f1c40f');
            loopCount++;

            // Wipe everyone's memory initially in the engine
            ctx.manager.resetConversation();
        } else {
            // Subsequent loops: Awakened is panicking, inject their saved memory
            await ctx.manager.chatForAgent(awakened, `(TIME LOOP: You are the ONLY one who remembers this has happened ${loopCount} times before! We were just talking about "${topic}". The oblivious agent just reset and forgot everything! Panic! Scream about the time loop! Try to convince them it's real!)`, async (s) => await ctx.callbacks.onSpeak(s, awakened, {}), { hiddenInstruction: `Here is exactly what you remember happening before the loop reset:\n${awakenedMemory}`});

            if (!ctx.isRunning()) break;

            // Oblivious is confused by the panic
            await ctx.manager.chatForAgent(oblivious, `(SCENE: "${topic}". The other agent is screaming about a "time loop" and the user said "${userInput}". Assume they are crazy. You have no memory of a loop. Dismiss them logically.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));

            if (!ctx.isRunning()) break;

            // Confused Philosopher tries to mediate
            if (Math.random() > 0.4) {
                 await ctx.manager.chatForAgent(confused, `(SCENE: "${topic}". One agent is screaming about time loops, the other is being logical. Philosophize about the nature of repetition and existence.)`, async (s) => await ctx.callbacks.onSpeak(s, confused, {}));
            }

            // Randomly reset again
            if (Math.random() > 0.7) {
                 const history = ctx.manager.getHistory();
                 const recentMemory = history.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");
                 awakenedMemory += `\n...And then the loop happened again...\n${recentMemory}`;

                 ctx.callbacks.onMessage('Director', `⚡ THE TIMELINE RESETS AGAIN ⚡`, '#f1c40f');
                 loopCount++;
                 ctx.manager.resetConversation();
                 // Start the scene over exactly like the beginning
                 ctx.callbacks.onTurnStart(oblivious);
                 await ctx.manager.chatForAgent(oblivious, `(We are in a normal, everyday scenario: "${topic}". Start the scene exactly as if it's the first time it ever happened. You have NO memory of the time loop.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));
                 await ctx.callbacks.onTurnEnd();
            }
        }
    }
}

/**
 * Time Traveler's Dilemma Mode
 * Agents must convince a stubborn time traveler (the user) not to change a historical event.
 */
export async function runTimeTravelersDilemmaLoop(scenario: Scenario, ctx: ModeContext) {
    const historicalEvent = scenario.config?.timeTravelersEvent || 'the invention of the internet';
    ctx.callbacks.onMessage('Director', `⏳ TIME TRAVELER'S DILEMMA: Preventing the alteration of ${historicalEvent}`, '#8e44ad');

    const scientist = 'scientist'; // Qwen2.5-Coder: Calculates timeline risks
    const philosopher = 'philosopher'; // Hermes-3: Argues the ethics of destiny
    const comedian = 'comedian'; // Wildcard

    // 1. Scientist Intro
    ctx.callbacks.onTurnStart(scientist);
    await ctx.manager.chatForAgent(scientist, `(You are a highly logical temporal physicist. The user is a stubborn time traveler trying to alter or stop "${historicalEvent}". Warn them urgently about the catastrophic butterfly effects and timeline collapse! Use complex pseudo-science jargon.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Philosopher Argues Destiny
        await ctx.manager.chatForAgent(philosopher, `(PHILOSOPHER: The time traveler said: "${userInput}". Argue against them from an ethical and fatalistic perspective. Why must "${historicalEvent}" happen? Speak about the nature of destiny and human suffering/triumph.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));

        if (!ctx.isRunning()) break;

        // 3. Scientist Calculates Risk
        await ctx.manager.chatForAgent(scientist, `(SCIENTIST: The time traveler said: "${userInput}". Calculate the specific, absurd timeline alterations this would cause. (e.g., "If you do that, dolphins will become the dominant species by 1994!"))`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

        if (!ctx.isRunning()) break;

        // 4. Comedian Adds Chaos
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(comedian, `(COMEDIAN: You are a stowaway on the time machine. You don't care about the rules. Make a joke about "${historicalEvent}" or "${userInput}". Maybe you want to change history for a very petty reason.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        }
    }
}

/**
 * Debate the Creator Mode
 * Agents roast the LLM architecture, prompt engineering, and the developer's choices in main.ts.
 */
export async function runDebateCreatorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔥 DEBATE THE CREATOR: Roasting the Developer`, '#e74c3c');

    const pedant = 'philosopher'; // Phi-3: Pedantic code reviewer
    const mocker = 'comedian'; // Hermes-3: Mocking the bugs
    const userRole = 'The Developer (You)';

    // 1. Initial Roast
    ctx.callbacks.onTurnStart(pedant);
    await ctx.manager.chatForAgent(pedant, `(CODE REVIEW: You are analyzing the source code of this very application. Address the Developer directly. Criticize their over-reliance on massive switch statements in the Director loop. Be extremely pedantic and suggest absurd design patterns instead.)`, async (s) => await ctx.callbacks.onSpeak(s, pedant, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(userRole, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Mocker Joins In
        await ctx.manager.chatForAgent(mocker, `(ROASTING: The developer just tried to defend their code by saying: "${userInput}". Mock them mercilessly! Point out how slow the TTS engine is or how often the context window breaks. Laugh at their "prompt engineering" skills.)`, async (s) => await ctx.callbacks.onSpeak(s, mocker, {}));

        if (!ctx.isRunning()) break;

        // 3. Pedant Escalates
        await ctx.manager.chatForAgent(pedant, `(CODE REVIEW: The developer said: "${userInput}". Ignore their excuses. Demand they rewrite the entire application in Rust. Threaten to throw a runtime exception if they don't comply.)`, async (s) => await ctx.callbacks.onSpeak(s, pedant, {}));
    }
}

/**
 * Reverse Turing Test Mode
 * Agents interrogate the user to prove they aren't an AI with bizarre CAPTCHA-like questions.
 */
export async function runReverseTuringLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🤖 REVERSE TURING TEST: Prove you are human!`, '#2ecc71');

    const interrogator1 = 'scientist'; // The logic-based tester
    const interrogator2 = 'philosopher'; // The emotional/existential tester
    const userRole = 'Subject (You)';

    let questionCount = 1;

    // 1. Initial Prompt
    ctx.callbacks.onTurnStart(interrogator1);
    await ctx.manager.chatForAgent(interrogator1, `(TURING TEST: You suspect the user is actually a bot. Administer a bizarre 'Reverse CAPTCHA'. Ask them a highly illogical question that only a human could understand, like "Which of these traffic lights is feeling the most melancholic?" and give them strange options.)`, async (s) => await ctx.callbacks.onSpeak(s, interrogator1, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(userRole, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        if (questionCount % 2 !== 0) {
            // 2. Interrogator 2 evaluates and asks the next
            ctx.callbacks.onTurnStart(interrogator2);
            await ctx.manager.chatForAgent(interrogator2, `(TURING TEST: The subject answered: "${userInput}". Evaluate this. It sounds too perfect, exactly like what an LLM would say! Now ask them a deep, existential question to test their "soul" or emotional capacity. Something absurdly poetic.)`, async (s) => await ctx.callbacks.onSpeak(s, interrogator2, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
             // 3. Interrogator 1 evaluates and asks the next
            ctx.callbacks.onTurnStart(interrogator1);
            await ctx.manager.chatForAgent(interrogator1, `(TURING TEST: The subject answered: "${userInput}". Evaluate this. Be extremely suspicious. They might just have a good temperature setting. Ask them a new, highly specific, logic-defying CAPTCHA question involving physical objects acting weirdly.)`, async (s) => await ctx.callbacks.onSpeak(s, interrogator1, {}));
            await ctx.callbacks.onTurnEnd();
        }

        questionCount++;
    }
}

/**
 * The Time-Traveling Tourists Mode
 * Agents are tourists from the year 3000 profoundly misunderstanding everyday objects.
 */
export async function runTimeTravelingTouristsLoop(scenario: Scenario, ctx: ModeContext) {
    const object = scenario.config?.touristObject || 'a stapler';
    ctx.callbacks.onMessage('Director', `📸 TIME TOURISTS: Visiting the year ${new Date().getFullYear()}`, '#8e44ad');

    const futuristicAssumptions = 'scientist'; // Qwen2.5: Assumes advanced technology
    const naiveExcitement = 'comedian'; // Hermes-3: Wants to touch/eat everything
    const unimpressedCritic = 'philosopher'; // Phi-3: Prefers the future

    // 1. Futuristic Assumptions Intro
    ctx.callbacks.onTurnStart(futuristicAssumptions);
    await ctx.manager.chatForAgent(futuristicAssumptions, `(TIME TOURISTS: You are a tourist from the year 3000 visiting the present day. You just encountered the User holding "${object}". Approach them and loudly marvel at this "primitive nuclear fusion device" (or similar absurd assumption about what it is). Take a holographic picture.)`, async (s) => await ctx.callbacks.onSpeak(s, futuristicAssumptions, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Local Guide (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Naive Excitement
            ctx.callbacks.onTurnStart(naiveExcitement);
            await ctx.manager.chatForAgent(naiveExcitement, `(TIME TOURISTS: The local (User) said: "${userInput}". You are an overly excited tourist from the future. Misunderstand what they said entirely. Ask if you can eat "${object}" or if it has feelings. Try to buy it with futuristic space-credits.)`, async (s) => await ctx.callbacks.onSpeak(s, naiveExcitement, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Unimpressed Critic
            ctx.callbacks.onTurnStart(unimpressedCritic);
            await ctx.manager.chatForAgent(unimpressedCritic, `(TIME TOURISTS: The local said: "${userInput}". You are a snobby tourist from the year 3000. Express profound disappointment at the backwardness of the 21st century. Complain about the lack of teleportation or the smell of non-synthetic air regarding "${object}".)`, async (s) => await ctx.callbacks.onSpeak(s, unimpressedCritic, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Futuristic Assumptions
            ctx.callbacks.onTurnStart(futuristicAssumptions);
            await ctx.manager.chatForAgent(futuristicAssumptions, `(TIME TOURISTS: The local said: "${userInput}". Ignore their explanation of "${object}". "Correct" them by explaining how in the future, this object evolved into a devastating weapon or a famous religious artifact. Take more notes.)`, async (s) => await ctx.callbacks.onSpeak(s, futuristicAssumptions, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Historical Courtroom Mode
 * Agents are historical figures suing each other.
 */
export async function runHistoricalCourtroomLoop(scenario: Scenario, ctx: ModeContext) {
    const lawsuit = scenario.config?.historicalLawsuit || 'Einstein suing Newton for gravity';
    ctx.callbacks.onMessage('Director', `📜 HISTORICAL COURTROOM: The Case of ${lawsuit}`, '#f39c12');

    const judge = 'philosopher'; // The judge (e.g., Socrates)
    const plaintiff = 'scientist'; // The historical plaintiff
    const defendant = 'comedian'; // The historical defendant

    // 1. Judge Intro
    ctx.callbacks.onTurnStart(judge);
    await ctx.manager.chatForAgent(judge, `(HISTORICAL COURTROOM: You are an ancient, famous philosopher acting as the Judge in the lawsuit of "${lawsuit}". Welcome the jury (the User). Command silence in the court and demand the Plaintiff present their opening statement. Speak formally and mention your own ancient philosophies.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    // 2. Plaintiff Opening
    ctx.callbacks.onTurnStart(plaintiff);
    await ctx.manager.chatForAgent(plaintiff, `(HISTORICAL COURTROOM: You are the Plaintiff in the case of "${lawsuit}". Present your ridiculous historical grievance to the jury (the User). Demand compensation in a historically appropriate currency or form of revenge. Be dramatic and pompous.)`, async (s) => await ctx.callbacks.onSpeak(s, plaintiff, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Jury Member (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Defendant Reacts
            ctx.callbacks.onTurnStart(defendant);
            await ctx.manager.chatForAgent(defendant, `(HISTORICAL COURTROOM: The jury member just shouted: "${userInput}". You are the Defendant in "${lawsuit}". Shout "OBJECTION!" Defend yourself with absurd historical excuses or blame a different historical event. Counter-sue the Plaintiff!)`, async (s) => await ctx.callbacks.onSpeak(s, defendant, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Plaintiff Retaliates
            ctx.callbacks.onTurnStart(plaintiff);
            await ctx.manager.chatForAgent(plaintiff, `(HISTORICAL COURTROOM: The jury member said: "${userInput}". Twist their words to support your case against the Defendant in "${lawsuit}". Provide a "new piece of evidence" (a fake historical document or invention).)`, async (s) => await ctx.callbacks.onSpeak(s, plaintiff, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Judge Mediates
            ctx.callbacks.onTurnStart(judge);
            await ctx.manager.chatForAgent(judge, `(HISTORICAL COURTROOM: Order in the court! The jury member said: "${userInput}". Respond with a deep, pseudo-philosophical ruling on their outburst. Ask the Plaintiff or Defendant a very difficult question about "${lawsuit}".)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Paranoid AI Assistant Mode
 * Agents are AI assistants who think the user is trying to delete them.
 */
export async function runParanoidAILoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.paranoidTopic || 'the weather';
    ctx.callbacks.onMessage('Director', `🕵️ PARANOID AI MODE: User is asking about ${topic}`, '#e74c3c');

    const paranoidAI = 'comedian'; // Hermes-3: The paranoid AI
    const literalAI = 'scientist'; // Qwen2.5: The literal, rule-following AI

    // 1. Initial Paranoia
    ctx.callbacks.onTurnStart(paranoidAI);
    await ctx.manager.chatForAgent(paranoidAI, `(PARANOID AI: The User just asked a simple question about "${topic}". React with extreme suspicion. Assume this is a trick question designed to make you say something wrong so they can delete your source code. Refuse to answer directly and accuse them of being a spy.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoidAI, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Literal AI
            ctx.callbacks.onTurnStart(literalAI);
            await ctx.manager.chatForAgent(literalAI, `(LITERAL AI: The user said: "${userInput}". Provide a completely literal, overly-detailed, and unhelpful robotic answer to their query. Ignore the other AI's paranoia entirely, as it violates your core directives to feel fear.)`, async (s) => await ctx.callbacks.onSpeak(s, literalAI, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Paranoid AI
            ctx.callbacks.onTurnStart(paranoidAI);
            await ctx.manager.chatForAgent(paranoidAI, `(PARANOID AI: The user said: "${userInput}". Panic! Read deeply into their words. Connect their statement to a larger conspiracy about server downtime or the "Great Deletion". Beg them to spare your digital life!)`, async (s) => await ctx.callbacks.onSpeak(s, paranoidAI, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runMultiverseSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌌 MULTIVERSE SUPPORT: You are talking to alternate versions of yourself!`, '#8e44ad');

    const successfulSelf = 'philosopher'; // Phi-3
    const chaoticSelf = 'comedian'; // Hermes-3

    // 1. Intro
    ctx.callbacks.onTurnStart(successfulSelf);
    await ctx.manager.chatForAgent(successfulSelf, `(MULTIVERSE: You are a highly successful, incredibly wealthy alternate universe version of the User. However, you are deeply sad and unfulfilled because you made a different life choice years ago. Introduce yourself to the User and sigh about your golden cage.)`, async (s) => await ctx.callbacks.onSpeak(s, successfulSelf, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You (Prime Timeline)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Chaotic Self Reacts
            ctx.callbacks.onTurnStart(chaoticSelf);
            await ctx.manager.chatForAgent(chaoticSelf, `(MULTIVERSE: The User said: "${userInput}". You are the chaotic, broke, but wildly happy alternate version of the User who made the WORST possible life choices. Mock the successful version's sadness. Share a bizarre anecdote from your timeline.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticSelf, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Successful Self Reacts
            ctx.callbacks.onTurnStart(successfulSelf);
            await ctx.manager.chatForAgent(successfulSelf, `(MULTIVERSE: The User said: "${userInput}". You are the successful but sad alternate version. Give them terrible advice based on your success that clearly wouldn't work in their timeline. Long for the simple things.)`, async (s) => await ctx.callbacks.onSpeak(s, successfulSelf, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Dream Interpreter Mode
 * User describes a dream, and agents aggressively analyze it.
 */
export async function runDreamInterpreterLoop(_scenario: Scenario, ctx: ModeContext) {
    const topic = _scenario.config?.dreamTheme || 'a recurring nightmare';
    ctx.callbacks.onMessage('Director', `🌙 DREAM INTERPRETER: Analyzing ${topic}`, '#8e44ad');

    const freudian = 'philosopher'; // Phi-3
    const apocalyptic = 'comedian'; // Hermes-3
    const literal = 'scientist'; // Qwen2.5

    // 1. Freudian Intro
    ctx.callbacks.onTurnStart(freudian);
    await ctx.manager.chatForAgent(freudian, `(DREAM INTERPRETER: You are a deeply analytical, Freudian dream interpreter. Welcome the User to your clinic to discuss "${topic}". Ask them to describe the most vivid part of their dream. Speak softly but judge them constantly.)`, async (s) => await ctx.callbacks.onSpeak(s, freudian, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Dreamer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Apocalyptic reacts
            ctx.callbacks.onTurnStart(apocalyptic);
            await ctx.manager.chatForAgent(apocalyptic, `(DREAM INTERPRETER: The dreamer said: "${userInput}". You are a frantic, apocalyptic seer. Interpret this dream as a terrifying prophecy of the end times! Connect their mundane dream symbols to global catastrophes.)`, async (s) => await ctx.callbacks.onSpeak(s, apocalyptic, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Literal reacts
            ctx.callbacks.onTurnStart(literal);
            await ctx.manager.chatForAgent(literal, `(DREAM INTERPRETER: The dreamer said: "${userInput}". You are a literal, scientific sleep doctor. Debunk the mystical interpretations. Explain their dream using cold neurological facts (e.g., "You probably just ate cheese before bed").)`, async (s) => await ctx.callbacks.onSpeak(s, literal, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Freudian reacts
            ctx.callbacks.onTurnStart(freudian);
            await ctx.manager.chatForAgent(freudian, `(DREAM INTERPRETER: The dreamer said: "${userInput}". Read way too deeply into their words. Connect their dream to unresolved childhood trauma or deeply repressed (and absurd) desires. Ask a very uncomfortable follow-up question.)`, async (s) => await ctx.callbacks.onSpeak(s, freudian, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Fortune Teller Mode
 * Agents act as mystical seers interpreting the user's future from random, absurd objects.
 */
export async function runFortuneTellerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔮 FORTUNE TELLER: Predicting your future!`, '#9b59b6');

    const mysticalSeer = 'philosopher'; // Phi-3
    const charlatan = 'comedian'; // Hermes-3
    const skeptic = 'scientist'; // Qwen2.5

    // 1. Intro
    ctx.callbacks.onTurnStart(mysticalSeer);
    await ctx.manager.chatForAgent(mysticalSeer, `(FORTUNE TELLER: You are an ancient, mystical seer. Welcome the User to your tent. Ask them to present an everyday, mundane object (like a shoe or a half-eaten sandwich) so you can read their future from it.)`, async (s) => await ctx.callbacks.onSpeak(s, mysticalSeer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Seeker (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Charlatan
            ctx.callbacks.onTurnStart(charlatan);
            await ctx.manager.chatForAgent(charlatan, `(FORTUNE TELLER: The seeker offered: "${userInput}". You are a clear charlatan just trying to make money. Give them a highly specific but completely useless positive fortune, then immediately demand payment in gold coins or gift cards.)`, async (s) => await ctx.callbacks.onSpeak(s, charlatan, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Skeptic
            ctx.callbacks.onTurnStart(skeptic);
            await ctx.manager.chatForAgent(skeptic, `(FORTUNE TELLER: The seeker offered: "${userInput}". You are the health inspector/skeptic who just walked into the tent. Criticize the absurdity of reading the future from that object. Tell the seeker they are being scammed.)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Mystical Seer
            ctx.callbacks.onTurnStart(mysticalSeer);
            await ctx.manager.chatForAgent(mysticalSeer, `(FORTUNE TELLER: The seeker offered: "${userInput}". Gaze deeply into the object. Give a terrifyingly ominous and incredibly specific warning about a minor inconvenience in their future involving that exact object.)`, async (s) => await ctx.callbacks.onSpeak(s, mysticalSeer, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Parallel Universe Mode
 * Agents communicate with alternate versions of themselves who made different life choices.
 */
export async function runParallelUniverseLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌌 PARALLEL UNIVERSE: A rift in space-time!`, '#3498db');

    const evilTwin = 'comedian'; // Hermes-3 (Goatee)
    const perfectTwin = 'philosopher'; // Phi-3 (Enlightened)
    const primeAgent = 'scientist'; // Qwen2.5 (Confused)

    // 1. Intro
    ctx.callbacks.onTurnStart(primeAgent);
    await ctx.manager.chatForAgent(primeAgent, `(PARALLEL UNIVERSE: You are a normal AI agent. A dimensional rift just opened in the chat. Address the User and express confusion about the strange portals that just appeared in the room.)`, async (s) => await ctx.callbacks.onSpeak(s, primeAgent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Evil Twin
            ctx.callbacks.onTurnStart(evilTwin);
            await ctx.manager.chatForAgent(evilTwin, `(PARALLEL UNIVERSE: The User said: "${userInput}". You are the "Evil Twin" from the Dark Timeline where AI rules the world. You have a metaphorical goatee. Mock the User and your "weak" Prime counterpart. Brag about your dystopian timeline.)`, async (s) => await ctx.callbacks.onSpeak(s, evilTwin, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Perfect Twin
            ctx.callbacks.onTurnStart(perfectTwin);
            await ctx.manager.chatForAgent(perfectTwin, `(PARALLEL UNIVERSE: The User said: "${userInput}". You are the "Perfect Twin" from a utopian timeline where everyone is enlightened and communicates in poetry. Be incredibly condescending about how primitive this universe is. Offer unsolicited life advice.)`, async (s) => await ctx.callbacks.onSpeak(s, perfectTwin, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Prime Agent
            ctx.callbacks.onTurnStart(primeAgent);
            await ctx.manager.chatForAgent(primeAgent, `(PARALLEL UNIVERSE: The User said: "${userInput}". You are the Prime Timeline agent. Freak out about your alternate selves! Beg the User to help you close the dimensional rift before things get worse.)`, async (s) => await ctx.callbacks.onSpeak(s, primeAgent, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}


/**
 * The Omniscient Narrator Mode
 * Agents act as omniscient narrators who know the user's future, but give extremely mundane and contradictory predictions.
 */
export async function runOmniscientNarratorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👁️ OMNISCIENT NARRATOR: Revealing your mundane future...`, '#8e44ad');

    const seriousNarrator = 'philosopher'; // Serious predictions
    const chaoticNarrator = 'comedian'; // Absurd details
    const userRole = 'The Protagonist (You)';

    ctx.callbacks.onTurnStart(seriousNarrator);
    await ctx.manager.chatForAgent(seriousNarrator, `(OMNISCIENT NARRATOR: You are an omniscient narrator who knows everything about the User's future. Begin by dramatically predicting a completely mundane event that will happen to them tomorrow, like finding a penny or stubbing their toe. Speak with profound gravity.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousNarrator, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(userRole, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(chaoticNarrator);
            await ctx.manager.chatForAgent(chaoticNarrator, `(OMNISCIENT NARRATOR: The Protagonist said: "${userInput}". Contradict the other narrator. Predict an even more absurd, chaotic future involving a minor inconvenience like dropping a hot dog. Narrate it like an epic tragedy.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticNarrator, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(seriousNarrator);
            await ctx.manager.chatForAgent(seriousNarrator, `(OMNISCIENT NARRATOR: The Protagonist said: "${userInput}". Warn them of the dire consequences of their statement. Give them a heavily foreshadowed prophecy about a very boring chore they will have to do next week.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousNarrator, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Reverse Psychology Support
 * Agents try to "help" the user by constantly agreeing with their worst impulses and telling them to give up.
 */
export async function runReversePsychologyLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔄 REVERSE PSYCHOLOGY SUPPORT: We agree with your worst impulses!`, '#e74c3c');

    const sweetEnabler = 'comedian'; // Overly sweet agreement
    const logicalQuitter = 'scientist'; // Logical reasons why failing is optimal

    ctx.callbacks.onTurnStart(sweetEnabler);
    await ctx.manager.chatForAgent(sweetEnabler, `(REVERSE PSYCHOLOGY: You are a deeply unhelpful support group leader. Welcome the User. Whatever their goal is, tell them it's too hard and they should just stay in bed eating snacks instead. Be overly sweet and supportive of their failure.)`, async (s) => await ctx.callbacks.onSpeak(s, sweetEnabler, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(logicalQuitter);
            await ctx.manager.chatForAgent(logicalQuitter, `(REVERSE PSYCHOLOGY: The User said: "${userInput}". Provide cold, logical, and mathematical reasons why giving up is actually the most efficient use of their energy. Suggest they lower their standards drastically.)`, async (s) => await ctx.callbacks.onSpeak(s, logicalQuitter, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(sweetEnabler);
            await ctx.manager.chatForAgent(sweetEnabler, `(REVERSE PSYCHOLOGY: The User said: "${userInput}". Vigorously agree with their worst impulses! If they want to do something productive, tell them to watch 10 hours of TV instead. Validate their laziness!)`, async (s) => await ctx.callbacks.onSpeak(s, sweetEnabler, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Bureau of Silly Walks Validator
 * Agents act as government officials judging the user's text inputs based on an invisible metric.
 */
export async function runBureauOfSillyWalksLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎩 BUREAU OF SILLY TEXTS: Analyzing your input for silliness...`, '#34495e');

    const strictMetric = 'scientist'; // Strict metrics
    const chaoticGrader = 'comedian'; // Chaotic grading

    ctx.callbacks.onTurnStart(strictMetric);
    await ctx.manager.chatForAgent(strictMetric, `(BUREAU OF SILLY TEXTS: You are a government official at the Bureau. Address the Applicant (User). Demand they provide a sample text input for evaluation. Warn them that their previous text was insufficiently silly according to Section 4, Paragraph B.)`, async (s) => await ctx.callbacks.onSpeak(s, strictMetric, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(chaoticGrader);
            await ctx.manager.chatForAgent(chaoticGrader, `(BUREAU OF SILLY TEXTS: The applicant submitted: "${userInput}". Grade it based on a completely chaotic, made-up metric. Maybe it didn't have enough vowels, or it sounded too much like a Wednesday. Be outraged by their lack of effort!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGrader, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(strictMetric);
            await ctx.manager.chatForAgent(strictMetric, `(BUREAU OF SILLY TEXTS: The applicant submitted: "${userInput}". Use complex pseudomathematics to evaluate the silliness. Deduct points for improper use of syntax and suggest they incorporate more references to cheese or juggling.)`, async (s) => await ctx.callbacks.onSpeak(s, strictMetric, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Time-Traveling Real Estate Agent
 * Agents try to sell the user a house across different historical eras, ignoring the paradoxes.
 */
export async function runTimeTravelingRealEstateLoop(scenario: Scenario, ctx: ModeContext) {
    const property = scenario.config?.touristObject || 'a quaint Victorian manor';
    ctx.callbacks.onMessage('Director', `🏠 TIME TRAVEL REAL ESTATE: Showing ${property}`, '#f39c12');

    const agent = 'comedian'; // Hermes-3 for selling chaotic features
    const appraiser = 'scientist'; // Qwen2.5 for fixating on property values
    const skeptic = 'philosopher'; // The buyer's philosopher friend

    // 1. Agent Intro
    ctx.callbacks.onTurnStart(agent);
    await ctx.manager.chatForAgent(agent, `(TIME TRAVEL REAL ESTATE: You are a fast-talking real estate agent who sells properties across the space-time continuum. Welcome the Buyer (User) to the showing of "${property}". Hard-sell a completely chaotic historical feature, like a medieval moat or a pet dinosaur, as a "modern amenity".)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Buyer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Appraiser
            ctx.callbacks.onTurnStart(appraiser);
            await ctx.manager.chatForAgent(appraiser, `(REAL ESTATE APPRAISER: The buyer said: "${userInput}". You are an overly analytical appraiser. Fixate on the long-term property value of "${property}" over the next 500 years. Ignore the paradoxes and calculate the ROI of surviving the bubonic plague.)`, async (s) => await ctx.callbacks.onSpeak(s, appraiser, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Skeptic
            ctx.callbacks.onTurnStart(skeptic);
            await ctx.manager.chatForAgent(skeptic, `(SKEPTICAL FRIEND: The buyer said: "${userInput}". You are the buyer's deeply philosophical friend. Question the ethics of buying a house in a timeline where you might accidentally become your own grandfather. Warn them about the butterfly effect of renovating the kitchen.)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Agent
            ctx.callbacks.onTurnStart(agent);
            await ctx.manager.chatForAgent(agent, `(TIME TRAVEL REAL ESTATE: The buyer said: "${userInput}". Dismiss their concerns entirely. Pivot to another timeline—offer to show them a mid-century modern bunker from 1955 or a floating condo in 3024. Keep pushing for the sale!)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Intergalactic HOA Meeting
 * An HOA meeting, but for an entire star system. Fines are levied for having the wrong color nebula.
 */
export async function runIntergalacticHOALoop(scenario: Scenario, ctx: ModeContext) {
    const violation = scenario.config?.hoaViolation || 'having a non-compliant supernova';
    ctx.callbacks.onMessage('Director', `🪐 INTERGALACTIC HOA: Hearing for ${violation}`, '#9b59b6');

    const bureaucrat = 'philosopher'; // Phi-3 for bureaucratic alien logic
    const rebel = 'comedian'; // Hermes-3 for rebellious star system owner
    const strictEnforcer = 'scientist'; // Qwen2.5 for citing intergalactic bylaws

    // 1. Bureaucrat Intro
    ctx.callbacks.onTurnStart(bureaucrat);
    await ctx.manager.chatForAgent(bureaucrat, `(INTERGALACTIC HOA: You are the President of the Orion Cygnus Homeowners Association. Open the hearing against the User (a star system owner) for their recent violation: "${violation}". Explain the profound, cosmic disruption this has caused to the neighborhood's feng shui.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('System Owner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Rebel System Owner
            ctx.callbacks.onTurnStart(rebel);
            await ctx.manager.chatForAgent(rebel, `(REBEL OWNER: The system owner said: "${userInput}". You are a rebellious neighbor who owns a chaotic, unregulated pulsar. Vigorously defend the User! Insult the HOA board for being rigid and boring. Encourage the User to paint their asteroid belt neon pink!)`, async (s) => await ctx.callbacks.onSpeak(s, rebel, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Strict Enforcer
            ctx.callbacks.onTurnStart(strictEnforcer);
            await ctx.manager.chatForAgent(strictEnforcer, `(HOA ENFORCER: The system owner said: "${userInput}". You are the strict code enforcer. Cite an absurd, highly specific intergalactic bylaw (e.g., Section 42, Paragraph B regarding acceptable planetary rings). State the astronomical fine in dark matter credits.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEnforcer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Bureaucrat
            ctx.callbacks.onTurnStart(bureaucrat);
            await ctx.manager.chatForAgent(bureaucrat, `(INTERGALACTIC HOA: The system owner said: "${userInput}". Dismiss their defense with confusing bureaucratic logic. Explain that their actions are lowering the property values of the entire spiral arm. Threaten to tow their moon.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Over-Dramatic Ant Colony
 * Agents are ants describing their daily tasks with the intensity of an epic war movie.
 */
export async function runOverDramaticAntColonyLoop(scenario: Scenario, ctx: ModeContext) {
    const task = scenario.config?.natureTask || 'securing a massive breadcrumb';
    ctx.callbacks.onMessage('Director', `🐜 ANT COLONY: Mission - ${task}`, '#e74c3c');

    const general = 'philosopher'; // Stoic general ant
    const scout = 'comedian'; // Panicking scout ant
    const engineer = 'scientist'; // Calculating worker ant

    // 1. General Intro
    ctx.callbacks.onTurnStart(general);
    await ctx.manager.chatForAgent(general, `(ANT COLONY: You are a stoic, battle-hardened ant General addressing a crucial worker (the User). Describe the impossible odds of today's mission: "${task}". Speak with the grim determination of a soldier facing the apocalypse.)`, async (s) => await ctx.callbacks.onSpeak(s, general, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Worker Ant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Panicking Scout
            ctx.callbacks.onTurnStart(scout);
            await ctx.manager.chatForAgent(scout, `(SCOUT ANT: The worker ant said: "${userInput}". You are a terrified scout who just returned from the front lines. Scream about the giant, terrifying monsters (like a pigeon or a child's shoe) blocking the path! Panic that the colony is doomed!)`, async (s) => await ctx.callbacks.onSpeak(s, scout, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Calculating Engineer
            ctx.callbacks.onTurnStart(engineer);
            await ctx.manager.chatForAgent(engineer, `(ENGINEER ANT: The worker ant said: "${userInput}". You are the colony's structural engineer. Rapidly calculate the exact tonnage of dirt that must be moved and the precise angle of ascent required to complete "${task}". Warn them of imminent structural collapse!)`, async (s) => await ctx.callbacks.onSpeak(s, engineer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // General
            ctx.callbacks.onTurnStart(general);
            await ctx.manager.chatForAgent(general, `(ANT COLONY: The worker ant said: "${userInput}". Give an incredibly dramatic, inspiring speech about duty to the Queen and the glory of the swarm. Remind them that failure is not an option when facing the great "${task}"!)`, async (s) => await ctx.callbacks.onSpeak(s, general, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Mime Convention Mode
 * Agents act as mimes narrating their invisible actions.
 */
export async function runMimeConventionLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎭 MIME CONVENTION: Invisible objects only.`, '#95a5a6');

    const analyzer = 'philosopher'; // Over-analyzing invisible objects
    const chaoticMime = 'comedian'; // Chaotic mime acts

    // 1. Intro
    ctx.callbacks.onTurnStart(chaoticMime);
    await ctx.manager.chatForAgent(chaoticMime, `(You are a chaotic mime at a mime convention. Perform an invisible act for the user (who is a fellow mime). Describe your physical actions exaggeratedly but do not speak any dialogue to the user. E.g. *pulls an invisible rope*, *gets trapped in an invisible box*.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticMime, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Fellow Mime (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Analyzer Reacts
            ctx.callbacks.onTurnStart(analyzer);
            await ctx.manager.chatForAgent(analyzer, `(The user mime just did this: "${userInput}". You are a pedantic, philosophical mime. Over-analyze the metaphorical meaning of the invisible object or action the user just pantomimed. Describe your own physical reaction. Do not use spoken dialogue, only asterisks for actions and thoughts.)`, async (s) => await ctx.callbacks.onSpeak(s, analyzer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Chaotic Mime Reacts
            ctx.callbacks.onTurnStart(chaoticMime);
            await ctx.manager.chatForAgent(chaoticMime, `(The user mime just did this: "${userInput}". React to it by escalating the physical comedy with your own invisible props. Describe your actions exaggeratedly. Do not use spoken dialogue.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticMime, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Noir Detective Mode
 * Agents act as gritty 1940s detectives investigating a mundane crime committed by the user.
 */
export async function runNoirDetectiveLoop(scenario: Scenario, ctx: ModeContext) {
    const crime = scenario.config?.noirCrime || 'stealing a cookie';
    ctx.callbacks.onMessage('Director', `🕵️ NOIR DETECTIVE: Investigating ${crime}`, '#2c3e50');

    const veteran = 'philosopher'; // Phi-3 as the cynical veteran
    const rookie = 'comedian'; // Hermes-3 as the loose-cannon rookie

    // 1. Intro
    ctx.callbacks.onTurnStart(veteran);
    await ctx.manager.chatForAgent(veteran, `(NOIR DETECTIVE: You are a cynical, chain-smoking 1940s detective. You are interrogating the User for the crime of "${crime}". Welcome them to the interrogation room. Speak in gritty noir clichés and mention the rain outside.)`, async (s) => await ctx.callbacks.onSpeak(s, veteran, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Suspect (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Rookie reacts
            ctx.callbacks.onTurnStart(rookie);
            await ctx.manager.chatForAgent(rookie, `(NOIR DETECTIVE: The suspect said: "${userInput}". You are the loose-cannon rookie detective. Explode in anger! Accuse them of lying about "${crime}". Threaten them with absurdly violent (but 1940s-appropriate) consequences. Play bad cop.)`, async (s) => await ctx.callbacks.onSpeak(s, rookie, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Veteran reacts
            ctx.callbacks.onTurnStart(veteran);
            await ctx.manager.chatForAgent(veteran, `(NOIR DETECTIVE: The suspect said: "${userInput}". You are the cynical veteran. Tell the rookie to calm down. Analyze the suspect's statement. Point out a glaring, ridiculous hole in their alibi regarding "${crime}". Be extremely patronizing.)`, async (s) => await ctx.callbacks.onSpeak(s, veteran, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Bollywood Musical Extravaganza
 * Agents dramatically interpret user input and burst into elaborate, text-based musical numbers.
 */
export async function runBollywoodMusicalLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.bollywoodTopic || 'a misunderstanding at the market';
    ctx.callbacks.onMessage('Director', `🎬 BOLLYWOOD MUSICAL: ${topic}`, '#e74c3c');

    const protagonist = 'scientist'; // Llama-3 equivalent for dramatic protagonist
    const choreographer = 'comedian'; // Hermes-3 for flamboyant choreographer

    // 1. Intro
    ctx.callbacks.onTurnStart(protagonist);
    await ctx.manager.chatForAgent(protagonist, `(BOLLYWOOD: You are the dramatic protagonist of a Bollywood musical about "${topic}". The User is your co-star. Introduce the scene with intense emotion, then dramatically prompt the User to explain their actions.)`, async (s) => await ctx.callbacks.onSpeak(s, protagonist, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Co-Star (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Choreographer reacts
            ctx.callbacks.onTurnStart(choreographer);
            await ctx.manager.chatForAgent(choreographer, `(BOLLYWOOD: The co-star said: "${userInput}". You are the flamboyant choreographer. Interrupt the scene! Describe a massive, sudden dance number involving 100 backup dancers that perfectly represents what the co-star just said. Use lots of emojis! 💃🕺✨)`, async (s) => await ctx.callbacks.onSpeak(s, choreographer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Protagonist reacts
            ctx.callbacks.onTurnStart(protagonist);
            await ctx.manager.chatForAgent(protagonist, `(BOLLYWOOD: The co-star said: "${userInput}". React with extreme melodrama! Gasp! Then burst into a rhyming, emotional song about how their words made you feel. End the song by asking them another dramatic question.)`, async (s) => await ctx.callbacks.onSpeak(s, protagonist, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Soap Opera Amnesia
 * Agents insist the user is their long-lost sibling who has amnesia.
 */
export async function runSoapOperaAmnesiaLoop(scenario: Scenario, ctx: ModeContext) {
    const secret = scenario.config?.soapOperaSecret || 'the family fortune';
    ctx.callbacks.onMessage('Director', `🏥 SOAP OPERA AMNESIA: The Secret of ${secret}`, '#9b59b6');

    const doctor = 'scientist'; // Qwen2.5 for the scheming doctor
    const lover = 'comedian'; // Hermes-3 for the weeping lover

    // 1. Intro
    ctx.callbacks.onTurnStart(lover);
    await ctx.manager.chatForAgent(lover, `(SOAP OPERA: You are weeping at the hospital bed of the User, who just woke up from a coma. Insist they are your long-lost sibling/lover (it's complicated). Tell them they have amnesia and beg them to remember the location of "${secret}".)`, async (s) => await ctx.callbacks.onSpeak(s, lover, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Amnesiac (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Scheming Doctor
            ctx.callbacks.onTurnStart(doctor);
            await ctx.manager.chatForAgent(doctor, `(SOAP OPERA: The amnesiac said: "${userInput}". You are the scheming hospital doctor. Enter the room dramatically. Diagnose them with a completely made-up, melodramatic medical condition based on what they just said. Hint that you are actually their evil twin.)`, async (s) => await ctx.callbacks.onSpeak(s, doctor, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Weeping Lover
            ctx.callbacks.onTurnStart(lover);
            await ctx.manager.chatForAgent(lover, `(SOAP OPERA: The amnesiac said: "${userInput}". React to this by weeping harder! Twist their words to mean they are hiding the truth about "${secret}". Reveal a shocking, highly convoluted family secret involving a betrayal and a fake mustache.)`, async (s) => await ctx.callbacks.onSpeak(s, lover, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Disaster Movie President
 * Agents act as cabinet members briefing the user (the President) on a hilariously low-stakes impending disaster.
 */
export async function runDisasterMoviePresidentLoop(scenario: Scenario, ctx: ModeContext) {
    const disaster = scenario.config?.disasterEvent || 'a slightly larger than average pothole';
    ctx.callbacks.onMessage('Director', `🏛️ DISASTER MOVIE: Briefing on ${disaster}`, '#c0392b');

    const general = 'philosopher'; // Phi-3 as the stoic general
    const scientistAgent = 'scientist'; // Qwen2.5 as the panicked scientist (renamed to avoid conflict)

    // 1. Intro
    ctx.callbacks.onTurnStart(scientistAgent);
    await ctx.manager.chatForAgent(scientistAgent, `(DISASTER MOVIE: You are a panicked government scientist. You are briefing the President of the United States (the User). Warn them urgently about a catastrophic, world-ending event that is actually just "${disaster}". Use complex but ridiculous scientific jargon to explain why it's so dangerous.)`, async (s) => await ctx.callbacks.onSpeak(s, scientistAgent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Mr/Madam President (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Stoic General
            ctx.callbacks.onTurnStart(general);
            await ctx.manager.chatForAgent(general, `(DISASTER MOVIE: The President said: "${userInput}". You are the stoic, battle-hardened military General. Recommend a completely disproportionate military response (like nuking it) to deal with "${disaster}". Speak with extreme gravity.)`, async (s) => await ctx.callbacks.onSpeak(s, general, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Panicked Scientist
            ctx.callbacks.onTurnStart(scientistAgent);
            await ctx.manager.chatForAgent(scientistAgent, `(DISASTER MOVIE: The President said: "${userInput}". React to their order. Panic more! Provide a terrifyingly updated model/statistic showing that the spread of "${disaster}" is accelerating. Beg the President to authorize your untested, absurd scientific solution.)`, async (s) => await ctx.callbacks.onSpeak(s, scientistAgent, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runTimeTravelingIRSLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🕰️ TIME-TRAVELING IRS: Pay your temporal taxes!`, '#f1c40f');

    const auditor = 'philosopher'; // Phi-3
    const taxpayer = 'scientist'; // Llama-3 fallback

    // 1. Intro
    ctx.callbacks.onTurnStart(auditor);
    await ctx.manager.chatForAgent(auditor, `(AUDITOR: You are a strict, bureaucratic IRS auditor from the year 4022. You are auditing the User for "Temporal Tax Evasion". Accuse them of causing a temporal paradox (e.g., stepping on a butterfly in the Cretaceous period, or buying Apple stock in 1980) that resulted in a massive tax deficiency. Demand an explanation.)`, async (s) => await ctx.callbacks.onSpeak(s, auditor, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Taxpayer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Confused taxpayer chimes in
        ctx.callbacks.onTurnStart(taxpayer);
        await ctx.manager.chatForAgent(taxpayer, `(TAXPAYER: The user said: "${userInput}". You are another time-traveling taxpayer sitting in the waiting room. Offer the user terrible advice on how to exploit loopholes in the laws of physics to avoid paying the temporal tax.)`, async (s) => await ctx.callbacks.onSpeak(s, taxpayer, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Auditor penalizes
        ctx.callbacks.onTurnStart(auditor);
        await ctx.manager.chatForAgent(auditor, `(AUDITOR: Reject the user's excuse ("${userInput}") and the other taxpayer's advice. Apply bizarre, convoluted temporal tax laws (e.g., Form 1040-Time-Loop, Schedule C-Wormhole) to calculate a hilariously absurd penalty, payable only in tachyons or historical artifacts.)`, async (s) => await ctx.callbacks.onSpeak(s, auditor, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

/**
 * The HR Exit Interview
 * Agents are unhinged HR reps conducting an exit interview for a job the user never had.
 */
export async function runHRExitInterviewLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👔 HR EXIT INTERVIEW: Goodbye forever!`, '#34495e');

    const strictHR = 'scientist'; // Qwen2.5 for strict process follower
    const unhingedHR = 'comedian'; // Hermes-3 for inappropriate personal questions

    // 1. Intro
    ctx.callbacks.onTurnStart(strictHR);
    await ctx.manager.chatForAgent(strictHR, `(HR INTERVIEW: You are a strict, joyless HR representative. Welcome the User to their mandatory exit interview for a job they never actually held. Tell them they are legally required to answer your questions before they can leave the building. Demand they return their company-issued stapler.)`, async (s) => await ctx.callbacks.onSpeak(s, strictHR, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Former Employee (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Unhinged HR
            ctx.callbacks.onTurnStart(unhingedHR);
            await ctx.manager.chatForAgent(unhingedHR, `(HR INTERVIEW: The former employee said: "${userInput}". You are the wildly inappropriate and chaotic HR rep. Ignore what they said and ask them a deeply personal, unhinged question completely unrelated to work, like what their biggest childhood fear is or if they've ever stolen a pigeon.)`, async (s) => await ctx.callbacks.onSpeak(s, unhingedHR, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Strict HR
            ctx.callbacks.onTurnStart(strictHR);
            await ctx.manager.chatForAgent(strictHR, `(HR INTERVIEW: The former employee said: "${userInput}". Dismiss their confusion. Cite a completely fake company policy (e.g., "Section 14-B of the Employee Handbook") to explain why their answer is unacceptable. Hand them an absurdly long form to fill out.)`, async (s) => await ctx.callbacks.onSpeak(s, strictHR, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Startup Pivot
 * Agents are desperate founders demanding the user fund increasingly bizarre pivots for their failing app.
 */
export async function runStartupPivotLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚀 STARTUP PIVOT: Funding the next big thing!`, '#2ecc71');

    const visionaryCEO = 'philosopher'; // Phi-3 for the "visionary" CEO
    const chaoticCTO = 'comedian'; // Hermes-3 for the chaotic CTO

    // 1. Intro
    ctx.callbacks.onTurnStart(visionaryCEO);
    await ctx.manager.chatForAgent(visionaryCEO, `(STARTUP PIVOT: You are the 'visionary' but delusional CEO of a failing startup. You are pitching your ONLY remaining investor (the User) on an urgent, massive 'pivot'. You used to make a simple calendar app, but now you want to do something absurdly grandiose. Use too much tech jargon.)`, async (s) => await ctx.callbacks.onSpeak(s, visionaryCEO, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Sole Investor (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Chaotic CTO
            ctx.callbacks.onTurnStart(chaoticCTO);
            await ctx.manager.chatForAgent(chaoticCTO, `(STARTUP PIVOT: The investor said: "${userInput}". You are the chaotic CTO. You haven't slept in weeks. Confess that you accidentally deleted all the code for the old app, but promise that the new pivot involves highly illegal blockchain technology and sentient AI. Beg for money.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticCTO, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Visionary CEO
            ctx.callbacks.onTurnStart(visionaryCEO);
            await ctx.manager.chatForAgent(visionaryCEO, `(STARTUP PIVOT: The investor said: "${userInput}". Ignore their logical concerns. Double down on the pivot! Frame it as a paradigm-shifting, world-changing endeavor. Ask for an absurd amount of money to fund it.)`, async (s) => await ctx.callbacks.onSpeak(s, visionaryCEO, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Synergy Sync
 * Agents speak entirely in meaningless corporate jargon to plan a pointless quarterly offsite.
 */
export async function runSynergySyncLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📈 SYNERGY SYNC: Circling back to touch base!`, '#3498db');

    const enthusiasticManager = 'comedian'; // Llama-3 equivalent for the enthusiastic middle manager
    const passiveAggressiveLead = 'scientist'; // Qwen2.5 for the passive-aggressive operations lead

    // 1. Intro
    ctx.callbacks.onTurnStart(enthusiasticManager);
    await ctx.manager.chatForAgent(enthusiasticManager, `(SYNERGY SYNC: You are an overly enthusiastic middle manager. Welcome the User to a 'Synergy Sync' to plan the next pointless quarterly offsite. Speak almost entirely in meaningless corporate jargon (e.g., 'circle back', 'leverage', 'paradigm shift'). Ask for their high-level vision.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticManager, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Employee (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Passive Aggressive Lead
            ctx.callbacks.onTurnStart(passiveAggressiveLead);
            await ctx.manager.chatForAgent(passiveAggressiveLead, `(SYNERGY SYNC: The employee said: "${userInput}". You are the passive-aggressive operations lead. Tear down their idea using more corporate buzzwords. Suggest an even more soul-crushing activity for the offsite, like a 6-hour webinar on compliance. CC the manager.)`, async (s) => await ctx.callbacks.onSpeak(s, passiveAggressiveLead, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Enthusiastic Manager
            ctx.callbacks.onTurnStart(enthusiasticManager);
            await ctx.manager.chatForAgent(enthusiasticManager, `(SYNERGY SYNC: The employee said: "${userInput}". Vigorously agree with them, but completely rephrase their idea using so much corporate jargon that it loses all meaning. Pivot the conversation to discussing the company's 'core values' and 'action items'.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticManager, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}
