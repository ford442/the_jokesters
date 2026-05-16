import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Surreal, absurdist, and reality-warping scenarios
// Philosophical, existential, and surreal absurdism
// Philosophical absurdism - Part A (21 functions)

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

