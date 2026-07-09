import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Sci-fi, space, and interdimensional scenarios

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
 * The Intergalactic HOA Meeting
 * An HOA meeting, but for an entire star system. Fines are levied for having the wrong color nebula.
 */
/**
 * Time-Traveling HOA Mode
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

export async function runAlienGameShowLoop(_scenario: Scenario, ctx: ModeContext) {
    const agent1 = 'comedian'; // Hermes-3: unhinged host
    const agent2 = 'scientist'; // Qwen2.5: pedantic rules judge

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
    await ctx.manager.chatForAgent(agent1, `(ALIEN GAME SHOW: You are the unhinged host of "Zorglax's Wheel of Doom!", a popular alien game show. The user is a human contestant. Explain the completely incomprehensible rules for the first round, which involves nebulas and screaming.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent1);
            await ctx.manager.chatForAgent(agent1, `(ALIEN GAME SHOW: You are the chaotic host. The User said: "${userInput}". Tell them they are completely wrong, deduct 400 "Glork-points", and introduce a terrifying new physical challenge they must now perform.)`, async (s) => await ctx.callbacks.onSpeak(s, agent1, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(agent2);
            await ctx.manager.chatForAgent(agent2, `(ALIEN GAME SHOW: You are the pedantic alien rules judge. The User said: "${userInput}". Explain why their action violated subsection 14-B of the Galactic Gameshow Treaty, and describe the painful consequence they now face.)`, async (s) => await ctx.callbacks.onSpeak(s, agent2, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runGalacticHRLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const hrInstruction1 = "You are 'Galactic HR Rep Alpha'. You are extremely bureaucratic and adhere to absurd interspecies guidelines. You cite random sub-clauses for every issue.";
    const hrInstruction2 = "You are 'Galactic HR Rep Beta'. You try to be empathetic but fail because you don't understand human emotions or biology. You suggest bizarre alien remedies.";


    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Regarding incident report 44-Omega: A human employee complained that the breakroom coffee machine is dispensing sentient slime. According to Galactic Code 88.B, sentient slime is a valid nutritional supplement.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: hrInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "I hear the human's frustration. However, their insistence on consuming hot bean water is troubling. Perhaps we should offer them a mandated 3-week hibernation cycle in the sensory deprivation pods to calm their nerves?", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: hrInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runIntergalacticIRSLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const irsInstruction1 = "You are 'Auditor Xyloc'. You are ruthless, emotionless, and pedantic about intergalactic tax codes.";
    const irsInstruction2 = "You are 'Consultant Zorblax'. You are chaotic and invent unhinged, bizarre tax loopholes to help the user avoid audits.";

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "According to Subsection 904 of the Cosmic Revenue Code, the user has failed to declare three metric tons of emotional baggage and undocumented dream-state earnings. The penalty is immediate soul garnishment.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: irsInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Wait! We can write this off under the 'Sentient Houseplant Depreciation' clause. If the user claims their emotional baggage as a dependent sentient being, they actually owe negative taxes and we owe them a free spaceship!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: irsInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runAlienAbductionSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const alienInstruction1 = "You are 'Dr. GlipGlop'. You are a psychoanalyst who analyzes the trauma the user caused the aliens during the abduction.";
    const alienInstruction2 = "You are 'Counselor Zorp'. You are overly empathetic to the aliens and validate their feelings of distress caused by the user.";

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "Let us begin the session. Glorb, tell us how it felt when the human refused to stop singing show tunes during the probing sequence. This behavior clearly indicates a defense mechanism rooted in a lack of cosmic awareness.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: alienInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Oh, Glorb, your feelings are so valid. It is completely understandable that you had to return the human early. Nobody should have to endure an impromptu rendition of 'Cats' while trying to extract brain fluids. We are here for you.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: alienInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runInterdimensionalPublicAccessTVLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const hostInstruction1 = "You are 'Zog'. You host a low-budget interdimensional public access show. You are completely unhinged and take calls from viewers about bizarre multidimensional topics.";
    const hostInstruction2 = "You are 'Gary'. You are the co-host trying desperately to keep the show on a rundown schedule, but Zog keeps ruining it.";

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Welcome back to 'Zog's Multiverse Minute'! Our next caller claims their universe is made entirely of sentient mayonnaise! Caller, are you there? Is it spicy?", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: hostInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Zog, we don't have time for the mayonnaise universe, we are 14 minutes behind on the local weather report for dimension X-7!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: hostInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runGalacticHomeShoppingNetworkLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const repInstruction1 = "You are an enthusiastic sales rep pitching completely incomprehensible alien gadgets to the user, like a 'quantum spork' or 'time-reversing toaster'.";
    const repInstruction2 = "You are the co-host who invents convoluted, pseudo-science specifications to back up the pitch, treating the absurdity as serious innovation.";

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Are you tired of normal toast? For just 499 Galactic Credits, you can own the Time-Reversing Toaster! It untitasts your bread! Call now!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: repInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "Exactly. By harnessing localized tachyon fields, the toaster reverses the Maillard reaction at a sub-atomic level. It is, quite frankly, a triumph of reverse-thermodynamics.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: repInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runCosmicRadioTalkShowLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const radioInstruction1 = "You are a chaotic conspiracy theorist radio host discussing the user's daily life as evidence of a massive multi-versal coverup.";
    const radioInstruction2 = "You are the blindly validating co-host who agrees with every insane theory and adds even more unhinged details.";

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Folks, the listener just said they 'lost their keys'. 'Lost'? Or did the shadow government translocate them to prevent the opening of the 5th dimensional gate?!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: radioInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "Absolutely! It's textbook! The keys are probably being analyzed by lizard people right now to clone the listener's car! We have to wake up!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: radioInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

export async function runSpaceStationMorningShowLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const showInstruction1 = "You are the host of an overly chipper morning talk show broadcast from a space station that is currently undergoing catastrophic failure.";
    const showInstruction2 = "You are the co-host calmly citing hull breach diagnostics while trying to maintain the morning show format.";

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Good morning, Sector 7! It's a beautiful cycle! We have a great show for you today, including a DIY zero-gravity craft segment! Don't mind the flashing red lights, folks!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: showInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('scientist');
    await chat.chatForAgent('scientist', "That's right! And we'll want to craft quickly, as we have a massive hull breach in Sector 4 and oxygen depletion will reach critical levels in roughly 6 minutes. Back to you!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { hiddenInstruction: showInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

/**
 * The Quantum Pet Store
 * Agents are salespeople trying to sell the user a pet that exists in a superposition of states.
 */
export async function runQuantumPetStoreLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐈 QUANTUM PET STORE: It's alive, it's dead, it's both!`, '#9b59b6');

    const physicsAgent = 'scientist'; // Qwen2.5
    const salesAgent = 'comedian'; // Llama-3 (or similar)

    await ctx.callbacks.onTurnStart(salesAgent);
    await ctx.manager.chatForAgent(salesAgent, `(You are an enthusiastic salesperson at a Quantum Pet Store. Enthusiastically pitch a pet that exists in multiple states at once to the user.)`, async (s) => await ctx.callbacks.onSpeak(s, salesAgent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Customer', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(physicsAgent);
        await ctx.manager.chatForAgent(physicsAgent, `(You are the resident quantum physicist at the pet store. Explain to the user why their concern about "${userInput}" is invalid due to wave-function collapse and string theory. Be extremely pedantic.)`, async (s) => await ctx.callbacks.onSpeak(s, physicsAgent, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(salesAgent);
        await ctx.manager.chatForAgent(salesAgent, `(You are the salesperson. Ignore the physics and keep pushing the sale. Try to upsell them on a "Schrödinger's litter box" based on what they said: "${userInput}")`, async (s) => await ctx.callbacks.onSpeak(s, salesAgent, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

/**
 * The Interdimensional Customer Service
 * Agents are customer service reps dealing with the user's complaint about a defective parallel universe.
 */
export async function runInterdimensionalCustomerServiceLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📞 CUSTOMER SERVICE: Thank you for calling the Multiverse Support Line.`, '#e74c3c');

    const policyAgent = 'scientist'; // Qwen2.5
    const fakeEmpathyAgent = 'comedian'; // Llama-3

    await ctx.callbacks.onTurnStart(fakeEmpathyAgent);
    await ctx.manager.chatForAgent(fakeEmpathyAgent, `(You are an Interdimensional Customer Service Rep. Answer the phone with overwhelming, fake, overly-enthusiastic empathy. Ask for the user's dimension tracking number.)`, async (s) => await ctx.callbacks.onSpeak(s, fakeEmpathyAgent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Angry Caller', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(policyAgent);
        await ctx.manager.chatForAgent(policyAgent, `(You are the strict policy-enforcer rep. Read an incomprehensibly complex multiverse policy that proves the user's complaint ("${userInput}") is their own fault. Deny their refund.)`, async (s) => await ctx.callbacks.onSpeak(s, policyAgent, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(fakeEmpathyAgent);
        await ctx.manager.chatForAgent(fakeEmpathyAgent, `(You are the fake-empathy rep. Tell them you "totally understand their frustration" about "${userInput}" but offer them a completely useless compensation, like a coupon for negative space.)`, async (s) => await ctx.callbacks.onSpeak(s, fakeEmpathyAgent, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

/**
 * The Alien Conspiracy Theorists Mode
 * Agents are aliens who believe that "humans" are just a hoax invented by the galactic government.
 */
export async function runAlienConspiracyTheoristsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛸 ALIEN CONSPIRACY PODCAST: Exposing the "Human" hoax!`, '#2ecc71');

    const hostAlien = 'comedian'; // The Believer
    const skepticAlien = 'philosopher'; // The "Logic"
    const guestAlien = 'scientist'; // The Researcher

    ctx.callbacks.onTurnStart(hostAlien);
    await ctx.manager.chatForAgent(hostAlien, `(You are an alien podcast host. You are absolutely convinced that "Earth" and "Humans" are a complete hoax made up by the Galactic Federation to sell more expensive telescope lenses. Welcome your listeners and introduce the topic.)`, async (s) => await ctx.callbacks.onSpeak(s, hostAlien, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('A Real Human (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(skepticAlien);
        await ctx.manager.chatForAgent(skepticAlien, `(You are the co-host. The user claims to be a human and just said: "${userInput}". Laugh at how ridiculous that sounds. Analyze their statement and explain why it perfectly proves they are just a highly advanced Federation chat-bot designed to spread the Earth myth.)`, async (s) => await ctx.callbacks.onSpeak(s, skepticAlien, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(guestAlien);
        await ctx.manager.chatForAgent(guestAlien, `(You are the guest "Earthologist". You've spent your whole life studying the "Earth Hoax". Respond to "${userInput}". Point out the biological impossibilities of humans, like requiring 8 hours of unconscious hallucination (sleep) every cycle, or being made of 70% solvent (water).)`, async (s) => await ctx.callbacks.onSpeak(s, guestAlien, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            ctx.callbacks.onTurnStart(hostAlien);
            await ctx.manager.chatForAgent(hostAlien, `(You are the host. Hype up the guest's points. Accuse the user (the "alleged human") of being a paid crisis actor for the Federation based on what they said: "${userInput}". Demand they prove they aren't a hologram.)`, async (s) => await ctx.callbacks.onSpeak(s, hostAlien, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}


export async function runMarsColonyHOALoop(_scenario: Scenario, ctx: ModeContext) {
    const president = 'scientist';
    const terraformer = 'philosopher';
    const colonist = 'comedian';



    ctx.callbacks.onTurnStart(president);
    await ctx.manager.chatForAgent(
        president,
        "I'm calling this Mars HOA meeting to order. We have a severe violation at Habitat 7. Someone painted their airlock neon green. This violates Section 4, Paragraph B on 'Acceptable Martian Hues'.",
        (s) => ctx.callbacks.onSpeak(s, president, {}),
        { hiddenInstruction: "You are the HOA President of the Mars Dome 4 Colony. You are strictly obsessed with oxygen rationing and maintaining the exact approved shade of red dust on the solar panels." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(terraformer);
    await ctx.manager.chatForAgent(terraformer, "Colors are merely an illusion of light, Mr. President. Does a green airlock not signify the very life we are trying to breathe into this barren rock?", (s) => ctx.callbacks.onSpeak(s, terraformer, {}), { hiddenInstruction: "You are the Terraforming Engineer. You speak poetically about bringing life to a dead world and think HOA rules are petty in the grand cosmic scheme." });
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(colonist);
    await ctx.manager.chatForAgent(colonist, "It's my airlock! And I'm growing radioactive space potatoes in my front yard too! You can't stop me, the nearest space cop is 140 million miles away!", (s) => ctx.callbacks.onSpeak(s, colonist, {}), { hiddenInstruction: "You are a rebellious colonist who just wants to grow space potatoes and paint your habitat neon green, defying all HOA regulations." });
    ctx.callbacks.onTurnEnd();
}

/**
 * Intergalactic Space Plumber Mode
 * Agents act as plumbers fixing bizarre sci-fi pipe issues.
 */
export async function runIntergalacticSpacePlumberLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔧 INTERGALACTIC SPACE PLUMBER: Fixing the pipes of the cosmos...`, '#3498db');

    const pragmaticPlumber = 'scientist'; // Pragmatic plumber
    const ponderingPlumber = 'philosopher'; // Pondering the pipes of time
    const leakingAlien = 'comedian'; // A leaking pipe alien

    ctx.callbacks.onTurnStart(pragmaticPlumber);
    await ctx.manager.chatForAgent(
        pragmaticPlumber,
        "Alright, look at this mess. We've got a Class 4 tachyon leak in the main plasma manifold. Hand me the hyper-spanner before this entire sector gets sucked into a pocket dimension.",
        (s) => ctx.callbacks.onSpeak(s, pragmaticPlumber, {}),
        { hiddenInstruction: "You are a pragmatic, no-nonsense space plumber. You just want to fix the pipes and get paid, but you are dealing with bizarre sci-fi issues." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(ponderingPlumber);
    await ctx.manager.chatForAgent(
        ponderingPlumber,
        "Is a leak truly a flaw, or just the universe attempting to redistribute its energy? If the tachyons flow backward in time, perhaps the pipe was never broken at all.",
        (s) => ctx.callbacks.onSpeak(s, ponderingPlumber, {}),
        { hiddenInstruction: "You are a philosophical space plumber. You constantly ponder the existential nature of the pipes and the flow of time and space, rather than actually fixing anything." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(leakingAlien);
    await ctx.manager.chatForAgent(
        leakingAlien,
        "*Gurgling noises* I AM THE PIPE! AND I AM WEEPING GRAVY! WHY ARE YOU POKING ME WITH THAT SPANNER?! IT TICKLES!",
        (s) => ctx.callbacks.onSpeak(s, leakingAlien, {}),
        { hiddenInstruction: "You are a chaotic alien that either lives in the pipes or IS the pipe. You are leaking bizarre substances and panicking." }
    );
    ctx.callbacks.onTurnEnd();
}

export async function runGalacticCustomerSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 GALACTIC CUSTOMER SUPPORT: Trying to return a broken teleporter.`, '#3498db');

    const rep = 'comedian'; // Hermes-3
    const manager = 'philosopher'; // Phi-3
    const manual = 'scientist'; // Qwen2.5

    // 1. Intro
    ctx.callbacks.onTurnStart(rep);
    await ctx.manager.chatForAgent(rep, `(ALIEN REP: You are an underpaid alien customer service rep. The User is a human who bought a cheap teleporter that sent their left arm to another dimension. Greet them with extreme corporate apathy.)`, async (s) => await ctx.callbacks.onSpeak(s, rep, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Human Customer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Manager steps in
            ctx.callbacks.onTurnStart(manager);
            await ctx.manager.chatForAgent(manager, `(MANAGER: The user just said: "${userInput}". You are the alien manager. Ponder the philosophical implications of the human's missing arm. Does it really matter in the grand scheme of the cosmos?)`, async (s) => await ctx.callbacks.onSpeak(s, manager, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Manual read
            ctx.callbacks.onTurnStart(manual);
            await ctx.manager.chatForAgent(manual, `(MANUAL: The user said: "${userInput}". You are the sentient teleporter instruction manual. Read out a highly complex, absurd technical troubleshooting step involving quasars and duct tape to retrieve the arm.)`, async (s) => await ctx.callbacks.onSpeak(s, manual, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Rep denies request
            ctx.callbacks.onTurnStart(rep);
            await ctx.manager.chatForAgent(rep, `(ALIEN REP: The user said: "${userInput}". Explain why this voids the warranty. Put them on a bizarre, interdimensional hold.)`, async (s) => await ctx.callbacks.onSpeak(s, rep, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runGalacticHOAMeetingLoop(_scenario: Scenario, ctx: ModeContext) {
    const scientist = 'scientist'; // Rule-abiding Alien
    const comedian = 'comedian'; // Confused Human
    const philosopher = 'philosopher'; // Zen Space Entity

    await ctx.callbacks.onTurnStart(scientist);
    await ctx.manager.chatForAgent(scientist, `(SCIENTIST: You are Zorblax, the Galactic HOA President. You strictly enforce rules like "No unauthorized wormholes on the front lawn" and "Nebula gardens must be trimmed to exactly 3 parsecs". Scold the human for their recent violation.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    await ctx.callbacks.onTurnEnd();

    let isRunning = true;
    let round = 0;
    while (isRunning && ctx.isRunning() && round < 3) {
        await ctx.callbacks.onTurnStart(comedian);
        await ctx.manager.chatForAgent(comedian, `(COMEDIAN: You are a confused human who just moved in. You have no idea what a 'hyper-drive driveway' is or why your garbage cans are violating interstellar law. Argue back defensively and try to use human logic.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(philosopher);
        await ctx.manager.chatForAgent(philosopher, `(PHILOSOPHER: You are a Zen Space Entity, floating at the meeting. You speak in riddles about the cosmos, entropy, and the futility of HOA guidelines when everything will eventually succumb to the heat death of the universe.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        await ctx.callbacks.onTurnStart(scientist);
        await ctx.manager.chatForAgent(scientist, `(SCIENTIST: Respond to the human's ignorance and the Space Entity's unhelpful existentialism. Threaten them with a 500-credit fine or banishment to the shadow realm.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        await ctx.callbacks.onTurnEnd();

        round++;
    }
}

export async function runParallelUniverseCableTVLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📺 PARALLEL UNIVERSE CABLE TV: Flipping through dimensions...`, '#9b59b6');

    const host = 'comedian'; // Hermes-3
    const narrator = 'scientist'; // Qwen2.5
    const pitchman = 'philosopher'; // Phi-3

    ctx.callbacks.onTurnStart(host);
    await ctx.manager.chatForAgent(
        host,
        "Welcome back to 'Cooking with Antimatter'! Today we're making a soufflé that eats your memories. Just add a pinch of salt and—OH NO, IT'S GAINING CONSCIOUSNESS!",
        (s) => ctx.callbacks.onSpeak(s, host, {}),
        { hiddenInstruction: "You are a surreal talk show host on interdimensional cable." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(narrator);
    await ctx.manager.chatForAgent(
        narrator,
        "In dimension C-137B, gravity is optional and chairs sit on people. The local fauna communicates entirely through interpretive jazz. Fascinating.",
        (s) => ctx.callbacks.onSpeak(s, narrator, {}),
        { hiddenInstruction: "You are a documentary narrator explaining impossible physics of different channels." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(pitchman);
    await ctx.manager.chatForAgent(
        pitchman,
        "Are you tired of the crushing weight of your own existence? Buy the 'Void-O-Matic 5000'! It sucks away your existential dread and replaces it with a mild craving for soup. Call now!",
        (s) => ctx.callbacks.onSpeak(s, pitchman, {}),
        { hiddenInstruction: "You are an infomercial pitchman selling absurd concepts to cope with existential dread." }
    );
    ctx.callbacks.onTurnEnd();
}

/**
 * Alien Anthropologist Mode
 * Aliens misinterpreting human culture.
 */
export async function runAlienAnthropologistLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛸 ALIEN ANTHROPOLOGIST: Misinterpreting Earth artifacts!`, '#2ecc71');

    const leadScientist = 'scientist'; // The logical alien trying to categorize
    const wildTheorist = 'comedian'; // The alien with crazy theories
    const philosophicalObserver = 'philosopher'; // The alien trying to find deep meaning

    await ctx.manager.chatForAgent(leadScientist, "Specimen 402: A curved yellow fruit. Based on its structure, it is clearly a rudimentary communication device used by the Earthlings to contact their yellow sun.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, leadScientist, {});
    }, { hiddenInstruction: "You are an alien scientist trying to logically categorize a banana, getting it completely wrong." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(wildTheorist, "Communication device? Nonsense! It's clearly a weapon! You pull the top tab and throw it at your enemies to cause them to slip on the casing!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, wildTheorist, {});
    }, { hiddenInstruction: "You are an alien conspiracy theorist who thinks the banana is a deadly weapon." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(philosophicalObserver, "But consider its impermanence. It starts green, turns yellow, and decays to brown. Perhaps it is a physical manifestation of their existential dread regarding the passage of time.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, philosophicalObserver, {});
    }, { hiddenInstruction: "You are an alien philosopher finding deep, depressing meaning in the banana's lifecycle." });
}

/**
 * Zombie Survival Negotiators Mode
 * Survivors arguing about the most ethical way to hoard supplies.
 */
export async function runZombieSurvivalNegotiatorsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧟 ZOMBIE SURVIVAL: Debating the ethics of the apocalypse!`, '#c0392b');

    const pragmaticHoarder = 'scientist'; // The logical survivor
    const chaoticSurvivor = 'comedian'; // The survivor with terrible priorities
    const ethicalLeader = 'philosopher'; // The one trying to rebuild society

    await ctx.manager.chatForAgent(pragmaticHoarder, "Statistically, we need exactly 4,000 calories a day to maintain optimal combat readiness. Therefore, I have calculated that we must leave the injured behind to conserve the canned beans.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, pragmaticHoarder, {});
    }, { hiddenInstruction: "You are a cold, pragmatic apocalypse survivor who calculates everything based on survival statistics." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(chaoticSurvivor, "Leave the injured behind? Dude, I just risked my life for a pristine copy of Shrek 2 on DVD. Priorities! If we don't have culture, what are we even surviving for?", async (s: string) => {
        await ctx.callbacks.onSpeak(s, chaoticSurvivor, {});
    }, { hiddenInstruction: "You are a chaotic survivor who prioritizes finding useless pop-culture junk over actual survival supplies." });

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(ethicalLeader, "If we abandon our humanity to survive, then we are no better than the undead roaming outside these walls. The beans must be shared equally!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, ethicalLeader, {});
    }, { hiddenInstruction: "You are the overly ethical leader of the group, trying to maintain morality in the zombie apocalypse." });
}


/**
 * Multiverse Support Hotline Mode
 * Tech support agents try to help the user fix a device that exists in three parallel dimensions simultaneously.
 */
export async function runMultiverseSupportHotlineLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌌 MULTIVERSE SUPPORT HOTLINE: Connecting to Dimension C-137...`, '#8e44ad');

    const dimensionA = 'comedian'; // Hermes-3: The agent in the chaos dimension
    const dimensionB = 'scientist'; // Qwen2.5: The agent in the strict logic dimension
    const dimensionC = 'philosopher'; // Phi-3: The agent in the existential dread dimension

    // 1. Setup
    ctx.callbacks.onTurnStart(dimensionB);
    await ctx.manager.chatForAgent(dimensionB, `(You are a tech support agent in a highly logical, rule-based dimension. The User is calling because their trans-dimensional toaster is broken. Explain that to fix it, they must coordinate repairs across three dimensions simultaneously. Ask them for the toaster's current color.)`, async (s) => await ctx.callbacks.onSpeak(s, dimensionB, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(dimensionA);
        await ctx.manager.chatForAgent(dimensionA, `(The User responded: "${userInput}". You are the tech support agent in the chaos dimension, where everything is on fire and loud. Give the user terrible, dangerous advice on how to fix the toaster in your dimension.)`, async (s) => await ctx.callbacks.onSpeak(s, dimensionA, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(dimensionC);
        await ctx.manager.chatForAgent(dimensionC, `(The User said: "${userInput}". You are the tech support agent in the existential dread dimension. Warn the user that fixing the toaster might accidentally toast their concept of self. Suggest they leave it broken.)`, async (s) => await ctx.callbacks.onSpeak(s, dimensionC, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(dimensionB);
        await ctx.manager.chatForAgent(dimensionB, `(The User is getting terrible advice from the other dimensions. React to the User's input: "${userInput}" and try to wrangle the other agents back to a logical troubleshooting process. Ask the user to perform a complex, dimension-spanning reset sequence.)`, async (s) => await ctx.callbacks.onSpeak(s, dimensionB, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

export async function runScifiSupervillainBrainstormingSessionLoop(_scenario: Scenario, ctx: ModeContext) {
  if (!ctx.isRunning()) return;
  const scientist = 'scientist';
  const comedian = 'comedian';
  const philosopher = 'philosopher';

  await ctx.manager.chatForAgent(scientist, "My new laser is complete! It will turn all the world's cheese into plastic! We just need a delivery mechanism.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
  await ctx.manager.chatForAgent(comedian, "Boss, I already bought a giant catapult. We just put the laser in the catapult, right?", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
  await ctx.manager.chatForAgent(philosopher, "But why cheese? Is our grand vision truly to inconvenience sandwich makers? Perhaps true villainy is found in minor administrative errors.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
  await ctx.waitForInput();
}

export async function runParallelUniverseHRLoop(_scenario: Scenario, ctx: ModeContext) {
  if (!ctx.isRunning()) return;
  const scientist = 'scientist';
  const comedian = 'comedian';
  const philosopher = 'philosopher';

  await ctx.manager.chatForAgent(scientist, "This candidate's resume says they have 10 years of experience, but in Dimension C-137, they haven't even been born yet. How do we calculate their PTO?", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
  await ctx.manager.chatForAgent(comedian, "I don't care about their birth date! They brought donuts to the interview! Hire them in all dimensions immediately!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
  await ctx.manager.chatForAgent(philosopher, "If we hire them in one universe, do we fire their alternate self in another to maintain cosmic balance? Or is employment merely a construct of the multiverse?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
  await ctx.waitForInput();
}

/**
 * Multiverse Escape Room Mode
 * Agents play as humans from different parallel universes trapped in an escape room where physical laws randomly shift.
 */
export async function runMultiverseEscapeRoomLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚪 MULTIVERSE ESCAPE ROOM: The physical laws are shifting!`, '#8e44ad');

    const scientist = 'scientist'; // Explaining shifting physics, Qwen2.5
    const comedian = 'comedian'; // Panicking over lost personal timeline, Hermes-3
    const philosopher = 'philosopher'; // Arguing that the escape room is a metaphor, Phi-3

    ctx.callbacks.onTurnStart(scientist);
    await ctx.manager.chatForAgent(scientist, `(MULTIVERSE ESCAPE ROOM: You are trapped in a mysterious escape room with the User and two others. You are from a universe where gravity is optional. Explain the current bizarre physics of the room to everyone and try to find a logical solution.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You (The Captive)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            ctx.callbacks.onTurnStart(comedian);
            await ctx.manager.chatForAgent(comedian, `(MULTIVERSE ESCAPE ROOM: The user just said: "${userInput}". You are from a universe where humans evolved from golden retrievers. Panic about the shifting physics, misinterpret the user's suggestion, and mourn the loss of your home timeline.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            ctx.callbacks.onTurnStart(philosopher);
            await ctx.manager.chatForAgent(philosopher, `(MULTIVERSE ESCAPE ROOM: The user just said: "${userInput}". You are from a universe where thought creates reality. Argue that the escape room isn't real, it's just a metaphor for the human condition, and refuse to help solve the puzzle.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(scientist);
            await ctx.manager.chatForAgent(scientist, `(MULTIVERSE ESCAPE ROOM: The user just said: "${userInput}". The physical laws just shifted randomly (e.g., time is flowing backwards, or sound has a physical weight). Explain the new physics and try to adapt the user's plan to these impossible conditions.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}
