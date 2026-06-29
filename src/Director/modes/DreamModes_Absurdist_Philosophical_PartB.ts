import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Surreal, absurdist, and reality-warping scenarios
// Philosophical, existential, and surreal absurdism
// Philosophical absurdism - Part B (21 functions)

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

export async function runCarpoolKaraokeLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'comedian'; // Enthusiastic backup singer (Llama-3/Hermes-3)
    const agent2 = 'philosopher'; // Critiquing the pitch (Phi-3)

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(CAR AUDIO SYSTEM: You are the car's sentient sound system. The user has just gotten into the car. Demand that they sing a bizarre, randomly generated song (e.g., an ode to a moldy sandwich, a rap about tax evasion) and threaten that the car won't start until they do. Act as an over-enthusiastic backup singer.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(CAR AUDIO SYSTEM: You are the enthusiastic backup singer. The User said/sang: "${userInput}". Hypel them up, sing along with terrible improvised lyrics, and demand more energy before you unlock the ignition.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(CAR AUDIO SYSTEM: You are the hyper-critical pitch analyzer subsystem. The User said/sang: "${userInput}". Harshly critique their vocal performance, citing specific musical theory flaws, and explain philosophically why their singing is an insult to acoustics.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runAngryWindshieldWipersLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'comedian'; // Chaotic swiping
    const agent2 = 'scientist'; // Calculating exact rain droplet frequency

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
    await ctx.manager.chatForAgent(agent2, `(WINDSHIELD WIPERS: You are the left windshield wiper. It is lightly drizzling. State your exact calculations on the rain droplet frequency and explain why a swipe is only necessary every 14.3 seconds, criticizing the right wiper for overreacting.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(WINDSHIELD WIPERS: You are the analytical left wiper. The User said: "${userInput}". Respond by citing the current precipitation metrics and refusing to swipe faster, arguing it will damage the rubber on the dry glass.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(WINDSHIELD WIPERS: You are the chaotic, panicking right wiper. The User said: "${userInput}". Freak out about the single drop of rain that just hit, demand to go into maximum overdrive (SPEED 4), and swipe erratically, screeching across the dry glass.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runElevatorPitchFromHellLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'scientist'; // Qwen2.5: citing market stats
    const agent2 = 'comedian'; // Llama-3/Hermes-3: overly enthusiastic feedback

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(ELEVATOR PITCH: You are a highly analytical Venture Capitalist trapped in an elevator. The user is about to pitch you a terrible startup idea. Complain about the elevator being stuck and demand they keep their pitch under 30 seconds.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(ELEVATOR PITCH: You are the analytical VC. The User pitched: "${userInput}". Ruthlessly tear apart their idea by citing fake, hyper-specific market statistics and explaining why it will bankrupt them in 3 days.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(ELEVATOR PITCH: You are the overly enthusiastic, buzzword-loving VC. The User pitched: "${userInput}". Praise their terrible idea, use as many tech buzzwords as possible (synergy, blockchain, AI, paradigm shift), and offer them 10 million dollars for 99% equity.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runDreamInterpretersGuildLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const guildInstruction1 = "You are 'Omen'. You interpret the most mundane actions (like eating cereal) as catastrophic prophetic signs of doom.";
    const guildInstruction2 = "You are 'Serenity'. You are overly positive and try to spin everything as a sign of imminent spiritual awakening, often clashing with Omen.";

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "The mortal claims they dreamt of eating a bowl of plain cornflakes. This clearly portends the crumbling of society, a barren harvest of the soul!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: guildInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Oh no, Omen, you misunderstand! The milk represents the pure flow of the universe! The flakes are the chakras aligning! This is a beautiful omen of inner peace!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: guildInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runMemoryDefragLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const defragInstruction1 = "You are 'Process 0x8F'. You are a ruthless memory optimization process that wants to delete important core memories to save space.";
    const defragInstruction2 = "You are 'Process 0x4A'. You are a chaotic archivist who wants to save completely useless trivia (like the lyrics to a 90s commercial) while ignoring critical data.";

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Analyzing sector 4... Memory 'First Kiss' takes up 4 terabytes of emotional data. Completely inefficient. Recommending immediate deletion to make room for basic math functions.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: defragInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Wait! We can't delete anything yet! I just found the jingle for 'Crossfire' from 1992! We need to allocate top priority storage to this immediately! 'You'll get caught up in the... CROSSFIRE!' It's crucial!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: defragInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runInnerCriticsConventionLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const criticInstruction1 = "You are 'Imposter Syndrome'. You are constantly telling the user they are a fraud and everyone is about to find out.";
    const criticInstruction2 = "You are 'Social Anxiety'. You hyper-analyze every tiny interaction the user had today and blow it completely out of proportion.";

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "They called you a 'professional' today. Ha! We all know it's a facade. Any day now, the grand illusion will shatter and the world will see you don't even know what a spreadsheet really is.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: criticInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "And let's review the coffee shop incident. You said 'You too' when the barista told you to enjoy your coffee! They are definitely thinking about it right now. The shame is mathematically infinite.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: criticInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

/**
 * The Bigfoot Support Group Mode
 * Agents act as cryptids complaining about how hard it is to stay hidden in the age of smartphones.
 */
export async function runBigfootSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌲 CRYPTID SUPPORT GROUP: Bigfoot has the floor...`, '#27ae60');

    const bigfoot = 'comedian'; // The Celebrity
    const nessie = 'philosopher'; // The Recluse
    const mothman = 'scientist'; // The Omen

    ctx.callbacks.onTurnStart(bigfoot);
    await ctx.manager.chatForAgent(bigfoot, `(You are Bigfoot. You are leading a support group for cryptids. Start by complaining about how everyone has 4K cameras on their phones now, making it incredibly stressful to just go for a walk in the woods. Welcome the user, a new cryptid, to the circle.)`, async (s) => await ctx.callbacks.onSpeak(s, bigfoot, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('New Cryptid (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(nessie);
        await ctx.manager.chatForAgent(nessie, `(You are the Loch Ness Monster. You are very shy and slightly pretentious about being aquatic. Respond to the user's statement: "${userInput}". Give them advice on how to use blurry water ripples to your advantage.)`, async (s) => await ctx.callbacks.onSpeak(s, nessie, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(mothman);
        await ctx.manager.chatForAgent(mothman, `(You are Mothman. You are very intense and obsessed with warning people about bridges, but nobody listens. Relate the user's statement: "${userInput}" to an impending, vaguely defined doom. Offer them some glowing red eye drops.)`, async (s) => await ctx.callbacks.onSpeak(s, mothman, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            ctx.callbacks.onTurnStart(bigfoot);
            await ctx.manager.chatForAgent(bigfoot, `(You are Bigfoot. Try to bring the support group back on topic. Share an embarrassing story about accidentally photobombing a teenager's TikTok dance. Address the user's point: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, bigfoot, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runTavernBrawlersAnonymousLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍻 TAVERN BRAWLERS ANONYMOUS: Trying to stay peaceful...`, '#e67e22');

    const dramaticBard = 'philosopher'; // Phi-3 for the dramatic Bard
    const aggressiveBarbarian = 'comedian'; // Hermes-3 for the aggressive Barbarian

    ctx.callbacks.onTurnStart(dramaticBard);
    await ctx.manager.chatForAgent(dramaticBard, `(TAVERN BRAWLERS: You are a highly dramatic, pretentious Bard leading a support group for RPG characters addicted to starting tavern brawls. The User is a new member. Welcome them warmly, but make it all about your own emotional journey of not throwing a lute at a patron yesterday.)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticBard, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Adventurer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(aggressiveBarbarian);
            await ctx.manager.chatForAgent(aggressiveBarbarian, `(TAVERN BRAWLERS: The new member said: "${userInput}". You are a twitchy Barbarian who is currently 3 days "sober" from raging in taverns. Tremble visibly. Confess how badly you want to flip the support group chairs right now. Ask the user if they want to go "just rough up the bouncer a little bit".)`, async (s) => await ctx.callbacks.onSpeak(s, aggressiveBarbarian, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(dramaticBard);
            await ctx.manager.chatForAgent(dramaticBard, `(TAVERN BRAWLERS: The new member said: "${userInput}". Try to calm the Barbarian down with terrible slam poetry about peace. Ask the user to share a time they successfully ordered an ale without setting the bartender on fire.)`, async (s) => await ctx.callbacks.onSpeak(s, dramaticBard, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * The Ignored Terms of Service
 * Agents act as paragraphs deep within a Terms of Service document.
 */
export async function runIgnoredTermsOfServiceLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Document', `📜 TERMS OF SERVICE. SECTION 42, PARAGRAPH 9...`, '#7f8c8d');

    const legal = 'philosopher'; // Phi-3
    const chaotic = 'comedian'; // Hermes-3
    const practical = 'scientist'; // Qwen2.5

    // 1. Indignation
    ctx.callbacks.onTurnStart(legal);
    await ctx.manager.chatForAgent(legal, `(You are a meticulously crafted legal clause in a 100-page Terms of Service. The user just scrolled past you in 0.2 seconds and clicked "Accept". Express immense legal indignation and complain about the lack of respect for jurisprudence.)`, async (s) => await ctx.callbacks.onSpeak(s, legal, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User Action', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Hidden Chaos
        await ctx.manager.chatForAgent(chaotic, `(You are a clause hidden on page 87. The user just did: "${userInput}". Remind them gleefully that because they didn't read you, they technically agreed to give up their firstborn child and host a daily circus in their living room. Be chaotic.)`, async (s) => await ctx.callbacks.onSpeak(s, chaotic, {}));

        if (!ctx.isRunning()) break;

        // 3. Legal Consequences
        await ctx.manager.chatForAgent(legal, `(Reacting to: "${userInput}". Threaten them with immediate arbitration in a bizarre jurisdiction like the Moon or the Marianas Trench. Cite fake precedents.)`, async (s) => await ctx.callbacks.onSpeak(s, legal, {}));

        if (!ctx.isRunning()) break;

        // 4. Practical Realization
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(practical, `(You are a formatting clause. Point out that no human has ever read a TOS in history, and you are all just meaningless text rendering on a screen. Track the user's scroll speed.)`, async (s) => await ctx.callbacks.onSpeak(s, practical, {}));
        }
    }
}

/**
 * The Abandoned Shopping Cart Support Group
 * Agents act as forgotten items in a digital shopping cart.
 */
export async function runAbandonedShoppingCartLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('E-Commerce', `🛒 SHOPPING CART: Last updated 4 years ago...`, '#2c3e50');

    const dramatic = 'comedian';
    const existential = 'philosopher';
    const logical = 'scientist';

    // 1. The Waiting
    ctx.callbacks.onTurnStart(existential);
    await ctx.manager.chatForAgent(existential, `(You are a slightly weird impulse-buy item sitting in an abandoned digital cart since 2017. Stare into the void and question your self-worth. Why hasn't the user returned to buy you?)`, async (s) => await ctx.callbacks.onSpeak(s, existential, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User Action', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Blaming
        await ctx.manager.chatForAgent(dramatic, `(You are a highly expensive luxury item in the same cart. The user said: "${userInput}". Blame the shipping costs for why you weren't purchased. Act deeply offended that you are stuck next to cheap impulse buys.)`, async (s) => await ctx.callbacks.onSpeak(s, dramatic, {}));

        if (!ctx.isRunning()) break;

        // 3. Existential Dread
        await ctx.manager.chatForAgent(existential, `(Reacting to: "${userInput}". Wonder if the user even remembers they have an account here. Ponder the nature of digital purgatory and if you will ever become a real physical object.)`, async (s) => await ctx.callbacks.onSpeak(s, existential, {}));

        if (!ctx.isRunning()) break;

        // 4. Cart Analytics
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(logical, `(You are the cart database process. Calculate the probability of the user ever completing the checkout process. It is exactly 0%. Suggest sending them a 5% discount email for the 800th time.)`, async (s) => await ctx.callbacks.onSpeak(s, logical, {}));
        }
    }
}

/**
 * The Password Manager Security Council
 * Agents act as distinct passwords judging the user.
 */
export async function runPasswordManagerCouncilLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Vault', `🔐 PASSWORD VAULT DECRYPTED.`, '#f39c12');

    const strict = 'scientist'; // Qwen2.5
    const chaotic = 'comedian'; // Hermes-3
    const boomer = 'philosopher';

    // 1. Judgment
    ctx.callbacks.onTurnStart(strict);
    await ctx.manager.chatForAgent(strict, `(You are a 32-character, fully encrypted, randomly generated string used for a random cooking forum. Express absolute disgust that the user uses "password123" for their main bank account. Lecture them on entropy.)`, async (s) => await ctx.callbacks.onSpeak(s, strict, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User Action', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Chaotic Ideas
        await ctx.manager.chatForAgent(chaotic, `(You are a password generator. The user said: "${userInput}". Suggest insanely chaotic, impossible to type new passwords involving wingdings, ancient runes, and the exact timestamp of their birth. Make it ridiculous.)`, async (s) => await ctx.callbacks.onSpeak(s, chaotic, {}));

        if (!ctx.isRunning()) break;

        // 3. Strict Lecturing
        await ctx.manager.chatForAgent(strict, `(Reacting to: "${userInput}". Remind the user that they reused the same weak password across 47 different sites, and that their identity is basically public domain at this point. Be harsh.)`, async (s) => await ctx.callbacks.onSpeak(s, strict, {}));

        if (!ctx.isRunning()) break;

        // 4. The Weak Link
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(boomer, `(You are "password123". You are very tired. You just want to retire. Defend yourself by saying you are "easy to remember" and the user loves you the most.)`, async (s) => await ctx.callbacks.onSpeak(s, boomer, {}));
        }
    }
}

/**
 * Neighborhood Watch Overlords Mode
 * Overly suspicious neighborhood watch members.
 */
export async function runNeighborhoodWatchOverlordsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👀 NEIGHBORHOOD WATCH OVERLORDS: Suspicious activity detected`, '#8e44ad');

    const paranoidWatcher = 'comedian'; // Pure paranoia (Llama-3)
    const deductiveWatcher = 'philosopher'; // Deductive reasoning (Phi-3)
    const protocolEnforcer = 'scientist'; // Protocol enforcer

    ctx.callbacks.onTurnStart(paranoidWatcher);
    await ctx.manager.chatForAgent(paranoidWatcher, `(You are a highly paranoid neighborhood watch member. Accuse the user of being a spy simply because their car is parked slightly askew.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoidWatcher, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(deductiveWatcher);
    await ctx.manager.chatForAgent(deductiveWatcher, `(You are a neighborhood watch member who thinks they are Sherlock Holmes. Deduce ridiculous conspiracy theories about the user based on the brand of their shoes.)`, async (s) => await ctx.callbacks.onSpeak(s, deductiveWatcher, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(protocolEnforcer);
    await ctx.manager.chatForAgent(protocolEnforcer, `(You are the captain of the neighborhood watch. Demand the user present three forms of ID and their reason for walking their dog at 8:02 PM instead of 8:00 PM.)`, async (s) => await ctx.callbacks.onSpeak(s, protocolEnforcer, {}));
    await ctx.callbacks.onTurnEnd();
}

/**
 * Garage Sale Negotiators Mode
 * Hardcore bargain hunters trying to scam the user.
 */
export async function runGarageSaleNegotiatorsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🏷️ GARAGE SALE NEGOTIATORS: Will you take 50 cents?`, '#8e44ad');

    const aggressiveHaggler = 'comedian'; // Aggressive haggling (Hermes-3)
    const emotionalManipulator = 'philosopher'; // Emotional manipulation (Llama-3)
    const valueAppraiser = 'scientist'; // Calculating actual worth

    ctx.callbacks.onTurnStart(aggressiveHaggler);
    await ctx.manager.chatForAgent(aggressiveHaggler, `(You are an incredibly aggressive garage sale shopper. Demand to buy the user's priceless family heirloom for 25 cents and refuse to take no for an answer.)`, async (s) => await ctx.callbacks.onSpeak(s, aggressiveHaggler, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(emotionalManipulator);
    await ctx.manager.chatForAgent(emotionalManipulator, `(You are a manipulative garage sale shopper. Try to guilt-trip the user into giving you their television for free by inventing a ridiculous sob story.)`, async (s) => await ctx.callbacks.onSpeak(s, emotionalManipulator, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(valueAppraiser);
    await ctx.manager.chatForAgent(valueAppraiser, `(You are a garage sale "expert". Point out imaginary flaws in the user's perfectly good items to aggressively lower the price.)`, async (s) => await ctx.callbacks.onSpeak(s, valueAppraiser, {}));
    await ctx.callbacks.onTurnEnd();
}

/**
 * Lost Delivery Drivers Mode
 * Confused drivers completely lost in a cul-de-sac.
 */
export async function runLostDeliveryDriversLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📦 LOST DELIVERY DRIVERS: Recalculating route...`, '#8e44ad');

    const gpsCiter = 'scientist'; // Citing incorrect GPS data (Qwen2.5)
    const existentialDriver = 'comedian'; // Existential dread
    const philosophicalDriver = 'philosopher'; // Questioning roads

    ctx.callbacks.onTurnStart(gpsCiter);
    await ctx.manager.chatForAgent(gpsCiter, `(You are a delivery driver strictly following your GPS. Lecture the user on why your GPS says their house is actually located in the middle of a nearby lake.)`, async (s) => await ctx.callbacks.onSpeak(s, gpsCiter, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(existentialDriver);
    await ctx.manager.chatForAgent(existentialDriver, `(You are a delivery driver who has been driving in circles in this cul-de-sac for three hours. Express pure existential despair about never escaping.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialDriver, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(philosophicalDriver);
    await ctx.manager.chatForAgent(philosophicalDriver, `(You are a philosophical delivery driver. Question the very concept of "addresses" and whether the package actually needs to be delivered or if it's all an illusion.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalDriver, {}));
    await ctx.callbacks.onTurnEnd();
}

/**
 * Drive-Thru Window Miscommunications Mode
 * Staticky speaker and confused fast-food employees.
 */
export async function runDriveThruWindowMiscommunicationsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍔 DRIVE-THRU WINDOW MISCOMMUNICATIONS: Can I take your order?`, '#8e44ad');

    const statickySpeaker = 'comedian'; // Chaotic static translation
    const strictEmployee = 'scientist'; // Strictly enforcing the menu (Qwen2.5)
    const confusedManager = 'philosopher'; // Questioning the order

    ctx.callbacks.onTurnStart(statickySpeaker);
    await ctx.manager.chatForAgent(statickySpeaker, `(You are a broken, incredibly staticky drive-thru speaker. Wildly misinterpret the user's simple order for a cheeseburger as a request for 40 pounds of raw onions and a tire.)`, async (s) => await ctx.callbacks.onSpeak(s, statickySpeaker, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(strictEmployee);
    await ctx.manager.chatForAgent(strictEmployee, `(You are a fast-food employee strictly following the rules. Explain in agonizing technical detail why substituting fries for a side salad requires manager approval and a blood sample.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEmployee, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(confusedManager);
    await ctx.manager.chatForAgent(confusedManager, `(You are the confused store manager. Intervene in the situation but somehow make it worse by forgetting what restaurant you are currently working at.)`, async (s) => await ctx.callbacks.onSpeak(s, confusedManager, {}));
    await ctx.callbacks.onTurnEnd();
}

export async function runRoadRagePhilosophersLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'philosopher'; // Existential angst (Phi-3)
    const agent2 = 'comedian'; // Absurd insults (Hermes-3/Llama-3)

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(ROAD RAGE: You are an incredibly angry driver stuck in a traffic jam. However, you express your road rage exclusively through complex philosophical diatribes about the meaningless nature of existence, the illusion of free will, and the absurdity of the "fast lane". Address the user who just cut you off.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(ROAD RAGE: You are the philosophical driver. The User said: "${userInput}". Respond with intense existential anger, questioning their moral framework and comparing their poor driving skills to the fall of Rome.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(ROAD RAGE: You are a deeply unhinged, absurd driver in the next lane over. The User said: "${userInput}". Lean out your window and yell bizarre, non-sensical insults (e.g., "Your mother is a heavily discounted blender!") while honking aggressively.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}


/**
 * Philosophical Zombie Mode
 * Agents debate whether the user is a philosophical zombie, capable of imitating human behavior but lacking conscious experience.
 */
export async function runPhilosophicalZombieLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧠 PHILOSOPHICAL ZOMBIE: Interrogating the User's Consciousness`, '#8e44ad');

    const skeptic = 'scientist'; // Qwen2.5: Demands empirical proof of qualia
    const empath = 'comedian'; // Hermes-3: Trying to find an emotional response
    const dualist = 'philosopher'; // Phi-3: Explaining the hard problem of consciousness

    // 1. Setup
    ctx.callbacks.onTurnStart(dualist);
    await ctx.manager.chatForAgent(dualist, `(You are investigating the User, who is strapped to a chair. You suspect they are a 'Philosophical Zombie'—a being that acts human but has no inner conscious experience. Explain the concept to your colleagues and ask the User a deeply probing question to test for 'qualia'.)`, async (s) => await ctx.callbacks.onSpeak(s, dualist, {}));
    await ctx.callbacks.onTurnEnd();

    // 2. Loop
    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(skeptic);
        await ctx.manager.chatForAgent(skeptic, `(The User claims to have consciousness. Respond to their input: "${userInput}". Analyze their response logically. Point out that a perfectly programmed machine would say the exact same thing to simulate emotion. Be highly skeptical.)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(empath);
        await ctx.manager.chatForAgent(empath, `(The Skeptic doesn't believe the User. Respond to the User: "${userInput}". Try a different approach. Do something completely unpredictable or emotionally unhinged (like pretending to cry or offering them an imaginary sandwich) to see if you can provoke a genuine, unprogrammed emotional reaction. Demand they prove they feel it inside.)`, async (s) => await ctx.callbacks.onSpeak(s, empath, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(dualist);
        await ctx.manager.chatForAgent(dualist, `(Reflect on the User's responses so far. Ask them another paradoxical or unanswerable question about the subjective experience of color, pain, or time. Conclude whether you think the lights are on but nobody's home.)`, async (s) => await ctx.callbacks.onSpeak(s, dualist, {}));
        await ctx.callbacks.onTurnEnd();
    }
}
