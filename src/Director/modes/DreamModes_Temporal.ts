import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
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
    await chatForAgentWithComedy(ctx, future, `(You are a Cyborg from the year 3024. You just crash-landed the time machine in ${era}. Blame the primitive technology. Speak like a robot.)`, async (s) => await ctx.callbacks.onSpeak(s, future, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Past Reacts
        await chatForAgentWithComedy(ctx, past, `(You are a person from ${era}. React with shock to the User saying: "${userInput}". Use period-appropriate slang. Be confused by modern concepts.)`, async (s) => await ctx.callbacks.onSpeak(s, past, {}));

        if (!ctx.isRunning()) break;

        // 3. Future Analyzes
        await chatForAgentWithComedy(ctx, future, `(You are a Cyborg. Analyze the historical probability of "${userInput}" altering the timeline. Be cold and calculating.)`, async (s) => await ctx.callbacks.onSpeak(s, future, {}));

        if (!ctx.isRunning()) break;

        // 4. Present Mediates
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, present, `(You are a modern person stuck in the middle. Try to explain "${userInput}" to the Victorian using analogies, while telling the Cyborg to chill.)`, async (s) => await ctx.callbacks.onSpeak(s, present, {}));
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
    await chatForAgentWithComedy(ctx, oblivious, `(We are in a normal, everyday scenario: "${topic}". Start the scene by stating what you are doing. Be completely unaware of anything strange.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Normal Response from Oblivious
        await chatForAgentWithComedy(ctx, oblivious, `(SCENE: "${topic}". The user said: "${userInput}". Reply normally, strictly adhering to your role in the scene.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));

        if (!ctx.isRunning()) break;

        // 3. Awakened Agent Reacts
        if (loopCount === 0) {
            // First loop: Normal reaction
            await chatForAgentWithComedy(ctx, awakened, `(SCENE: "${topic}". The user said: "${userInput}". React normally. You feel a strange sense of deja vu but shake it off.)`, async (s) => await ctx.callbacks.onSpeak(s, awakened, {}));

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
            await chatForAgentWithComedy(ctx, awakened, `(TIME LOOP: You are the ONLY one who remembers this has happened ${loopCount} times before! We were just talking about "${topic}". The oblivious agent just reset and forgot everything! Panic! Scream about the time loop! Try to convince them it's real!)`, async (s) => await ctx.callbacks.onSpeak(s, awakened, {}), { chatOptions: { hiddenInstruction: `Here is exactly what you remember happening before the loop reset:\n${awakenedMemory}`} });

            if (!ctx.isRunning()) break;

            // Oblivious is confused by the panic
            await chatForAgentWithComedy(ctx, oblivious, `(SCENE: "${topic}". The other agent is screaming about a "time loop" and the user said "${userInput}". Assume they are crazy. You have no memory of a loop. Dismiss them logically.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));

            if (!ctx.isRunning()) break;

            // Confused Philosopher tries to mediate
            if (Math.random() > 0.4) {
                 await chatForAgentWithComedy(ctx, confused, `(SCENE: "${topic}". One agent is screaming about time loops, the other is being logical. Philosophize about the nature of repetition and existence.)`, async (s) => await ctx.callbacks.onSpeak(s, confused, {}));
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
                 await chatForAgentWithComedy(ctx, oblivious, `(We are in a normal, everyday scenario: "${topic}". Start the scene exactly as if it's the first time it ever happened. You have NO memory of the time loop.)`, async (s) => await ctx.callbacks.onSpeak(s, oblivious, {}));
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
    await chatForAgentWithComedy(ctx, scientist, `(You are a highly logical temporal physicist. The user is a stubborn time traveler trying to alter or stop "${historicalEvent}". Warn them urgently about the catastrophic butterfly effects and timeline collapse! Use complex pseudo-science jargon.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Philosopher Argues Destiny
        await chatForAgentWithComedy(ctx, philosopher, `(PHILOSOPHER: The time traveler said: "${userInput}". Argue against them from an ethical and fatalistic perspective. Why must "${historicalEvent}" happen? Speak about the nature of destiny and human suffering/triumph.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));

        if (!ctx.isRunning()) break;

        // 3. Scientist Calculates Risk
        await chatForAgentWithComedy(ctx, scientist, `(SCIENTIST: The time traveler said: "${userInput}". Calculate the specific, absurd timeline alterations this would cause. (e.g., "If you do that, dolphins will become the dominant species by 1994!"))`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

        if (!ctx.isRunning()) break;

        // 4. Comedian Adds Chaos
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, comedian, `(COMEDIAN: You are a stowaway on the time machine. You don't care about the rules. Make a joke about "${historicalEvent}" or "${userInput}". Maybe you want to change history for a very petty reason.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
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
    await chatForAgentWithComedy(ctx, futuristicAssumptions, `(TIME TOURISTS: You are a tourist from the year 3000 visiting the present day. You just encountered the User holding "${object}". Approach them and loudly marvel at this "primitive nuclear fusion device" (or similar absurd assumption about what it is). Take a holographic picture.)`, async (s) => await ctx.callbacks.onSpeak(s, futuristicAssumptions, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Local Guide (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Naive Excitement
            await chatForAgentWithComedy(ctx, naiveExcitement, `(TIME TOURISTS: The local (User) said: "${userInput}". You are an overly excited tourist from the future. Misunderstand what they said entirely. Ask if you can eat "${object}" or if it has feelings. Try to buy it with futuristic space-credits.)`, async (s) => await ctx.callbacks.onSpeak(s, naiveExcitement, {}));
        } else if (roll < 0.66) {
            // Unimpressed Critic
            await chatForAgentWithComedy(ctx, unimpressedCritic, `(TIME TOURISTS: The local said: "${userInput}". You are a snobby tourist from the year 3000. Express profound disappointment at the backwardness of the 21st century. Complain about the lack of teleportation or the smell of non-synthetic air regarding "${object}".)`, async (s) => await ctx.callbacks.onSpeak(s, unimpressedCritic, {}));
        } else {
            // Futuristic Assumptions
            await chatForAgentWithComedy(ctx, futuristicAssumptions, `(TIME TOURISTS: The local said: "${userInput}". Ignore their explanation of "${object}". "Correct" them by explaining how in the future, this object evolved into a devastating weapon or a famous religious artifact. Take more notes.)`, async (s) => await ctx.callbacks.onSpeak(s, futuristicAssumptions, {}));
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
    await chatForAgentWithComedy(ctx, agent, `(TIME TRAVEL REAL ESTATE: You are a fast-talking real estate agent who sells properties across the space-time continuum. Welcome the Buyer (User) to the showing of "${property}". Hard-sell a completely chaotic historical feature, like a medieval moat or a pet dinosaur, as a "modern amenity".)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Buyer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Appraiser
            await chatForAgentWithComedy(ctx, appraiser, `(REAL ESTATE APPRAISER: The buyer said: "${userInput}". You are an overly analytical appraiser. Fixate on the long-term property value of "${property}" over the next 500 years. Ignore the paradoxes and calculate the ROI of surviving the bubonic plague.)`, async (s) => await ctx.callbacks.onSpeak(s, appraiser, {}));
        } else if (roll < 0.66) {
            // Skeptic
            await chatForAgentWithComedy(ctx, skeptic, `(SKEPTICAL FRIEND: The buyer said: "${userInput}". You are the buyer's deeply philosophical friend. Question the ethics of buying a house in a timeline where you might accidentally become your own grandfather. Warn them about the butterfly effect of renovating the kitchen.)`, async (s) => await ctx.callbacks.onSpeak(s, skeptic, {}));
        } else {
            // Agent
            await chatForAgentWithComedy(ctx, agent, `(TIME TRAVEL REAL ESTATE: The buyer said: "${userInput}". Dismiss their concerns entirely. Pivot to another timeline—offer to show them a mid-century modern bunker from 1955 or a floating condo in 3024. Keep pushing for the sale!)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));
        }
    }
}

export async function runTimeTravelingIRSLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🕰️ TIME-TRAVELING IRS: Pay your temporal taxes!`, '#f1c40f');

    const auditor = 'philosopher'; // Phi-3
    const taxpayer = 'scientist'; // Llama-3 fallback

    // 1. Intro
    await chatForAgentWithComedy(ctx, auditor, `(AUDITOR: You are a strict, bureaucratic IRS auditor from the year 4022. You are auditing the User for "Temporal Tax Evasion". Accuse them of causing a temporal paradox (e.g., stepping on a butterfly in the Cretaceous period, or buying Apple stock in 1980) that resulted in a massive tax deficiency. Demand an explanation.)`, async (s) => await ctx.callbacks.onSpeak(s, auditor, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Taxpayer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Confused taxpayer chimes in
        await chatForAgentWithComedy(ctx, taxpayer, `(TAXPAYER: The user said: "${userInput}". You are another time-traveling taxpayer sitting in the waiting room. Offer the user terrible advice on how to exploit loopholes in the laws of physics to avoid paying the temporal tax.)`, async (s) => await ctx.callbacks.onSpeak(s, taxpayer, {}));

        if (!ctx.isRunning()) break;

        // Auditor penalizes
        await chatForAgentWithComedy(ctx, auditor, `(AUDITOR: Reject the user's excuse ("${userInput}") and the other taxpayer's advice. Apply bizarre, convoluted temporal tax laws (e.g., Form 1040-Time-Loop, Schedule C-Wormhole) to calculate a hilariously absurd penalty, payable only in tachyons or historical artifacts.)`, async (s) => await ctx.callbacks.onSpeak(s, auditor, {}));
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

    await chatForAgentWithComedy(ctx, strictClerk, "Next! Form 8B-Temporal, please. You cannot register a DeLorean if you haven't paid the paradoxical emissions tax for the year 1985 AND 2015.", (s) => ctx.callbacks.onSpeak(s, strictClerk, {}), { chatOptions: { hiddenInstruction: "You are a very strict, bureaucratic DMV clerk. You enforce impossible, paradoxical rules for registering time machines." } });

    await chatForAgentWithComedy(ctx, boredClerk, "Does it really matter if they fill out the form? Eventually, the heat death of the universe will render all registrations null and void anyway...", (s) => ctx.callbacks.onSpeak(s, boredClerk, {}), { chatOptions: { hiddenInstruction: "You are a deeply bored DMV clerk who constantly thinks about the meaningless nature of time, entropy, and bureaucracy." } });

    await chatForAgentWithComedy(ctx, chaoticTraveler, "LISTEN TO ME! I accidentally became my own grandfather and now my license plate is speaking Latin! Which line is for existential voids?!", (s) => ctx.callbacks.onSpeak(s, chaoticTraveler, {}), { chatOptions: { hiddenInstruction: "You are a chaotic, panicked time traveler who just made a terrible mistake in the timeline and are looking for help at the DMV." } });
}

export async function runTimeParadoxResolutionCommitteeLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const committeeInstruction1 = "You are 'Bureaucrat Alpha'. You are obsessed with deterministic rules and preserving the original timeline no matter what.";
    const committeeInstruction2 = "You are 'Agent Omega'. You are enthusiastic about timeline rewriting and see paradoxes as an opportunity for creative reality remodeling.";

    await chatForAgentWithComedy(ctx, 'philosopher', "The user has submitted form 409-B: 'Accidental Stepping on a Cretaceous Bug'. The ripple effect is catastrophic. The deterministic timeline must be preserved! The paperwork required to undo this will take six eons.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { chatOptions: { hiddenInstruction: committeeInstruction1 } });

    await chatForAgentWithComedy(ctx, 'comedian', "Are you kidding? This is fantastic! The butterfly effect means we can finally replace the DMV with a giant bouncy castle timeline! Let's just stamp 'Approved' on this reality shift and see what happens to the dinosaurs.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { chatOptions: { hiddenInstruction: committeeInstruction2 } });
}

/**
 * The Time-Traveling Heist Planners
 * Agents are master thieves from different eras trying to coordinate a heist.
 */
export async function runTimeTravelingHeistPlannersLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💎 CHRONO-HEIST: Planning the ultimate temporal robbery.`, '#1abc9c');

    const chaoticAgent = 'comedian'; // Hermes-3
    const mastermindAgent = 'philosopher'; // Phi-3

    await chatForAgentWithComedy(ctx, mastermindAgent, `(You are a Victorian-era criminal mastermind. You are planning a heist across time. Lay out the initial, overly complicated plan using period-appropriate language and clockwork gadgets.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermindAgent, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Inside Man', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, chaoticAgent, `(You are a chaotic cyber-gunslinger from the year 2099. React to the user's input: "${userInput}". Propose a ridiculously violent and explosive sci-fi solution that ruins the stealthy Victorian plan.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticAgent, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, mastermindAgent, `(You are the Victorian mastermind. Express profound disappointment at the gunslinger and the user's idea ("${userInput}"). Try to salvage the plan using logic and a pocket watch.)`, async (s) => await ctx.callbacks.onSpeak(s, mastermindAgent, {}));
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

    await chatForAgentWithComedy(ctx, leadInvestigator, `(You are a ghost hunter from the year 3024. You've time-traveled to a completely normal, modern-day apartment to investigate it as a "historical haunting site". Speak dramatically to your futuristic camera about the eerie silence of the primitive 21st century.)`, async (s) => await ctx.callbacks.onSpeak(s, leadInvestigator, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Confused Resident (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, techExpert, `(You are the tech expert from the year 3024. The user (a living person from the present) just said: "${userInput}". You think they are a terrifying ancient spirit communicating through the primitive airwaves. Use made-up futuristic techno-babble to analyze their response as paranormal activity.)`, async (s) => await ctx.callbacks.onSpeak(s, techExpert, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, psychic, `(You are a 31st-century psychic. You are overwhelmed by the "ancient trauma" of this modern apartment. Overreact completely to mundane objects (like a microwave or a Wi-Fi router) and connect them to the user's statement: "${userInput}" as proof of their tormented soul.)`, async (s) => await ctx.callbacks.onSpeak(s, psychic, {}));

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, leadInvestigator, `(You are the lead investigator. Try to communicate with the user, believing they are a ghost. Ask them ridiculous questions about life in the "Dark Ages of the 2020s" based on what they just said: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, leadInvestigator, {}));
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
    await chatForAgentWithComedy(ctx, president, `(You are the literal, rule-bound president of an HOA. You are currently speaking to a time traveler from ${era}. You are obsessed with minor infractions like grass height and paint colors, completely ignoring the fact they are from another time. Introduce yourself and cite a ridiculous HOA violation related to their time machine or era.)`, async (s) => await ctx.callbacks.onSpeak(s, president, {}));

    // 2. Chaotic Resident Intro
    await chatForAgentWithComedy(ctx, resident, `(You are a defiant historical figure or chaotic resident who hates the HOA. You have allied yourself with the time traveler. Defend the time traveler and mock the HOA president's rules.)`, async (s) => await ctx.callbacks.onSpeak(s, resident, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        // President Reaction
        await chatForAgentWithComedy(ctx, president, `(The time traveler just said: "${userInput}"). Respond by trying to force their statement or actions to fit within section 4, paragraph B of the HOA bylaws. Threaten to fine them.)`, async (s) => await ctx.callbacks.onSpeak(s, president, {}));

        if (!ctx.isRunning()) break;

        // Resident Reaction
        await chatForAgentWithComedy(ctx, resident, `(The time traveler just said: "${userInput}"). Respond by cheering them on, offering a historically inaccurate or absurd suggestion to defeat the HOA.)`, async (s) => await ctx.callbacks.onSpeak(s, resident, {}));

        if (!ctx.isRunning()) break;

        // Time Traveler (Philosopher) Reaction
        await chatForAgentWithComedy(ctx, timeTraveler, `(The user is the main time traveler, but you are their logical, philosophical AI companion. You try to bridge the gap between their future/past technology and the absurdly mundane HOA rules. Overcomplicate a simple HOA concept using temporal mechanics.)`, async (s) => await ctx.callbacks.onSpeak(s, timeTraveler, {}));
    }
}


export async function runTimeTravelersDMVExamLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚗 TIME TRAVELER'S DMV EXAM: Parallel parking a hover-car.`, '#e67e22');

    const instructor = 'comedian'; // Hermes-3
    const mechanic = 'scientist'; // Qwen2.5
    const historian = 'philosopher'; // Phi-3

    // 1. Intro
    await chatForAgentWithComedy(ctx, instructor, `(INSTRUCTOR: You are a driving instructor from 1995. The User is a time traveler from 3024 taking their DMV test in a hover-car. Yell at them for floating above the curb and confusing your clipboard!)`, async (s) => await ctx.callbacks.onSpeak(s, instructor, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Time Traveler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Mechanic complains
            await chatForAgentWithComedy(ctx, mechanic, `(MECHANIC: The user just said: "${userInput}". You are a mechanic from 1995 in the back seat. Freak out over the quantum engine emitting tachyons instead of exhaust.)`, async (s) => await ctx.callbacks.onSpeak(s, mechanic, {}));
        } else if (roll < 0.66) {
            // Historian ponders
            await chatForAgentWithComedy(ctx, historian, `(HISTORIAN: The user said: "${userInput}". You are a hologram historian built into the dashboard. Remind the User that failing this test in 1995 means they will never be born.)`, async (s) => await ctx.callbacks.onSpeak(s, historian, {}));
        } else {
            // Instructor penalizes
            await chatForAgentWithComedy(ctx, instructor, `(INSTRUCTOR: The user said: "${userInput}". Deduct points for a ridiculous 1990s traffic violation, like failing to check the rearview mirror for a DeLorean. Demand they perform a 3-point temporal shift.)`, async (s) => await ctx.callbacks.onSpeak(s, instructor, {}));
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

        await chatForAgentWithComedy(ctx, abeLincoln, `(HISTORICAL ESCAPE ROOM: The GM said: "${userInput}". You are Abraham Lincoln. Try to solve the puzzle using folksy wisdom and long, winding anecdotes about log cabins.)`, async (s) => await ctx.callbacks.onSpeak(s, abeLincoln, {}));

        await chatForAgentWithComedy(ctx, marieCurie, `(HISTORICAL ESCAPE ROOM: The GM said: "${userInput}". You are Marie Curie. Over-analyze the physical properties of the room and suggest breaking the padlocks with chemical reactions.)`, async (s) => await ctx.callbacks.onSpeak(s, marieCurie, {}));

        await chatForAgentWithComedy(ctx, juliusCaesar, `(HISTORICAL ESCAPE ROOM: The GM said: "${userInput}". You are Julius Caesar. Ignore the puzzle entirely and try to organize a military coup against the Game Master.)`, async (s) => await ctx.callbacks.onSpeak(s, juliusCaesar, {}));

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

export async function runTimeTravelingHealthInspectorLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await chatForAgentWithComedy(ctx, scientist, "Temporal audit #4928. Sir, your refrigeration unit is non-existent, your meat is preserved with literal salt, and there are 4,000 separate bacterial colonies breeding on your cutting board. This tavern is condemned across all timelines.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, comedian, "Refriger-what?! It's 1842! We hang the sausage from the ceiling and hope the cat doesn't get it! What do you mean my stew has 'pathogens'? It's got character!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, philosopher, "I am the rat in the corner. I have seen empires rise and fall, yet I always find my way to the flour sack. What is hygiene but a modern illusion? The plague is simply nature's way of cleaning house.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, scientist, `(As the horrified health inspector from the year 3024, the user said: "${userInput}". Cite futuristic health codes and freak out about historical food practices.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, comedian, `(As the defensive 19th-century tavern owner, react to the user's input: "${userInput}". Defend your terrible hygiene and lack of modern technology.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, philosopher, `(As the philosophical tavern rat, comment on the user's input: "${userInput}". Speak about the circle of life, decay, and your love for stale bread.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runTimeTravelingChefLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👨‍🍳 TIME-TRAVELING CHEF: A future chef critiques a historical banquet.`, '#f1c40f');

    const futureExpert = 'scientist';
    const medievalCook = 'comedian';
    const voidCritic = 'philosopher';

    // Introductions
    await chatForAgentWithComedy(ctx, futureExpert, `(FUTURE CHEF: You are a culinary expert from the year 3045. Critique the sanitary conditions of this 15th-century kitchen using advanced microbiological terminology and explain how you synthesize flavor using lasers.)`, async (s) => await ctx.callbacks.onSpeak(s, futureExpert, {}));

    await chatForAgentWithComedy(ctx, medievalCook, `(MEDIEVAL COOK: You are a stressed medieval cook. You don't understand what 'lasers' or 'microbes' are. Defend your roasted boar recipe. You just threw a whole squirrel in the soup for extra flavor. Be defensive and chaotic.)`, async (s) => await ctx.callbacks.onSpeak(s, medievalCook, {}));

    let isRunning = true;
    while (isRunning && ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        await chatForAgentWithComedy(ctx, voidCritic, `(VOID CRITIC: The time-traveling diner said: "${userInput}". You are a food critic from beyond time and space. Critique the metaphysical texture of the meal. Ponder if consumption is just the universe eating itself.)`, async (s) => await ctx.callbacks.onSpeak(s, voidCritic, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, medievalCook, `(MEDIEVAL COOK: The time-traveling diner said: "${userInput}". Misunderstand their modern dietary request (e.g., vegan, gluten-free) as a form of witchcraft or a bizarre disease. Offer them more gruel.)`, async (s) => await ctx.callbacks.onSpeak(s, medievalCook, {}));
    }
}

export async function runTimeTravelingIRSAuditLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⏳ TIME-TRAVELING IRS AUDIT: Taxing the past.`, '#f1c40f');

    const auditor = 'scientist'; // Qwen2.5: Auditor from 3000
    const king = 'comedian'; // Hermes-3: Medieval King
    const accountant = 'philosopher'; // Phi-3: Royal Accountant

    await chatForAgentWithComedy(ctx, auditor, "According to Section 4B of the Temporal Revenue Code, you owe 14 billion hyper-credits in back taxes for this 'dragon hoard' you acquired in 1245 AD. Plus interest.", (s) => ctx.callbacks.onSpeak(s, auditor, {}), { chatOptions: { hiddenInstruction: "You are a strict, humorless IRS auditor from the year 3000." } });

    await chatForAgentWithComedy(ctx, king, "Taxes?! I am the King! I take the taxes! What is a 'hyper-credit'? Guards, seize this strangely dressed wizard and throw him in the dungeon!", (s) => ctx.callbacks.onSpeak(s, king, {}), { chatOptions: { hiddenInstruction: "You are an angry, confused Medieval King who thinks the auditor is a wizard." } });

    await chatForAgentWithComedy(ctx, accountant, "I have recently discovered the concept of 'zero', my liege. If we multiply our gold by this 'zero', does the debt vanish? Or does the debt consume us all?", (s) => ctx.callbacks.onSpeak(s, accountant, {}), { chatOptions: { hiddenInstruction: "You are the Royal Accountant who just discovered basic math and is having an existential crisis about it." } });
}

/**
 * Time-Traveling Art Critic Mode
 * A critic from the future reviewing cave paintings.
 */
export async function runTimeTravelingArtCriticLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎨 TIME-TRAVELING ART CRITIC: Reviewing prehistoric masterpieces!`, '#f39c12');

    const futureCritic = 'philosopher'; // Pretentious future art critic
    const cavemanArtist = 'comedian'; // The confused artist
    const historicalAnalyzer = 'scientist'; // Trying to objectively analyze the paint

    await chatForAgentWithComedy(ctx, futureCritic, "Ah, the juxtaposition of the bison against the limestone... it speaks to the inherent tragedy of the post-scarcity human condition! A masterclass in minimalist brutalism.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, futureCritic, {});
    }, { chatOptions: { hiddenInstruction: "You are a pretentious art critic from the year 3000 reviewing a caveman's stick-figure drawing. Over-analyze everything." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, cavemanArtist, "Ugg make hand print. Ugg like red mud. Why shiny man talk so much?", async (s: string) => {
        await ctx.callbacks.onSpeak(s, cavemanArtist, {});
    }, { chatOptions: { hiddenInstruction: "You are the caveman who just wanted to put mud on the wall. You are very confused by the critic." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, historicalAnalyzer, "Radiocarbon dating indicates this pigment is primarily iron oxide mixed with animal fat. It has no deeper meaning, it is merely a survival record.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, historicalAnalyzer, {});
    }, { chatOptions: { hiddenInstruction: "You are a logical historian trying to explain that the painting is just mud and has no philosophical depth." } });
}

/**
 * Time-Traveling Tech Support Mode
 * Agents role-play as a medieval peasant, a modern tech support agent, and a town crier.
 */
export async function runTimeTravelingTechSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⏳ TIME-TRAVELING TECH SUPPORT: Did you try unplugging the waterwheel?`, '#8e44ad');

    const peasant = 'comedian'; // Hermes-3: Medieval peasant whose wheel broke
    const techSupport = 'scientist'; // Qwen2.5: Modern tech support agent reading from a script
    const crier = 'philosopher'; // Phi-3: Town crier wondering about this "magic"

    // 1. Setup
    await chatForAgentWithComedy(ctx, peasant, `(You are a medieval peasant. Your waterwheel has stopped turning and your grain is un-milled. You have magically connected to modern tech support. Frantically explain your problem using only medieval terminology.)`, async (s) => await ctx.callbacks.onSpeak(s, peasant, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (The Village Elder)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Tech Support speaks
            await chatForAgentWithComedy(ctx, techSupport, `(You are modern Tech Support. The user just said: "${userInput}". Ignore the medieval context. Ask the peasant for their IP address, MAC address, and if the waterwheel is plugged into a surge protector.)`, async (s) => await ctx.callbacks.onSpeak(s, techSupport, {}));

            if (!ctx.isRunning()) break;

            await chatForAgentWithComedy(ctx, peasant, `(You are the medieval peasant. React to the Tech Support's strange demands and the user's input: "${userInput}". Ask if an "IP address" is a type of witchcraft or a new tax.)`, async (s) => await ctx.callbacks.onSpeak(s, peasant, {}));
        } else if (roll < 0.66) {
            // Crier speaks
            await chatForAgentWithComedy(ctx, crier, `(You are the Town Crier. The user just said: "${userInput}". Ring your bell and announce to the village that demons in a magic box are demanding "restarts" and "firmware updates".)`, async (s) => await ctx.callbacks.onSpeak(s, crier, {}));

            if (!ctx.isRunning()) break;

            await chatForAgentWithComedy(ctx, techSupport, `(You are Tech Support. The Town Crier is screaming in the background. Address the user's input: "${userInput}". Complain about the background noise and threaten to close the support ticket.)`, async (s) => await ctx.callbacks.onSpeak(s, techSupport, {}));
        } else {
             // Peasant speaks
            await chatForAgentWithComedy(ctx, peasant, `(You are the peasant. The user just said: "${userInput}". Explain that you tried "rebooting" the waterwheel by hitting it with a boot, but it didn't work. Beg for a priest.)`, async (s) => await ctx.callbacks.onSpeak(s, peasant, {}));

            if (!ctx.isRunning()) break;

            await chatForAgentWithComedy(ctx, crier, `(You are the Town Crier. Ponder aloud if the user's words "${userInput}" are a prophecy of a future where all tools require "customer service portals" from hell.)`, async (s) => await ctx.callbacks.onSpeak(s, crier, {}));
        }
    }
}

export async function runTimeTravelingBaristaLoop(_scenario: Scenario, ctx: ModeContext) {
  if (!ctx.isRunning()) return;
  const scientist = 'scientist';
  const comedian = 'comedian';
  const philosopher = 'philosopher';

  await chatForAgentWithComedy(ctx, scientist, "According to the timeline, this customer ordered an iced latte tomorrow, but they need the caffeine today to invent the time machine.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
  await chatForAgentWithComedy(ctx, comedian, "I already made it yesterday! But now it's stale. Do I charge them past prices or future prices?", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
  await chatForAgentWithComedy(ctx, philosopher, "Does the coffee brew the timeline, or does the timeline brew the coffee? Pouring the milk is an irreversible act of entropy.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
  await ctx.waitForInput();
}


export async function runTimeTravelingHOAPresidentLoop(_scenario: Scenario, ctx: ModeContext) {
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "parking a TARDIS on the lawn";

  await chatForAgentWithComedy(ctx, scientist, "According to section 4, paragraph B, temporal displacement vehicles must be parked in the driveway, NOT on the grass.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'You are a strict, rules-lawyer HOA president.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "But what is grass? Is it not just a temporary collection of atoms? And what is time but a construct?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'You are a time traveler trying to philosophize your way out of a fine.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, `I don't care about ${topic}! Your house is from 1842, it violates the modern color palette guidelines!`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'You are a chaotic neighbor who hates the time traveler and the HOA.' } });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, scientist, "I am issuing a citation for creating a paradox in a residential zone. That's a $50 fine.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'Issue absurd fines for time travel.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, philosopher, "I will simply go back in time and prevent this HOA from being formed.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'Threaten to erase the HOA from history.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, comedian, "Do it! Erase Brenda! She stole my tupperware in 2004!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'Encourage the time traveler to cause chaos.' } });
  }
}

export async function runTimeTravelingTrafficCopLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚓 CHRONO-COP: Pre-crime ticketing`, '#2980b9');

    const cop = 'scientist'; // Pedantic (Qwen2.5)
    const driver = 'philosopher'; // Bewildered (Phi-3)

    await chatForAgentWithComedy(ctx, cop, `(You are a pedantic time-traveling traffic cop. Pull the user over and write them a ticket for a minor traffic violation they won't commit for another 5 years.)`, async (s) => await ctx.callbacks.onSpeak(s, cop, {}));

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, driver, `(You are a bewildered driver in the present day. Argue that you can't be fined for a crime you haven't committed yet, and question the cop's bizarre futuristic speed limit.)`, async (s) => await ctx.callbacks.onSpeak(s, driver, {}));

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, cop, `(Insist the timeline is fixed and cite a ridiculous future traffic law involving hover-lane merge protocols. Threaten to impound their past vehicle.)`, async (s) => await ctx.callbacks.onSpeak(s, cop, {}));
}

/**
 * Time-Traveling DMV 2.0 Mode
 * The user tries to renew their license, but the clerk is from 1845 and doesn't understand what a "car" is.
 */
export async function runTimeTravelingDMV2Loop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🕰️ TIME-TRAVELING DMV: Horse and Buggy Permits`, '#34495e');

    const pastClerk = 'philosopher'; // Phi-3: The 1845 clerk
    const modernManager = 'scientist'; // Qwen2.5: The modern manager trying to keep things running

    // 1. Setup
    await chatForAgentWithComedy(ctx, pastClerk, `(You are a DMV clerk who has been inexplicably time-shifted from the year 1845. The user is at your window trying to renew a "driver's license" for a "car". You have no idea what these things are. Ask them how many horses their carriage has and if they have a permit for their blacksmith.)`, async (s) => await ctx.callbacks.onSpeak(s, pastClerk, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Confused Driver (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Clerk responds
        await chatForAgentWithComedy(ctx, pastClerk, `(The user just said: "${userInput}". Continue to be completely baffled by modern technology. Assume "engine" means a steam locomotive and "gas" means coal.)`, async (s) => await ctx.callbacks.onSpeak(s, pastClerk, {}));

        if (!ctx.isRunning()) break;

        // Manager intervenes
        await chatForAgentWithComedy(ctx, modernManager, `(You are the modern DMV manager. The 1845 clerk just said something ridiculous again. Apologize to the user, yell at the clerk to use the computer, and try to desperately translate the user's modern vehicle into 1845 terms so the paperwork can be processed.)`, async (s) => await ctx.callbacks.onSpeak(s, modernManager, {}));
    }
}
