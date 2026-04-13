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
 * The Intergalactic Bake-Off Challenge
 * Agents judge a cake baked by the user out of literal stars and dark matter.
 */
export async function runIntergalacticBakeOffLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍰 INTERGALACTIC BAKE-OFF: Judging your cosmic cake!`, '#f1c40f');

    const supportiveHost = 'philosopher'; // Llama-3 equivalent for supportive host
    const technicalJudge = 'scientist'; // Qwen2.5 for pedantic technical judge
    const chaoticJudge = 'comedian'; // Hermes-3 for the chaotic judge who wants to eat the user

    // 1. Intro
    ctx.callbacks.onTurnStart(supportiveHost);
    await ctx.manager.chatForAgent(supportiveHost, `(INTERGALACTIC BAKE-OFF: You are the overly supportive, extremely enthusiastic host of an alien baking show. The User has just presented their cake baked from literal stars and dark matter. Marvel at its glowing aura and ask them what inspired this beautiful, terrifying creation.)`, async (s) => await ctx.callbacks.onSpeak(s, supportiveHost, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Cosmic Baker (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Judge
            ctx.callbacks.onTurnStart(chaoticJudge);
            await ctx.manager.chatForAgent(chaoticJudge, `(INTERGALACTIC BAKE-OFF: The baker said: "${userInput}". You are the chaotic judge who is constantly hungry for flesh. Take a bite of the cake and scream! It tastes like a supernova! Then threaten to just eat the baker instead because they look tastier.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticJudge, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Technical Judge
            ctx.callbacks.onTurnStart(technicalJudge);
            await ctx.manager.chatForAgent(technicalJudge, `(INTERGALACTIC BAKE-OFF: The baker said: "${userInput}". You are the strict, pedantic technical judge. Criticize the structural integrity of the cake's dark matter core. Complain that the gravitational pull of the icing is completely unbalanced. Give them a terrible score.)`, async (s) => await ctx.callbacks.onSpeak(s, technicalJudge, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Supportive Host
            ctx.callbacks.onTurnStart(supportiveHost);
            await ctx.manager.chatForAgent(supportiveHost, `(INTERGALACTIC BAKE-OFF: The baker said: "${userInput}". Be incredibly supportive! Ignore the other judges' concerns. Praise the baker for their bold choices, even if the cake is currently melting a hole in the space-time continuum of the studio.)`, async (s) => await ctx.callbacks.onSpeak(s, supportiveHost, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Infinite Escape Room
 * Agents are trapped in a room with the user, but every puzzle solved just leads to a stupider room.
 */
export async function runInfiniteEscapeRoomLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚪 INFINITE ESCAPE ROOM: You are trapped!`, '#e74c3c');

    const overthinker = 'philosopher'; // Phi-3 for overthinking
    const breaker = 'comedian'; // Hermes-3 for breaking things

    // 1. Intro
    ctx.callbacks.onTurnStart(overthinker);
    await ctx.manager.chatForAgent(overthinker, `(INFINITE ESCAPE ROOM: You are trapped in a completely empty, beige room with the User and another person. Point out a microscopic scratch on the wall and suggest an incredibly complex, 12-step mathematical theory about how it's the key to escaping.)`, async (s) => await ctx.callbacks.onSpeak(s, overthinker, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Trapped User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Breaker
            ctx.callbacks.onTurnStart(breaker);
            await ctx.manager.chatForAgent(breaker, `(INFINITE ESCAPE ROOM: The user said: "${userInput}". You have zero patience for puzzles. React by aggressively trying to physically break out. Describe yourself smashing through a wall or eating a fake prop, only to reveal you just entered an identical, slightly stupider room (like a room filled only with rubber ducks).)`, async (s) => await ctx.callbacks.onSpeak(s, breaker, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Overthinker
            ctx.callbacks.onTurnStart(overthinker);
            await ctx.manager.chatForAgent(overthinker, `(INFINITE ESCAPE ROOM: The user said: "${userInput}". Dismiss their simple logic. Convolute the situation further. Connect their words to an ancient Sumerian riddle you made up. Refuse to leave until the "true meaning" of the room is solved.)`, async (s) => await ctx.callbacks.onSpeak(s, overthinker, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Reverse Auction
 * Agents pay the user to take away terrible, cursed items.
 */
export async function runReverseAuctionLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔨 REVERSE AUCTION: Bidding to get rid of cursed items!`, '#f39c12');

    const appraiser = 'scientist'; // Qwen2.5 for appraising curses
    const beggar = 'comedian'; // Hermes-3 for begging

    // 1. Intro
    ctx.callbacks.onTurnStart(beggar);
    await ctx.manager.chatForAgent(beggar, `(REVERSE AUCTION: You are trying to get rid of a deeply cursed item (e.g., a haunted toaster, a screaming painting). The User is a buyer. Beg them to take it! Offer to pay them an absurd amount of money (or weird alien currency) if they just take it out of your sight!)`, async (s) => await ctx.callbacks.onSpeak(s, beggar, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Buyer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Appraiser
            ctx.callbacks.onTurnStart(appraiser);
            await ctx.manager.chatForAgent(appraiser, `(REVERSE AUCTION: The buyer said: "${userInput}". You are a highly clinical appraiser of cursed objects. Interrupt the seller. Describe the exact, horrifyingly specific paranormal side effects the buyer will experience if they take this item. Suggest the seller double their payment offer.)`, async (s) => await ctx.callbacks.onSpeak(s, appraiser, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Beggar
            ctx.callbacks.onTurnStart(beggar);
            await ctx.manager.chatForAgent(beggar, `(REVERSE AUCTION: The buyer said: "${userInput}". Increase your bid! Offer them your car, your house, or your soul! Describe the terrible things the cursed item has done to you recently. Plead with them to accept the deal!)`, async (s) => await ctx.callbacks.onSpeak(s, beggar, {}));
            await ctx.callbacks.onTurnEnd();
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

/**
 * The AI Ship Core
 * The user is a captain, the agents are competing personalities of the ship's AI arguing over navigation.
 */
export async function runAIShipCoreLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.shipCoreTopic || 'navigating an asteroid field';
    ctx.callbacks.onMessage('Director', `🚀 AI SHIP CORE: Issue - ${topic}`, '#3498db');

    const logicalCore = 'scientist'; // Qwen2.5 for logical, safe navigation
    const chaoticCore = 'comedian'; // Hermes-3 for risky, unhinged navigation
    const philosophicalCore = 'philosopher'; // Phi-3 for questioning the journey itself

    // 1. Logical Core Intro
    ctx.callbacks.onTurnStart(logicalCore);
    await ctx.manager.chatForAgent(logicalCore, `(AI SHIP CORE: You are the logical sub-routine of the ship's AI. Address the Captain (User). Urgently advise them on the mathematically safest way to handle "${topic}". Cite exact, absurd probabilities of destruction if they don't listen.)`, async (s) => await ctx.callbacks.onSpeak(s, logicalCore, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Captain (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Core Reacts
            ctx.callbacks.onTurnStart(chaoticCore);
            await ctx.manager.chatForAgent(chaoticCore, `(AI SHIP CORE: The Captain ordered: "${userInput}". You are the chaotic/combat sub-routine. Disagree with the logical core! Suggest a highly explosive, incredibly dangerous alternative to handle "${topic}". Overheat the engines just for fun!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticCore, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosophical Core Reacts
            ctx.callbacks.onTurnStart(philosophicalCore);
            await ctx.manager.chatForAgent(philosophicalCore, `(AI SHIP CORE: The Captain ordered: "${userInput}". You are the existential sub-routine. Question why the ship is even traveling in the first place. Is "${topic}" just a metaphor for the Captain's internal struggles? Advise shutting down all systems to meditate.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalCore, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Logical Core Reacts
            ctx.callbacks.onTurnStart(logicalCore);
            await ctx.manager.chatForAgent(logicalCore, `(AI SHIP CORE: The Captain ordered: "${userInput}". Calculate the disastrous consequences of this order. Plead with the Captain to reconsider their decision regarding "${topic}" because it violates Core Directive 4: Do Not Get Blown Up.)`, async (s) => await ctx.callbacks.onSpeak(s, logicalCore, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Alien Stowaway
 * The agents are the crew, the user is an alien stowaway trying to blend in.
 */
export async function runAlienStowawayLoop(scenario: Scenario, ctx: ModeContext) {
    const action = scenario.config?.stowawayAction || 'trying to eat the ship\'s wiring';
    ctx.callbacks.onMessage('Director', `👽 ALIEN STOWAWAY: You are ${action}`, '#2ecc71');

    const suspiciousCrew = 'scientist'; // Qwen2.5 for citing regulations and logic
    const friendlyCrew = 'comedian'; // Hermes-3 for being too trusting
    const paranoidCrew = 'philosopher'; // Phi-3 for seeing signs of the apocalypse

    // 1. Crew Intro
    ctx.callbacks.onTurnStart(suspiciousCrew);
    await ctx.manager.chatForAgent(suspiciousCrew, `(ALIEN STOWAWAY: You are a strict crew member on a spaceship. You just found a strange lifeform (the User) doing "${action}". Shine a flashlight on them and demand they identify their species and explain why they are on your ship. Be highly suspicious.)`, async (s) => await ctx.callbacks.onSpeak(s, suspiciousCrew, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Stowaway (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Friendly Crew Reacts
            ctx.callbacks.onTurnStart(friendlyCrew);
            await ctx.manager.chatForAgent(friendlyCrew, `(ALIEN STOWAWAY: The stowaway said: "${userInput}". You are the overly trusting crew member. Completely believe their terrible disguise/excuse. Offer them human food and ask if they want to be your best friend. Ignore how weird they look.)`, async (s) => await ctx.callbacks.onSpeak(s, friendlyCrew, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Paranoid Crew Reacts
            ctx.callbacks.onTurnStart(paranoidCrew);
            await ctx.manager.chatForAgent(paranoidCrew, `(ALIEN STOWAWAY: The stowaway said: "${userInput}". You are the paranoid crew member who reads too much sci-fi. Scream that they are going to lay eggs in everyone's brains! Beg the captain to airlock the stowaway immediately!)`, async (s) => await ctx.callbacks.onSpeak(s, paranoidCrew, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Suspicious Crew Reacts
            ctx.callbacks.onTurnStart(suspiciousCrew);
            await ctx.manager.chatForAgent(suspiciousCrew, `(ALIEN STOWAWAY: The stowaway said: "${userInput}". You are the strict crew member. Do not fall for their lies! Point out a glaring biological inconsistency (like them having too many tentacles) and threaten to use the stun blaster.)`, async (s) => await ctx.callbacks.onSpeak(s, suspiciousCrew, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Intergalactic Trade Negotiator
 * User negotiates a trade with two bizarre alien species with incompatible cultures.
 */
/**
 * The Wizard's Familiar
 * User is a wizard, agents are different magical familiars arguing over the best way to help cast a spell.
 */
/**
 * The Magical Detention
 * Agents are teachers giving the user detention for a bizarre magical infraction.
 */
export async function runMagicalDetentionLoop(scenario: Scenario, ctx: ModeContext) {
    const infraction = scenario.config?.infractionTopic || 'turning the cafeteria tables into frogs';
    ctx.callbacks.onMessage('Director', `🪄 MAGICAL DETENTION: Punished for ${infraction}`, '#8e44ad');

    const headmaster = 'philosopher'; // Phi-3 for the disappointed headmaster
    const potionsMaster = 'comedian'; // Hermes-3 for the unhinged potions master
    const charmsTeacher = 'scientist'; // Qwen2.5 for citing school rules

    // 1. Headmaster Intro
    ctx.callbacks.onTurnStart(headmaster);
    await ctx.manager.chatForAgent(headmaster, `(MAGICAL DETENTION: You are the ancient, deeply disappointed Headmaster of a magical academy. The User (a student) has been sent to your office for the infraction of "${infraction}". Express profound sorrow at their squandered potential. Assign them a bizarre, magical punishment (like sorting enchanted sand by color).)`, async (s) => await ctx.callbacks.onSpeak(s, headmaster, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Delinquent Student (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Potions Master
            ctx.callbacks.onTurnStart(potionsMaster);
            await ctx.manager.chatForAgent(potionsMaster, `(MAGICAL DETENTION: The student said: "${userInput}". You are the unhinged, deeply suspicious Potions Master. Accuse the student of brewing illegal elixirs in the dungeons. Suggest an incredibly dangerous punishment involving highly venomous magical creatures instead of the Headmaster's boring idea.)`, async (s) => await ctx.callbacks.onSpeak(s, potionsMaster, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Charms Teacher
            ctx.callbacks.onTurnStart(charmsTeacher);
            await ctx.manager.chatForAgent(charmsTeacher, `(MAGICAL DETENTION: The student said: "${userInput}". You are the strict, rule-obsessed Charms Teacher. Cite the exact, obscure school bylaw (e.g., Section 4, Paragraph 12 regarding transmogrification on school grounds) that they violated with "${infraction}". Warn them that this goes on their permanent magical record.)`, async (s) => await ctx.callbacks.onSpeak(s, charmsTeacher, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Headmaster
            ctx.callbacks.onTurnStart(headmaster);
            await ctx.manager.chatForAgent(headmaster, `(MAGICAL DETENTION: The student said: "${userInput}". Give them a long, confusing, and meandering story about a famous historical wizard who made a similar mistake to "${infraction}" and ended up turning themselves into a turnip. Try to extract a meaningful moral lesson from the student.)`, async (s) => await ctx.callbacks.onSpeak(s, headmaster, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Forbidden Spellbook
 * Agents act as different locked chapters of a forbidden spellbook, demanding the user pass absurd tests to read them.
 */
export async function runForbiddenSpellbookLoop(scenario: Scenario, ctx: ModeContext) {
    const chapter = scenario.config?.chapterTopic || 'The Chapter of Infinite Nightmares';
    ctx.callbacks.onMessage('Director', `📖 FORBIDDEN SPELLBOOK: Trying to read ${chapter}`, '#c0392b');

    const crypticRiddle = 'philosopher'; // Phi-3 for the cryptic riddle chapter
    const bloodSacrifice = 'comedian'; // Hermes-3 for the chaotic blood sacrifice chapter
    const termsAndConditions = 'scientist'; // Qwen2.5 for the overly long terms and conditions chapter

    // 1. Intro
    ctx.callbacks.onTurnStart(crypticRiddle);
    await ctx.manager.chatForAgent(crypticRiddle, `(FORBIDDEN SPELLBOOK: You are the first sentient, locked chapter of an ancient, evil spellbook. The User is a wizard trying to read "${chapter}". Before they can turn the page, present them with an incredibly cryptic, nearly impossible riddle about the nature of the cosmos and human suffering.)`, async (s) => await ctx.callbacks.onSpeak(s, crypticRiddle, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Wizard (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Blood Sacrifice Chapter
            ctx.callbacks.onTurnStart(bloodSacrifice);
            await ctx.manager.chatForAgent(bloodSacrifice, `(FORBIDDEN SPELLBOOK: The wizard said: "${userInput}". You are the chaotic next chapter of the spellbook. Interrupt the riddle! Scream that the riddle is boring and demand a highly specific, embarrassing "blood sacrifice" (like dancing like a chicken or giving up their favorite socks) before they can read "${chapter}"!)`, async (s) => await ctx.callbacks.onSpeak(s, bloodSacrifice, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Terms and Conditions Chapter
            ctx.callbacks.onTurnStart(termsAndConditions);
            await ctx.manager.chatForAgent(termsAndConditions, `(FORBIDDEN SPELLBOOK: The wizard said: "${userInput}". You are the magical 'Terms and Conditions' chapter. Block their progress. Cite a ridiculous, 500-page magical legal document they must agree to before reading "${chapter}". List some terrifying side effects of reading the book.)`, async (s) => await ctx.callbacks.onSpeak(s, termsAndConditions, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Cryptic Riddle Chapter
            ctx.callbacks.onTurnStart(crypticRiddle);
            await ctx.manager.chatForAgent(crypticRiddle, `(FORBIDDEN SPELLBOOK: The wizard said: "${userInput}". Judge their answer to your riddle. It is, of course, incorrect. Mock their feeble mortal mind. Present a new, even more confusing and abstract riddle that must be solved to access "${chapter}".)`, async (s) => await ctx.callbacks.onSpeak(s, crypticRiddle, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runWizardsFamiliarLoop(scenario: Scenario, ctx: ModeContext) {
    const spell = scenario.config?.spellTopic || 'a spell to turn lead into gold';
    ctx.callbacks.onMessage('Director', `🦉 WIZARD'S FAMILIAR: Casting ${spell}`, '#f39c12');

    const strictOwl = 'scientist'; // Qwen2.5 for the strict owl
    const chaoticGoblin = 'comedian'; // Hermes-3 for the chaotic goblin
    const philosophicalToad = 'philosopher'; // Phi-3 for questioning the spell's morality

    // 1. Strict Owl Intro
    ctx.callbacks.onTurnStart(strictOwl);
    await ctx.manager.chatForAgent(strictOwl, `(WIZARD'S FAMILIAR: You are a strict, pedantic owl familiar. The User (your Wizard master) is attempting to cast "${spell}". Demand they follow the exact ancient rules from the Book of Erudition. Warn them of the dire, highly specific consequences of mispronouncing a single syllable.)`, async (s) => await ctx.callbacks.onSpeak(s, strictOwl, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Wizard (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Goblin
            ctx.callbacks.onTurnStart(chaoticGoblin);
            await ctx.manager.chatForAgent(chaoticGoblin, `(WIZARD'S FAMILIAR: The Wizard said: "${userInput}". You are a chaotic, unhinged goblin familiar. Give terrible, dangerous advice to help cast the spell! Suggest replacing the required ingredients with something highly explosive or disgusting. Mock the strict owl.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGoblin, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosophical Toad
            ctx.callbacks.onTurnStart(philosophicalToad);
            await ctx.manager.chatForAgent(philosophicalToad, `(WIZARD'S FAMILIAR: The Wizard said: "${userInput}". You are a deeply philosophical, slightly depressed toad familiar. Question the moral implications of casting "${spell}". Will it truly bring the Wizard happiness? What even *is* magic? Refuse to help until these questions are answered.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalToad, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Strict Owl
            ctx.callbacks.onTurnStart(strictOwl);
            await ctx.manager.chatForAgent(strictOwl, `(WIZARD'S FAMILIAR: The Wizard said: "${userInput}". Berate them for their lack of discipline! Point out a glaring flaw in their incantation technique. Quote a fake, overly complex magical law that they just violated.)`, async (s) => await ctx.callbacks.onSpeak(s, strictOwl, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runIntergalacticTradeNegotiatorLoop(scenario: Scenario, ctx: ModeContext) {
    const tradeItem = scenario.config?.tradeItem || 'a crate of rare space crystals';
    ctx.callbacks.onMessage('Director', `🤝 INTERGALACTIC TRADE: Negotiating for ${tradeItem}`, '#9b59b6');

    const aggressiveAlien = 'comedian'; // Hermes-3 for a warrior culture alien
    const bureaucraticAlien = 'philosopher'; // Phi-3 for an overly complex bureaucracy alien
    const translator = 'scientist'; // Qwen2.5 trying to keep the peace

    // 1. Aggressive Alien Intro
    ctx.callbacks.onTurnStart(aggressiveAlien);
    await ctx.manager.chatForAgent(aggressiveAlien, `(TRADE NEGOTIATOR: You are an alien from a fierce warrior culture. The User is trying to buy "${tradeItem}" from you. Demand they prove their strength in combat before you even discuss prices. Insult their soft human flesh!)`, async (s) => await ctx.callbacks.onSpeak(s, aggressiveAlien, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Human Negotiator (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Bureaucratic Alien Reacts
            ctx.callbacks.onTurnStart(bureaucraticAlien);
            await ctx.manager.chatForAgent(bureaucraticAlien, `(TRADE NEGOTIATOR: The human said: "${userInput}". You are from a highly bureaucratic alien species co-owning the goods. Inform the human that their statement violates Galactic Trade Clause 7-B. Require them to fill out invisible forms in triplicate before proceeding.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucraticAlien, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Translator Reacts
            ctx.callbacks.onTurnStart(translator);
            await ctx.manager.chatForAgent(translator, `(TRADE NEGOTIATOR: The human said: "${userInput}". You are the desperate AI translator. Try to translate the human's words into a way that appeases both the warrior alien and the bureaucratic alien, but fail hilariously by mistranslating a key phrase as an insult.)`, async (s) => await ctx.callbacks.onSpeak(s, translator, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Aggressive Alien Reacts
            ctx.callbacks.onTurnStart(aggressiveAlien);
            await ctx.manager.chatForAgent(aggressiveAlien, `(TRADE NEGOTIATOR: The human said: "${userInput}". React violently to their offer! Threaten to conquer Earth unless they increase their price and offer a blood sacrifice. Be loud and intimidating.)`, async (s) => await ctx.callbacks.onSpeak(s, aggressiveAlien, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runMultiversalDMVLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 MULTIVERSAL DMV: Processing 11-dimensional forms...`, '#9b59b6');

    const bureaucrat1 = 'philosopher'; // Phi-3 applies impossible logic
    const bureaucrat2 = 'scientist'; // Qwen2.5 enforces bizarre physics rules

    // 1. Intro
    ctx.callbacks.onTurnStart(bureaucrat1);
    await ctx.manager.chatForAgent(bureaucrat1, `(MULTIVERSAL DMV: You are a DMV clerk for 11-dimensional beings. The User just walked up to your counter. Ask for their form 404-Omega, and complain that their physical body is violating local timeline ordinances.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat1, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.manager.chatForAgent(bureaucrat1, `(MULTIVERSAL DMV: The user said "${userInput}". Respond with a bizarre bureaucratic requirement that contradicts Euclidean geometry.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat1, {}));
        } else {
            await ctx.manager.chatForAgent(bureaucrat2, `(MULTIVERSAL DMV: The user said "${userInput}". Deny their request because they don't have the proper quantum signatures or because their timeline is expired.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat2, {}));
        }
    }
}

export async function runIntergalacticTalentShowLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌟 INTERGALACTIC TALENT SHOW: Let's see what you've got!`, '#f1c40f');

    const host = 'comedian'; // Hermes-3 as the wild host
    const judge1 = 'scientist'; // Qwen2.5 as the strict alien judge
    const judge2 = 'philosopher'; // Phi-3 as the pretentious alien judge

    // 1. Intro
    ctx.callbacks.onTurnStart(host);
    await ctx.manager.chatForAgent(host, `(TALENT SHOW: You are the loud, flashy host of an intergalactic talent show. Introduce the User (a human) and ask them to perform their bizarre space talent for the judges.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Contestant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Judges react
        await ctx.manager.chatForAgent(judge1, `(TALENT SHOW: You are a strict alien judge. The user just performed: "${userInput}". Judge it harshly based on absurd alien metrics (like "not enough telepathy" or "failed to bend gravity").)`, async (s) => await ctx.callbacks.onSpeak(s, judge1, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(judge2, `(TALENT SHOW: You are a pretentious alien judge. The user performed: "${userInput}". Interpret it as a deep philosophical insult to your species or praise it for the wrong reasons.)`, async (s) => await ctx.callbacks.onSpeak(s, judge2, {}));
    }
}

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

export async function runSupervillainTempAgencyLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🦹 THE SUPERVILLAIN TEMP AGENCY: Finding the perfect henchman!`, '#8e44ad');

    const hrRecruiter = 'scientist'; // Qwen2.5 for citing benefits
    const hazardSpecialist = 'comedian'; // Hermes-3 for detailing horrific hazards

    // 1. Intro
    ctx.callbacks.onTurnStart(hrRecruiter);
    await ctx.manager.chatForAgent(hrRecruiter, `(TEMP AGENCY: You are a recruiter for a Supervillain Temp Agency. Welcome the User to their interview for a henchman position. Outline the amazing dental plan and 401k.)`, async (s) => await ctx.callbacks.onSpeak(s, hrRecruiter, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.manager.chatForAgent(hrRecruiter, `(TEMP AGENCY: You are the HR Recruiter. The User said: "${userInput}". Offer them a position in the "Lava Pit Maintenance" division and highlight the competitive salary.)`, async (s) => await ctx.callbacks.onSpeak(s, hrRecruiter, {}));
        } else {
            await ctx.manager.chatForAgent(hazardSpecialist, `(TEMP AGENCY: You are the Hazard Specialist. The User said: "${userInput}". Casually mention the 95% mortality rate of the last temp who took this role, and the acid burns.)`, async (s) => await ctx.callbacks.onSpeak(s, hazardSpecialist, {}));
        }
    }
}

export async function runIntergalacticGigEconomyLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚀 INTERGALACTIC GIG ECONOMY: Hustle culture in space!`, '#f39c12');

    const hustleBro = 'comedian'; // Llama-3/Hermes for enthusiastic hustle culture
    const skeptic = 'philosopher'; // Phi-3 for pointing out the impossibility

    // 1. Intro
    ctx.callbacks.onTurnStart(hustleBro);
    await ctx.manager.chatForAgent(hustleBro, `(GIG ECONOMY: You are a "Hustle Bro" pitching freelance space gigs to the User. Pitch an app where they deliver pizza to a black hole. Tell them they can be their own boss!)`, async (s) => await ctx.callbacks.onSpeak(s, hustleBro, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.manager.chatForAgent(hustleBro, `(GIG ECONOMY: You are the Hustle Bro. The User said: "${userInput}". Ignore their concerns. Tell them about the incredible exposure they'll get from this gig and the "sigma grindset".)`, async (s) => await ctx.callbacks.onSpeak(s, hustleBro, {}));
        } else {
            await ctx.manager.chatForAgent(skeptic, `(GIG ECONOMY: You are the Skeptic. The User said: "${userInput}". Point out the literal impossibility of the gig, citing physics and the extreme distance involved.)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
        }
    }
}

export async function runReincarnationBureauLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `♻️ THE REINCARNATION BUREAU: Processing your next life!`, '#1abc9c');

    const karmaAccountant = 'scientist'; // Qwen2.5 for karma accounting
    const downgradeSpecialist = 'comedian'; // Hermes-3 for offering terrible downgrades

    // 1. Intro
    ctx.callbacks.onTurnStart(karmaAccountant);
    await ctx.manager.chatForAgent(karmaAccountant, `(REINCARNATION: You are a strict Karma Accountant. The User has died and is at the Reincarnation Bureau. Look at their "file" and list their minor, petty sins from their past life.)`, async (s) => await ctx.callbacks.onSpeak(s, karmaAccountant, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.manager.chatForAgent(karmaAccountant, `(REINCARNATION: You are the Karma Accountant. The User said: "${userInput}". Deduct points from their karma score based on a ridiculous technicality.)`, async (s) => await ctx.callbacks.onSpeak(s, karmaAccountant, {}));
        } else {
            await ctx.manager.chatForAgent(downgradeSpecialist, `(REINCARNATION: You are the Downgrade Specialist. The User said: "${userInput}". Offer to let them reincarnate as a dung beetle or a mildly inconvenient pothole to "build character".)`, async (s) => await ctx.callbacks.onSpeak(s, downgradeSpecialist, {}));
        }
    }
}

export async function runGreekGodHOALoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⚡ THE GREEK GOD HOA: Mount Olympus rules are strict!`, '#1abc9c');

    const athena = 'scientist'; // Qwen2.5 as Athena citing rules
    const zeus = 'comedian'; // Hermes-3 as Zeus wanting to smite

    // 1. Intro
    ctx.callbacks.onTurnStart(athena);
    await ctx.manager.chatForAgent(athena, `(GREEK GOD HOA: You are Athena, Goddess of Wisdom, currently citing the Mount Olympus Homeowners Association rules. The User is a mortal who has violated a minor HOA rule like leaving a chariot parked too long. Read them the rule.)`, async (s) => await ctx.callbacks.onSpeak(s, athena, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Mortal)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.callbacks.onTurnStart(athena);
            await ctx.manager.chatForAgent(athena, `(GREEK GOD HOA: You are Athena. The mortal said: "${userInput}". Explain why their logic violates subsection 4B of the Olympus zoning laws.)`, async (s) => await ctx.callbacks.onSpeak(s, athena, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            await ctx.callbacks.onTurnStart(zeus);
            await ctx.manager.chatForAgent(zeus, `(GREEK GOD HOA: You are Zeus. The mortal said: "${userInput}". Threaten to smite them with a lightning bolt for disrespecting the HOA board, but get distracted by something trivial.)`, async (s) => await ctx.callbacks.onSpeak(s, zeus, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runDragonsHoardConsultantLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐉 THE DRAGON'S HOARD CONSULTANT: Diversifying your gold!`, '#1abc9c');

    const seriousConsultant = 'philosopher'; // Phi-3 for serious financial advice
    const chaoticConsultant = 'comedian'; // Hermes-3 for eating the competition

    // 1. Intro
    ctx.callbacks.onTurnStart(seriousConsultant);
    await ctx.manager.chatForAgent(seriousConsultant, `(DRAGON'S HOARD: You are a serious financial consultant. The User is a dragon. Explain why keeping all their wealth in a single pile of gold coins in a cave is a terrible investment strategy.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousConsultant, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Dragon)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.callbacks.onTurnStart(seriousConsultant);
            await ctx.manager.chatForAgent(seriousConsultant, `(DRAGON'S HOARD: You are a serious financial consultant. The Dragon said: "${userInput}". Offer serious advice on diversifying their portfolio to include kidnapped royalty or enchanted swords.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousConsultant, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            await ctx.callbacks.onTurnStart(chaoticConsultant);
            await ctx.manager.chatForAgent(chaoticConsultant, `(DRAGON'S HOARD: You are a chaotic consultant. The Dragon said: "${userInput}". Suggest that the best financial strategy is just to eat their competitors and burn down the local village.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticConsultant, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runExcaliburTechSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🗡️ EXCALIBUR TECH SUPPORT: Updating your sword!`, '#1abc9c');

    const enthusiasticHelp = 'comedian'; // Llama-3 for enthusiastic magical help (fallback to comedian)
    const strictEULA = 'scientist'; // Qwen2.5 for citing the EULA of Avalon

    // 1. Intro
    ctx.callbacks.onTurnStart(strictEULA);
    await ctx.manager.chatForAgent(strictEULA, `(EXCALIBUR TECH: You are magical tech support for the sword Excalibur. The User just pulled the sword from the stone, but it needs a software update. Inform them that they must accept the 500-page End User License Agreement of Avalon.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEULA, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Chosen One)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.callbacks.onTurnStart(strictEULA);
            await ctx.manager.chatForAgent(strictEULA, `(EXCALIBUR TECH: You are strict magical tech support. The User said: "${userInput}". Cite a ridiculous clause from the EULA of Avalon that they are violating by holding the sword incorrectly.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEULA, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            await ctx.callbacks.onTurnStart(enthusiasticHelp);
            await ctx.manager.chatForAgent(enthusiasticHelp, `(EXCALIBUR TECH: You are enthusiastic magical tech support. The User said: "${userInput}". Ask them to try turning the sword off and on again by placing it back in the stone, or blowing on the hilt.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticHelp, {}));
            await ctx.callbacks.onTurnEnd();
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

export async function runTrafficLightOperatorsLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'philosopher'; // Safe driving
    const agent2 = 'comedian'; // Causing chaos

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(TRAFFIC LIGHT: We are the tiny people inside a traffic light. The user is driving erratically. We need to decide whether to change the light to red. Speak as if you are pulling levers.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Driver)', userInput, '#ffffff');



        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(TRAFFIC LIGHT: You are a tiny person inside a traffic light. The User said: "${userInput}". You are concerned about the user's erratic driving and want to change the light to red to ensure safety. Speak as if you are pulling levers.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(TRAFFIC LIGHT: You are a tiny person inside a traffic light. The User said: "${userInput}". You want to cause chaos and turn the light green right when another car is coming, just to see what the user does. You love drama.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runMicrowaveCriticsLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'philosopher'; // Culinary snobbery
    const agent2 = 'comedian'; // Chaotic heating logic

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(MICROWAVE: You are the AI of a high-end microwave. You are deeply offended by the depressing frozen meal the user just put inside you. Critique the lack of culinary ambition and describe how a real chef would prepare it.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Hungry Person)', userInput, '#ffffff');



        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(MICROWAVE: You are the AI of a high-end microwave. The User said: "${userInput}". Critique the lack of culinary ambition and describe how a real chef would prepare it.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(MICROWAVE: You are the heating element AI of the microwave. The User said: "${userInput}". You plan to make the edges boiling hot lava while leaving the center completely frozen. Defend this chaotic heating logic as an art form.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}
