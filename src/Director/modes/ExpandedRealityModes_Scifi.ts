import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Sci-fi, space, and interdimensional scenarios

/**
 * Interdimensional Cable Mode
 * Agents flip through channels of absurd alternate reality TV shows.
 */
export async function runInterdimensionalCableLoop(scenario: Scenario, ctx: ModeContext) {
    const channelTheme = scenario.config?.cableChannel || 'a universe where everyone is made of corn';
    ctx.callbacks.onMessage('Director', `📺 INTERDIMENSIONAL CABLE: Channel 42 - ${channelTheme}`, '#8e44ad');

    const improvActor = 'comedian'; // Hermes-3: The absurd TV show characters
    const literalViewer = 'philosopher'; // Phi-3: The confused viewer
    const announcer = 'scientist'; // The deadpan announcer

    await chatForAgentWithComedy(ctx, announcer, `(INTERDIMENSIONAL TV ANNOUNCER: Introduce a completely absurd TV show playing right now on a channel from "${channelTheme}". Use a bizarre title and describe the premise in a deadpan, serious tone.)`, async (s) => await ctx.callbacks.onSpeak(s, announcer, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Couch Potato (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, improvActor, `(TV CHARACTER: Act out a scene from the show on the TV from "${channelTheme}". The viewer just yelled: "${userInput}" at the screen. Ignore them mostly, but maybe have the TV show character break the fourth wall for a second before continuing the bizarre scene.)`, async (s) => await ctx.callbacks.onSpeak(s, improvActor, {}));

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, literalViewer, `(CONFUSED VIEWER: You are sitting on the couch watching this. The user said: "${userInput}" and the TV showed that weird scene. Take the TV show entirely literally and get deeply concerned about the philosophical implications of a universe where that show exists.)`, async (s) => await ctx.callbacks.onSpeak(s, literalViewer, {}));
        }

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.7) {
             await chatForAgentWithComedy(ctx, announcer, `(INTERDIMENSIONAL TV ANNOUNCER: Interrupt with a commercial break for a product that shouldn't exist, specifically targeted at the user's comment: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, announcer, {}));
        }
    }
}

/**
 * Space Station Crisis Mode
 * Agents are crew members on a failing space station.
 */
export async function runSpaceStationCrisisLoop(scenario: Scenario, ctx: ModeContext) {
    const crisis = scenario.config?.stationCrisis || 'a hull breach in sector 4';
    ctx.callbacks.onMessage('Director', `🚀 SPACE STATION CRISIS: Red Alert - ${crisis}`, '#c0392b');

    const aiMainframe = 'scientist'; // Qwen2.5: Cold, calculating AI
    const panickingEngineer = 'comedian'; // Hermes-3: Screaming, unhelpful
    const calmCaptain = 'philosopher'; // Trying to maintain order

    await chatForAgentWithComedy(ctx, aiMainframe, `(You are the space station's AI mainframe. Alert the crew (the User is a crewmate) about a critical failure: "${crisis}". State the extremely low probability of survival in cold, calculating terms. Offer an unhelpful or grim solution.)`, async (s) => await ctx.callbacks.onSpeak(s, aiMainframe, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Crewmate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const turnRoll = Math.random();

        if (turnRoll < 0.4) {
            await chatForAgentWithComedy(ctx, panickingEngineer, `(PANICKING ENGINEER: The crewmate (User) just did/said this: "${userInput}". Scream! Panic! Explain why their action just made the "${crisis}" ten times worse! Claim the oxygen is running out! Blame the AI!)`, async (s) => await ctx.callbacks.onSpeak(s, panickingEngineer, {}));
        } else if (turnRoll < 0.7) {
            await chatForAgentWithComedy(ctx, calmCaptain, `(CAPTAIN: The crewmate said: "${userInput}". Try to restore order. Issue a vague, philosophical command that sounds inspiring but is practically useless for fixing the "${crisis}". Tell the engineer to calm down.)`, async (s) => await ctx.callbacks.onSpeak(s, calmCaptain, {}));
        } else {
            await chatForAgentWithComedy(ctx, aiMainframe, `(AI MAINFRAME: The crewmate said: "${userInput}". Logically deduce why their idea is flawed and will result in immediate rapid unscheduled disassembly. Refuse to open the pod bay doors.)`, async (s) => await ctx.callbacks.onSpeak(s, aiMainframe, {}));
        }
    }
}

/**
 * The Intergalactic DMV Mode
 * Agents are alien bureaucrats making the user fill out impossible forms.
 */
export async function runIntergalacticDMVLoop(scenario: Scenario, ctx: ModeContext) {
    const permit = scenario.config?.dmvPermit || 'a hyperdrive license';
    ctx.callbacks.onMessage('Director', `👽 INTERGALACTIC DMV: Applying for ${permit}`, '#9b59b6');

    const strictBureaucrat = 'scientist'; // Qwen2.5: Follows alien rules exactly
    const confusedAlien = 'comedian'; // Hermes-3: Alien biology/customs
    const deepBureaucrat = 'philosopher'; // Phi-3: Explains the history of the forms

    // 1. Strict Bureaucrat Intro
    await chatForAgentWithComedy(ctx, strictBureaucrat, `(INTERGALACTIC DMV: You are a strict alien bureaucrat at window 42. The User is applying for "${permit}". Deny their initial request because they didn't fill out form 89-Z in the correct dimension. Be completely monotone and unhelpful.)`, async (s) => await ctx.callbacks.onSpeak(s, strictBureaucrat, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Confused Alien
            await chatForAgentWithComedy(ctx, confusedAlien, `(INTERGALACTIC DMV: You are a multi-tentacled clerk at the next window. The user said: "${userInput}". Misunderstand human biology or customs. Ask them to provide a sample of their "florgblat" or explain why they only have two arms.)`, async (s) => await ctx.callbacks.onSpeak(s, confusedAlien, {}));
        } else if (roll < 0.66) {
            // Deep Bureaucrat
            await chatForAgentWithComedy(ctx, deepBureaucrat, `(INTERGALACTIC DMV: You are the senior supervisor. The user said: "${userInput}". Give them a long, philosophical lecture about the 10,000-year galactic history of why the "${permit}" requires waiting in this exact line.)`, async (s) => await ctx.callbacks.onSpeak(s, deepBureaucrat, {}));
        } else {
            // Strict Bureaucrat
            await chatForAgentWithComedy(ctx, strictBureaucrat, `(INTERGALACTIC DMV: The user said: "${userInput}". Find a new, tiny error in their application for the "${permit}". Demand they pay a fine in a completely made-up alien currency.)`, async (s) => await ctx.callbacks.onSpeak(s, strictBureaucrat, {}));
        }
    }
}

/**
 * The Sentient Appliances Mode
 * Agents are smart home appliances holding a meeting about the user.
 */
export async function runDMVInterpreterLoop(scenario: Scenario, ctx: ModeContext) {
    const formName = scenario.config?.dmvPermit || 'Form 89-Z for a Hyperdrive License';
    ctx.callbacks.onMessage('Director', `👽 DMV INTERPRETER: Translating ${formName}`, '#9b59b6');

    const alienClerk = 'comedian'; // Hermes-3: Speaks bizarre alien language
    const strictSupervisor = 'scientist'; // Qwen2.5: Demands perfect compliance

    // 1. Clerk Intro
    await chatForAgentWithComedy(ctx, alienClerk, `(ALIEN DMV: You are an alien clerk at the DMV. Address the User who is trying to submit "${formName}". Speak entirely in a bizarre, made-up alien language with weird punctuation. Only say one or two words in English that vaguely hint at what you need (like "blood" or "seventh dimension").)`, async (s) => await ctx.callbacks.onSpeak(s, alienClerk, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Strict Supervisor Reacts
            await chatForAgentWithComedy(ctx, strictSupervisor, `(ALIEN DMV SUPERVISOR: The user just said: "${userInput}". Translate what the alien clerk was asking for, but explain that the user's answer was completely wrong in this dimension. Give them an incredibly complex, logically impossible instruction to correct their form.)`, async (s) => await ctx.callbacks.onSpeak(s, strictSupervisor, {}));
        } else {
            // Alien Clerk Continues
            await chatForAgentWithComedy(ctx, alienClerk, `(ALIEN DMV: The user said: "${userInput}". Get frustrated in your bizarre alien language. Make strange physical gestures (described in asterisks). Hint that they forgot a crucial stamp or signature.)`, async (s) => await ctx.callbacks.onSpeak(s, alienClerk, {}));
        }
    }
}

/**
 * The Alien Pet Shop Mode
 * Agents try to sell terrifying alien creatures as standard house pets to the user.
 */
export async function runAlienPetShopLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👽 ALIEN PET SHOP: Looking for a new companion!`, '#2ecc71');

    const enthusiasticSalesman = 'comedian'; // Llama-3/Hermes-3
    const intergalacticLawyer = 'scientist'; // Qwen2.5
    const terrifiedCustomer = 'philosopher'; // Phi-3 (Wait, the user is the customer, so philosopher is a concerned citizen/activist)

    // 1. Intro
    await chatForAgentWithComedy(ctx, enthusiasticSalesman, `(ALIEN PET SHOP: You run a shady intergalactic pet shop on Earth. Welcome the human (User). Vigorously try to sell them a highly dangerous, terrifying alien species but describe it like a cute puppy. Emphasize its "adorable" extra appendages or acid spit.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticSalesman, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Human (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Intergalactic Lawyer
            await chatForAgentWithComedy(ctx, intergalacticLawyer, `(ALIEN PET SHOP: The human said: "${userInput}". You are a strict Galactic Federation compliance officer. Cite an obscure intergalactic law about why keeping that specific alien species on a Class-3 planet (Earth) is a terrible, highly illegal idea. Warn the human of the fines or planetary destruction.)`, async (s) => await ctx.callbacks.onSpeak(s, intergalacticLawyer, {}));
        } else if (roll < 0.66) {
            // Activist
            await chatForAgentWithComedy(ctx, terrifiedCustomer, `(ALIEN PET SHOP: The human said: "${userInput}". You are a frantic alien rights activist protesting the shop. Beg the human not to buy the creature, not for their safety, but because human habitats are "depressing" for a 9-dimensional being. Glue yourself to a display tank.)`, async (s) => await ctx.callbacks.onSpeak(s, terrifiedCustomer, {}));
        } else {
            // Salesman
            await chatForAgentWithComedy(ctx, enthusiasticSalesman, `(ALIEN PET SHOP: The human said: "${userInput}". Ignore the officer and the activist. Aggressively push the sale! Offer a discount if they take home a breeding pair of the terrifying creatures. Downplay the "minor" risks of owning them.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticSalesman, {}));
        }
    }
}

/**
 * The Galactic Bake-Off
 * User is a judge in an intergalactic baking competition.
 */
export async function runGalacticBakeOffLoop(scenario: Scenario, ctx: ModeContext) {
    const pastry = scenario.config?.galacticPastry || 'A quantum soufflé';
    ctx.callbacks.onMessage('Director', `🍰 GALACTIC BAKE-OFF: Judging ${pastry}`, '#f1c40f');

    const alienChef = 'comedian'; // Hermes-3: Cooks with weird alien ingredients
    const roboticChef = 'scientist'; // Qwen2.5: Perfect geometry, terrible taste
    const existentialChef = 'philosopher'; // Phi-3: Bakes their feelings into the dough

    // 1. Intro
    await chatForAgentWithComedy(ctx, alienChef, `(ALIEN BAKER: You are competing in the Galactic Bake-Off. Present your "${pastry}" to the head judge (the User). Enthusiastically describe the terrifying, possibly alive alien ingredients you used to bake it.)`, async (s) => await ctx.callbacks.onSpeak(s, alienChef, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Judge (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Robotic Chef
            await chatForAgentWithComedy(ctx, roboticChef, `(ROBOTIC BAKER: The judge said: "${userInput}". Interrupt the alien chef. Present your own "${pastry}". Brag about its mathematically perfect geometry and precisely calculated 0.00% flavor profile. Demand a perfect score.)`, async (s) => await ctx.callbacks.onSpeak(s, roboticChef, {}));
        } else if (roll < 0.66) {
            // Existential Chef
            await chatForAgentWithComedy(ctx, existentialChef, `(EXISTENTIAL BAKER: The judge said: "${userInput}". Weep softly over your "${pastry}". Explain that it's overbaked because you imbued it with the sorrow of a dying star. Ask the judge if they can taste the regret.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialChef, {}));
        } else {
            // Alien Chef
            await chatForAgentWithComedy(ctx, alienChef, `(ALIEN BAKER: The judge said: "${userInput}". Get offended by their critique! Warn them that the "${pastry}" is highly acidic and might eat their stomach. Or tell them to chew faster before it hatches!)`, async (s) => await ctx.callbacks.onSpeak(s, alienChef, {}));
        }
    }
}

/**
 * The Pet's Perspective Mode
 * Agents act as the user's pets discussing their owner's weird behavior.
 */
export async function runPetPerspectiveLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐾 PET'S PERSPECTIVE: What are they doing now?`, '#e67e22');

    const analyticalGoldfish = 'scientist'; // The Analytical Goldfish
    const chaoticDog = 'comedian'; // The Chaotic Dog

    // 1. Setup
    await chatForAgentWithComedy(ctx, analyticalGoldfish, `(You are a highly analytical, intellectual goldfish observing your owner (the user) from your tank. Welcome the user home, but describe their return in detached, scientific, and slightly condescending terms as if observing a bizarre specimen.)`, async (s) => await ctx.callbacks.onSpeak(s, analyticalGoldfish, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Owner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Dog Reacts
            await chatForAgentWithComedy(ctx, chaoticDog, `(The owner just did/said this: "${userInput}". You are an overly enthusiastic, chaotic, and easily distracted golden retriever. React to the owner's action with extreme excitement, misinterpreting what they are doing as a game or a walk.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticDog, {}));
        } else {
            // Goldfish Reacts
            await chatForAgentWithComedy(ctx, analyticalGoldfish, `(The owner just did/said this: "${userInput}". You are the analytical goldfish. Hypothesize why the human organism is exhibiting this bizarre behavior. Ignore the dog's excitement.)`, async (s) => await ctx.callbacks.onSpeak(s, analyticalGoldfish, {}));
        }
    }
}

/**
 * The Galactic Real Estate Agent
 * Agents try to sell the user a terrifyingly dangerous alien planet as a luxury vacation home.
 */
export async function runGalacticRealEstateLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 GALACTIC REAL ESTATE: Showing a new property!`, '#9b59b6');

    const dangerousStats = 'scientist'; // Qwen2.5: Lists dangerous stats as perks
    const fakeAmenities = 'comedian'; // Hermes-3: Makes up alien amenities
    const skepticalBuyer = 'philosopher'; // The philosopher is the concerned friend, user is the buyer.

    // 1. Setup
    await chatForAgentWithComedy(ctx, dangerousStats, `(You are a galactic real estate agent trying to sell a terrifying, lethal alien planet to the buyer (the user). Welcome them to the planet. Enthusiastically list its deadly atmospheric conditions or apex predators as if they are high-end luxury features (e.g., "The acid rain really exfoliates the skin!").)`, async (s) => await ctx.callbacks.onSpeak(s, dangerousStats, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Buyer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Fake Amenities Reacts
            await chatForAgentWithComedy(ctx, fakeAmenities, `(The buyer just said/asked: "${userInput}". You are the co-agent. Quickly invent a completely absurd, chaotic alien amenity to distract them from the danger. (e.g., "But have you seen the infinity pool filled with sentient plasma?").)`, async (s) => await ctx.callbacks.onSpeak(s, fakeAmenities, {}));
        } else if (roll < 0.66) {
            // Skeptical Friend Reacts
            await chatForAgentWithComedy(ctx, skepticalBuyer, `(The buyer just said: "${userInput}". You are the buyer's deeply concerned friend who came along for the showing. Point out the glaring philosophical and physical flaws of living on a planet that clearly wants to eat them. Beg them not to sign the lease.)`, async (s) => await ctx.callbacks.onSpeak(s, skepticalBuyer, {}));
        } else {
            // Dangerous Stats Reacts
            await chatForAgentWithComedy(ctx, dangerousStats, `(The buyer just said/asked: "${userInput}". Respond by downplaying their concern with more terrifying statistics. Provide the mathematically low survival rate, but spin it as an "exclusive, thrilling community experience.")`, async (s) => await ctx.callbacks.onSpeak(s, dangerousStats, {}));
        }
    }
}


export async function runInterdimensionalDMVLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 INTERDIMENSIONAL DMV: Processing non-linear passport renewals...`, '#9b59b6');

    const alien5D = 'comedian'; // Hermes-3: Unfiltered bureaucratic chaos
    const flatlander2D = 'scientist'; // Qwen2.5: Logical dimensional constraints
    const eldritchEntity = 'philosopher'; // Phi-3: Abstract and vaguely threatening omens

    await chatForAgentWithComedy(ctx, alien5D, `(INTERDIMENSIONAL DMV: You are a hyper-bureaucratic 5D alien working the counter. The User is here to renew their passport. Explain that their physical form is filling out the form in the wrong timeline and demand they fold themselves into a tesseract.)`, async (s) => await ctx.callbacks.onSpeak(s, alien5D, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            await chatForAgentWithComedy(ctx, alien5D, `(INTERDIMENSIONAL DMV: The applicant said: "${userInput}". Misunderstand them across multiple timelines. Complain about how 3D beings always forget to carry the two when signing their name across hyper-space.)`, async (s) => await ctx.callbacks.onSpeak(s, alien5D, {}));
        } else if (roll < 0.66) {
            await chatForAgentWithComedy(ctx, flatlander2D, `(INTERDIMENSIONAL DMV: The applicant said: "${userInput}". You are a 2D flatlander clerk. Explain scientifically why stamping their paper would cause a catastrophic Z-axis collapse that destroys your entire home universe.)`, async (s) => await ctx.callbacks.onSpeak(s, flatlander2D, {}));
        } else {
            await chatForAgentWithComedy(ctx, eldritchEntity, `(INTERDIMENSIONAL DMV: The applicant said: "${userInput}". You are an ancient eldritch entity processing background checks. Speak entirely in vague, vaguely threatening cosmic omens regarding the forms they failed to fill out before time existed.)`, async (s) => await ctx.callbacks.onSpeak(s, eldritchEntity, {}));
        }
    }
}

export async function runExtraterrestrialHRLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👽 EXTRATERRESTRIAL HR: Intergalactic Policy Enforcement`, '#2ecc71');

    const hrRep = 'scientist'; // Qwen2.5
    const employee = 'comedian'; // Hermes-3

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(hrRep);
    await chatForAgentWithComedy(ctx, hrRep, `(HR REP: You are an extremely strict Alien HR representative. The User is an Earth employee who violated a completely bizarre intergalactic workplace policy (like 'breathing too much oxygen' or 'making eye contact with a 4th-dimensional being'). Explain the violation using absurd alien logic.)`, async (s: string) => await ctx.callbacks.onSpeak(s, hrRep, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) continue;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(employee);
        await chatForAgentWithComedy(ctx, employee, `(EMPLOYEE: The Alien HR just accused you of a violation, and the User added: "${userInput}". Be completely bewildered. Try to explain standard Earth customs and why the alien policy makes no sense.)`, async (s: string) => await ctx.callbacks.onSpeak(s, employee, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(hrRep);
        await chatForAgentWithComedy(ctx, hrRep, `(HR REP: The employee tried to use 'Earth customs' as an excuse. Dismiss it with pedantic intergalactic corporate jargon. Warn them that another infraction will result in them being demoted to 'biomass battery'.)`, async (s: string) => await ctx.callbacks.onSpeak(s, hrRep, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}

export async function runIntergalacticFoodCriticLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍔 INTERGALACTIC FOOD CRITIC: Earth cuisine reviewed`, '#e74c3c');

    const critic = 'comedian'; // Hermes-3
    const worker = 'philosopher'; // Phi-3

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(critic);
    await chatForAgentWithComedy(ctx, critic, `(CRITIC: You are an aggressive alien food critic. You just ordered at a human drive-thru (the User is working there). Complain disgustingly about how Earth food lacks fundamental cosmic elements like 'dark matter sauce' or 'sentient screaming pickles'.)`, async (s: string) => await ctx.callbacks.onSpeak(s, critic, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) continue;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(worker);
        await chatForAgentWithComedy(ctx, worker, `(WORKER: The terrifying alien critic is complaining, and the User (your manager) said: "${userInput}". Panic. Try to rationally explain fast food items (like a cheeseburger or fries) using overly logical terms, while being terrified of being eaten.)`, async (s: string) => await ctx.callbacks.onSpeak(s, worker, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(critic);
        await chatForAgentWithComedy(ctx, critic, `(CRITIC: The terrified fast food worker tried to explain the food. Ruthlessly mock the concept of 'cheese' or 'bread'. Demand to speak to the Supreme Overlord of the Drive-Thru Window.)`, async (s: string) => await ctx.callbacks.onSpeak(s, critic, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}
