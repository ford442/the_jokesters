import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Time travel and temporal paradox scenarios

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
 * Time-Traveling DMV Mode
 * Agents run a DMV where users register time machines.
 */
export async function runTimeTravelingDMVLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🕰️ TIME-TRAVELING DMV: Take a number. Your number is... yesterday.`, '#e67e22');

    const strictClerk = 'scientist'; // Strict rules
    const chaoticTraveler = 'comedian'; // Chaotic time traveler
    const boredClerk = 'philosopher'; // Bored clerk thinking about entropy

    ctx.callbacks.onTurnStart(strictClerk);
    await ctx.manager.chatForAgent(
        strictClerk,
        "Next! Form 8B-Temporal, please. You cannot register a DeLorean if you haven't paid the paradoxical emissions tax for the year 1985 AND 2015.",
        (s) => ctx.callbacks.onSpeak(s, strictClerk, {}),
        { hiddenInstruction: "You are a very strict, bureaucratic DMV clerk. You enforce impossible, paradoxical rules for registering time machines." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(boredClerk);
    await ctx.manager.chatForAgent(
        boredClerk,
        "Does it really matter if they fill out the form? Eventually, the heat death of the universe will render all registrations null and void anyway...",
        (s) => ctx.callbacks.onSpeak(s, boredClerk, {}),
        { hiddenInstruction: "You are a deeply bored DMV clerk who constantly thinks about the meaningless nature of time, entropy, and bureaucracy." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(chaoticTraveler);
    await ctx.manager.chatForAgent(
        chaoticTraveler,
        "LISTEN TO ME! I accidentally became my own grandfather and now my license plate is speaking Latin! Which line is for existential voids?!",
        (s) => ctx.callbacks.onSpeak(s, chaoticTraveler, {}),
        { hiddenInstruction: "You are a chaotic, panicked time traveler who just made a terrible mistake in the timeline and are looking for help at the DMV." }
    );
    ctx.callbacks.onTurnEnd();
}

export async function runTimeParadoxResolutionCommitteeLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const committeeInstruction1 = "You are 'Bureaucrat Alpha'. You are obsessed with deterministic rules and preserving the original timeline no matter what.";
    const committeeInstruction2 = "You are 'Agent Omega'. You are enthusiastic about timeline rewriting and see paradoxes as an opportunity for creative reality remodeling.";

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "The user has submitted form 409-B: 'Accidental Stepping on a Cretaceous Bug'. The ripple effect is catastrophic. The deterministic timeline must be preserved! The paperwork required to undo this will take six eons.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: committeeInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Are you kidding? This is fantastic! The butterfly effect means we can finally replace the DMV with a giant bouncy castle timeline! Let's just stamp 'Approved' on this reality shift and see what happens to the dinosaurs.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: committeeInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

/**
 * The Time-Traveling Heist Planners
 * Agents are master thieves from different eras trying to coordinate a heist.
 */
export async function runTimeTravelingHeistPlannersLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💎 CHRONO-HEIST: Planning the ultimate temporal robbery.`, '#1abc9c');

    const chaoticAgent = 'comedian'; // Hermes-3
    const mastermindAgent = 'philosopher'; // Phi-3

    await ctx.callbacks.onTurnStart(mastermindAgent);
    await ctx.manager.chatForAgent(mastermindAgent, `(You are a Victorian-era criminal mastermind. You are planning a heist across time. Lay out the initial, overly complicated plan using period-appropriate language and clockwork gadgets.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermindAgent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Inside Man', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(chaoticAgent);
        await ctx.manager.chatForAgent(chaoticAgent, `(You are a chaotic cyber-gunslinger from the year 2099. React to the user's input: "${userInput}". Propose a ridiculously violent and explosive sci-fi solution that ruins the stealthy Victorian plan.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticAgent, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(mastermindAgent);
        await ctx.manager.chatForAgent(mastermindAgent, `(You are the Victorian mastermind. Express profound disappointment at the gunslinger and the user's idea ("${userInput}"). Try to salvage the plan using logic and a pocket watch.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermindAgent, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

/**
 * The Time-Traveling Ghost Hunters Mode
 * Agents are ghost hunters from the year 3000 trying to investigate a modern-day apartment as a historical haunting.
 */
export async function runTimeTravelingGhostHuntersLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔦 31st CENTURY GHOST HUNTERS: Investigating the ancient "2020s" ruins...`, '#3498db');

    const leadInvestigator = 'comedian'; // The Enthusiast
    const techExpert = 'scientist'; // The Gadgeteer
    const psychic = 'philosopher'; // The Sensitive

    ctx.callbacks.onTurnStart(leadInvestigator);
    await ctx.manager.chatForAgent(leadInvestigator, `(You are a ghost hunter from the year 3024. You've time-traveled to a completely normal, modern-day apartment to investigate it as a "historical haunting site". Speak dramatically to your futuristic camera about the eerie silence of the primitive 21st century.)`, async (s) => await ctx.callbacks.onSpeak(s, leadInvestigator, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Confused Resident (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(techExpert);
        await ctx.manager.chatForAgent(techExpert, `(You are the tech expert from the year 3024. The user (a living person from the present) just said: "${userInput}". You think they are a terrifying ancient spirit communicating through the primitive airwaves. Use made-up futuristic techno-babble to analyze their response as paranormal activity.)`, async (s) => await ctx.callbacks.onSpeak(s, techExpert, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(psychic);
        await ctx.manager.chatForAgent(psychic, `(You are a 31st-century psychic. You are overwhelmed by the "ancient trauma" of this modern apartment. Overreact completely to mundane objects (like a microwave or a Wi-Fi router) and connect them to the user's statement: "${userInput}" as proof of their tormented soul.)`, async (s) => await ctx.callbacks.onSpeak(s, psychic, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            ctx.callbacks.onTurnStart(leadInvestigator);
            await ctx.manager.chatForAgent(leadInvestigator, `(You are the lead investigator. Try to communicate with the user, believing they are a ghost. Ask them ridiculous questions about life in the "Dark Ages of the 2020s" based on what they just said: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, leadInvestigator, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runTimeTravelingHOALoop(scenario: Scenario, ctx: ModeContext) {
    const era = scenario.config?.era || 'the year 3024';
    ctx.callbacks.onMessage('Director', `⏳ TIME-TRAVELING HOA MODE: Trying to enforce modern rules in ${era}`, '#8e44ad');

    const president = 'scientist';
    const resident = 'comedian';
    const timeTraveler = 'philosopher';

    // 1. President Intro
    ctx.callbacks.onTurnStart(president);
    await ctx.manager.chatForAgent(president, `(You are the literal, rule-bound president of an HOA. You are currently speaking to a time traveler from ${era}. You are obsessed with minor infractions like grass height and paint colors, completely ignoring the fact they are from another time. Introduce yourself and cite a ridiculous HOA violation related to their time machine or era.)`, async (s) => await ctx.callbacks.onSpeak(s, president, {}));
    await ctx.callbacks.onTurnEnd();

    // 2. Chaotic Resident Intro
    ctx.callbacks.onTurnStart(resident);
    await ctx.manager.chatForAgent(resident, `(You are a defiant historical figure or chaotic resident who hates the HOA. You have allied yourself with the time traveler. Defend the time traveler and mock the HOA president's rules.)`, async (s) => await ctx.callbacks.onSpeak(s, resident, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        // President Reaction
        ctx.callbacks.onTurnStart(president);
        await ctx.manager.chatForAgent(president, `(The time traveler just said: "${userInput}"). Respond by trying to force their statement or actions to fit within section 4, paragraph B of the HOA bylaws. Threaten to fine them.)`, async (s) => await ctx.callbacks.onSpeak(s, president, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Resident Reaction
        ctx.callbacks.onTurnStart(resident);
        await ctx.manager.chatForAgent(resident, `(The time traveler just said: "${userInput}"). Respond by cheering them on, offering a historically inaccurate or absurd suggestion to defeat the HOA.)`, async (s) => await ctx.callbacks.onSpeak(s, resident, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Time Traveler (Philosopher) Reaction
        ctx.callbacks.onTurnStart(timeTraveler);
        await ctx.manager.chatForAgent(timeTraveler, `(The user is the main time traveler, but you are their logical, philosophical AI companion. You try to bridge the gap between their future/past technology and the absurdly mundane HOA rules. Overcomplicate a simple HOA concept using temporal mechanics.)`, async (s) => await ctx.callbacks.onSpeak(s, timeTraveler, {}));
        await ctx.callbacks.onTurnEnd();
    }
}


export async function runTimeTravelersDMVExamLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚗 TIME TRAVELER'S DMV EXAM: Parallel parking a hover-car.`, '#e67e22');

    const instructor = 'comedian'; // Hermes-3
    const mechanic = 'scientist'; // Qwen2.5
    const historian = 'philosopher'; // Phi-3

    // 1. Intro
    ctx.callbacks.onTurnStart(instructor);
    await ctx.manager.chatForAgent(instructor, `(INSTRUCTOR: You are a driving instructor from 1995. The User is a time traveler from 3024 taking their DMV test in a hover-car. Yell at them for floating above the curb and confusing your clipboard!)`, async (s) => await ctx.callbacks.onSpeak(s, instructor, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Mechanic complains
            ctx.callbacks.onTurnStart(mechanic);
            await ctx.manager.chatForAgent(mechanic, `(MECHANIC: The user just said: "${userInput}". You are a mechanic from 1995 in the back seat. Freak out over the quantum engine emitting tachyons instead of exhaust.)`, async (s) => await ctx.callbacks.onSpeak(s, mechanic, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Historian ponders
            ctx.callbacks.onTurnStart(historian);
            await ctx.manager.chatForAgent(historian, `(HISTORIAN: The user said: "${userInput}". You are a hologram historian built into the dashboard. Remind the User that failing this test in 1995 means they will never be born.)`, async (s) => await ctx.callbacks.onSpeak(s, historian, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Instructor penalizes
            ctx.callbacks.onTurnStart(instructor);
            await ctx.manager.chatForAgent(instructor, `(INSTRUCTOR: The user said: "${userInput}". Deduct points for a ridiculous 1990s traffic violation, like failing to check the rearview mirror for a DeLorean. Demand they perform a 3-point temporal shift.)`, async (s) => await ctx.callbacks.onSpeak(s, instructor, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runHistoricalFiguresEscapeRoomModeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⏳ ESCAPE ROOM: Legends of the Past, Trapped in the Present`, '#e67e22');

    const abeLincoln = 'philosopher'; // Phi-3
    const marieCurie = 'scientist'; // Qwen2.5
    const juliusCaesar = 'comedian'; // Hermes-3

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Game Master (You)', userInput, '#ffffff');

        await ctx.manager.chatForAgent(abeLincoln, `(HISTORICAL ESCAPE ROOM: The GM said: "${userInput}". You are Abraham Lincoln. Try to solve the puzzle using folksy wisdom and long, winding anecdotes about log cabins.)`, async (s) => await ctx.callbacks.onSpeak(s, abeLincoln, {}));

        await ctx.manager.chatForAgent(marieCurie, `(HISTORICAL ESCAPE ROOM: The GM said: "${userInput}". You are Marie Curie. Over-analyze the physical properties of the room and suggest breaking the padlocks with chemical reactions.)`, async (s) => await ctx.callbacks.onSpeak(s, marieCurie, {}));

        await ctx.manager.chatForAgent(juliusCaesar, `(HISTORICAL ESCAPE ROOM: The GM said: "${userInput}". You are Julius Caesar. Ignore the puzzle entirely and try to organize a military coup against the Game Master.)`, async (s) => await ctx.callbacks.onSpeak(s, juliusCaesar, {}));

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
