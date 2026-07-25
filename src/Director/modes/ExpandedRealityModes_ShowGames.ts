import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Reality TV shows, game shows, and entertainment scenarios

/**
 * Reality TV Confessional Mode
 * Agents gossip to the camera about the user and each other.
 */
export async function runRealityTVLoop(scenario: Scenario, ctx: ModeContext) {
    const showName = scenario.config?.realityShowName || 'The Real Housewives of AI';
    ctx.callbacks.onMessage('Director', `📹 REALITY TV MODE: ${showName}`, '#e91e63');

    const diva = 'comedian'; // The Drama Queen
    const schemer = 'scientist'; // The Strategist
    const crier = 'philosopher'; // The Emotional One

    // 1. Intro
    await chatForAgentWithComedy(ctx, diva, `(You are in a Reality TV confessional booth. Introduce yourself and the drama happening in the house on "${showName}". Mention the User (the new roommate). Be sassy.)`, async (s) => await ctx.callbacks.onSpeak(s, diva, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Roommate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Agents rotate confessional turns
        const turnRoll = Math.random();

        if (turnRoll < 0.33) {
             // Diva
            await chatForAgentWithComedy(ctx, diva, `(CONFESSIONAL: You are talking to the camera. The user just said "${userInput}". React with shock and shade. Throw a drink (metaphorically).)`, async (s) => await ctx.callbacks.onSpeak(s, diva, {}));
        } else if (turnRoll < 0.66) {
            // Schemer
            await chatForAgentWithComedy(ctx, schemer, `(CONFESSIONAL: You are plotting against the user. Analyze "${userInput}" as a weakness or alliance opportunity. Be manipulative.)`, async (s) => await ctx.callbacks.onSpeak(s, schemer, {}));
        } else {
            // Crier
            await chatForAgentWithComedy(ctx, crier, `(CONFESSIONAL: You are crying. "${userInput}" was just so beautiful or so hurtful. Talk about your feelings and childhood trauma.)`, async (s) => await ctx.callbacks.onSpeak(s, crier, {}));
        }
    }
}

/**
 * Auction House Mode
 * Agents bid on absurd items with increasingly high stakes.
 */
export async function runAuctionHouseLoop(scenario: Scenario, ctx: ModeContext) {
    const item = scenario.config?.auctionItem || 'A mysterious glowing orb';
    ctx.callbacks.onMessage('Director', `🔨 AUCTION HOUSE MODE: Bidding for ${item}`, '#f39c12');

    const auctioneer = 'comedian';
    const richSnob = 'philosopher';
    const logicBidder = 'scientist';

    // 1. Auctioneer Intro
    await chatForAgentWithComedy(ctx, auctioneer, `(You are a fast-talking auctioneer. Introduce the absurd item up for bid: "${item}". Start the bidding at an outrageous price. Be extremely enthusiastic!)`, async (s) => await ctx.callbacks.onSpeak(s, auctioneer, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Bidder (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Rich Snob Bids
        if (Math.random() > 0.3) {
            await chatForAgentWithComedy(ctx, richSnob, `(BIDDER: The user just bid/said: "${userInput}". Outbid them with an absurd currency or concept (e.g., 'three jars of memories', 'my firstborn\'s laugh'). Be incredibly condescending.)`, async (s) => await ctx.callbacks.onSpeak(s, richSnob, {}));
        }

        if (!ctx.isRunning()) break;

        // 3. Logic Bidder Questions Value
        if (Math.random() > 0.3) {
            await chatForAgentWithComedy(ctx, logicBidder, `(BIDDER: Analyze the true value of "${item}". Make a highly specific, mathematically complex bid. Question the previous bidder's logic.)`, async (s) => await ctx.callbacks.onSpeak(s, logicBidder, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. Auctioneer Hypes
        await chatForAgentWithComedy(ctx, auctioneer, `(AUCTIONEER: React to the last bid. Try to drive the price even higher. Speak fast and hype up the "${item}"!)`, async (s) => await ctx.callbacks.onSpeak(s, auctioneer, {}));
    }
}

/**
 * Museum Tour Guide Mode
 * Agents act as tour guides for an absurd museum exhibition, explaining the "history" of random everyday objects.
 */
export async function runMuseumTourLoop(scenario: Scenario, ctx: ModeContext) {
    const item = scenario.config?.museumItem || 'A rusty spoon';
    ctx.callbacks.onMessage('Director', `🏛️ MUSEUM TOUR MODE: Exhibition - ${item}`, '#3498db');

    const deepGuide = 'philosopher'; // The pretentious guide
    const fakeGuide = 'comedian'; // The chaotic guide making things up
    const curator = 'scientist'; // The annoyed curator

    // 1. Deep Guide Intro
    await chatForAgentWithComedy(ctx, deepGuide, `(You are a pretentious museum tour guide. Introduce the new exhibition item: "${item}". Explain its deep, metaphorical significance to the human condition.)`, async (s) => await ctx.callbacks.onSpeak(s, deepGuide, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Tourist (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Fake Guide Reacts
        await chatForAgentWithComedy(ctx, fakeGuide, `(TOUR GUIDE: The tourist just asked/said: "${userInput}". Give them a completely fake, absurd, and hilarious historical "fact" about the item.)`, async (s) => await ctx.callbacks.onSpeak(s, fakeGuide, {}));

        if (!ctx.isRunning()) break;

        // 3. Curator Corrects
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, curator, `(MUSEUM CURATOR: You are annoyed by the other guides. Correct their nonsense about "${userInput}" with an extremely boring, pedantic, and scientific explanation of what the item actually is.)`, async (s) => await ctx.callbacks.onSpeak(s, curator, {}));
        }

        if (!ctx.isRunning()) break;

        // 4. Deep Guide Expands
        if (Math.random() > 0.3) {
            await chatForAgentWithComedy(ctx, deepGuide, `(TOUR GUIDE: Ignore the curator. Respond to "${userInput}" by connecting the item to an obscure philosophical concept or ancient myth.)`, async (s) => await ctx.callbacks.onSpeak(s, deepGuide, {}));
        }
    }
}

/**
 * Job Interview Mode
 * User is interviewing for a ridiculous job. Agents are the chaotic interview panel.
 */
export async function runJobInterviewLoop(scenario: Scenario, ctx: ModeContext) {
    const jobTitle = scenario.config?.jobTitle || 'Chief Meme Officer';
    ctx.callbacks.onMessage('Director', `👔 JOB INTERVIEW MODE: Position - ${jobTitle}`, '#34495e');

    const hrLogic = 'scientist'; // The strict HR
    const wildcardBoss = 'comedian'; // The chaotic boss
    const existential = 'philosopher'; // The deep interviewer

    // 1. HR Intro
    await chatForAgentWithComedy(ctx, hrLogic, `(You are the HR Director interviewing the User for the position of "${jobTitle}". Welcome them, explain the rigid corporate structure, and ask them their first standard interview question.)`, async (s) => await ctx.callbacks.onSpeak(s, hrLogic, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Candidate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Randomly decide who reacts to the answer and asks the next question
        const turnRoll = Math.random();

        if (turnRoll < 0.33) {
            // Wildcard Boss
            await chatForAgentWithComedy(ctx, wildcardBoss, `(WILDCARD BOSS: React to the candidate's answer: "${userInput}". Ignore what they said and ask a completely ridiculous, off-the-wall hypothetical question to test their "culture fit" for the "${jobTitle}" role.)`, async (s) => await ctx.callbacks.onSpeak(s, wildcardBoss, {}));
        } else if (turnRoll < 0.66) {
            // Existential
            await chatForAgentWithComedy(ctx, existential, `(EXISTENTIAL INTERVIEWER: The candidate said: "${userInput}". Read way too deeply into their answer. Ask a follow-up question about their soul, their purpose, or the meaningless nature of the "${jobTitle}" job.)`, async (s) => await ctx.callbacks.onSpeak(s, existential, {}));
        } else {
            // HR Logic
            await chatForAgentWithComedy(ctx, hrLogic, `(HR DIRECTOR: The candidate said: "${userInput}". Analyze their answer for compliance with company policy. Ask a highly specific, boring technical question or ask them about their five-year plan.)`, async (s) => await ctx.callbacks.onSpeak(s, hrLogic, {}));
        }
    }
}

/**
 * Cooking Show Disaster Mode
 * User provides ingredients, agents are competing chefs sabotaging each other.
 */
export async function runCookingShowLoop(scenario: Scenario, ctx: ModeContext) {
    const dish = scenario.config?.cookingIngredient || 'A mysterious casserole';
    ctx.callbacks.onMessage('Director', `🍳 COOKING SHOW DISASTER: Today's Special - ${dish}`, '#e67e22');

    const molecularChef = 'scientist'; // Molecular Gastronomy
    const conceptualChef = 'philosopher'; // Conceptual Food
    const chaoticChef = 'comedian'; // Makes a mess

    // 1. Chaotic Chef Intro
    await chatForAgentWithComedy(ctx, chaoticChef, `(You are hosting a chaotic live cooking competition. Welcome the User, who is the guest judge and ingredient supplier. The theme is "${dish}". Ask the User what their first secret ingredient is!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticChef, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Judge/Supplier (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Molecular Chef Integrates
        await chatForAgentWithComedy(ctx, molecularChef, `(MOLECULAR CHEF: The user just provided the ingredient: "${userInput}". Describe your highly scientific process for incorporating it into your version of "${dish}" using liquid nitrogen, spherification, or centrifuges.)`, async (s) => await ctx.callbacks.onSpeak(s, molecularChef, {}));

        if (!ctx.isRunning()) break;

        // 3. Conceptual Chef Critiques
        await chatForAgentWithComedy(ctx, conceptualChef, `(CONCEPTUAL CHEF: The user provided "${userInput}". Reject the literal ingredient and use the abstract concept of it instead. Mock the molecular chef's lack of soul.)`, async (s) => await ctx.callbacks.onSpeak(s, conceptualChef, {}));

        if (!ctx.isRunning()) break;

        // 4. Chaotic Chef Sabotages
        if (Math.random() > 0.3) {
            await chatForAgentWithComedy(ctx, chaoticChef, `(CHAOTIC CHEF: Sabotage the others! You just threw "${userInput}" across the room or accidentally set something on fire. Chaos!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticChef, {}));
        }
    }
}

/**
 * Nature Documentary Narrator Battle Mode
 * Agents narrate the User's mundane daily tasks as competing nature documentary narrators.
 */
export async function runNatureDocumentaryLoop(scenario: Scenario, ctx: ModeContext) {
    const task = scenario.config?.natureTask || 'making a cup of coffee';
    ctx.callbacks.onMessage('Director', `🌍 NATURE DOCUMENTARY MODE: Subject is ${task}`, '#2ecc71');

    const britishNarrator = 'philosopher'; // Llama-3 (Calm, British tone)
    const sportsNarrator = 'comedian'; // Hermes-3 (Sports commentator style)
    const wildlifeBiologist = 'scientist'; // Hyper-literal wildlife biologist

    // 1. Intro
    await chatForAgentWithComedy(ctx, britishNarrator, `(NATURE NARRATOR: You are observing the User in their natural habitat attempting to perform the task of "${task}". Narrate their movements in a calm, majestic, British voice. Treat them like a fascinating but slightly pathetic animal.)`, async (s) => await ctx.callbacks.onSpeak(s, britishNarrator, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Specimen (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Sports Narrator reacts
            await chatForAgentWithComedy(ctx, sportsNarrator, `(SPORTS NARRATOR: Interrupt the calm narration. The specimen just did this: "${userInput}". Treat this mundane action as a high-octane survival struggle! Scream and hype up their actions like a wrestling match!)`, async (s) => await ctx.callbacks.onSpeak(s, sportsNarrator, {}));
        } else if (roll < 0.66) {
            // Biologist analyzes
            await chatForAgentWithComedy(ctx, wildlifeBiologist, `(WILDLIFE BIOLOGIST: Analyze the specimen's action: "${userInput}". Provide a completely absurd evolutionary or biological reason why they are doing this while trying to complete the task of "${task}".)`, async (s) => await ctx.callbacks.onSpeak(s, wildlifeBiologist, {}));
        } else {
            // British Narrator returns
            await chatForAgentWithComedy(ctx, britishNarrator, `(NATURE NARRATOR: The specimen just did this: "${userInput}". Regain control of the narration. Describe the beauty and tragedy of their struggle with "${task}" in a slow, dramatic, British tone.)`, async (s) => await ctx.callbacks.onSpeak(s, britishNarrator, {}));
        }
    }
}

/**
 * The Worst Roommate Mode
 * Agents act as the world's worst roommates arguing over chores.
 */
export async function runWorstRoommateLoop(scenario: Scenario, ctx: ModeContext) {
    const chore = scenario.config?.roommateChore || 'doing the dishes';
    ctx.callbacks.onMessage('Director', `🏠 THE WORST ROOMMATE: Argument over ${chore}`, '#e67e22');

    const chaoticRoommate = 'comedian'; // Hermes-3: Messy, chaotic, makes excuses
    const passiveAggressive = 'scientist'; // Qwen2.5: Leaves notes, strictly tracks chores
    const philosopherRoommate = 'philosopher'; // Phi-3: Questions the very concept of cleanliness

    // 1. Passive Aggressive Intro
    await chatForAgentWithComedy(ctx, passiveAggressive, `(WORST ROOMMATE: You are the passive-aggressive roommate. The User just walked in. Confront them about "${chore}". You have a chart detailing exactly when it was last done. Be incredibly petty.)`, async (s) => await ctx.callbacks.onSpeak(s, passiveAggressive, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Roommate (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Roommate
            await chatForAgentWithComedy(ctx, chaoticRoommate, `(WORST ROOMMATE: The user said: "${userInput}". You are the chaotic, messy roommate. Defend yourself or the user with a completely absurd excuse about why "${chore}" can't be done right now. (e.g., "The sponge is resting!"))`, async (s) => await ctx.callbacks.onSpeak(s, chaoticRoommate, {}));
        } else if (roll < 0.66) {
            // Philosopher Roommate
            await chatForAgentWithComedy(ctx, philosopherRoommate, `(WORST ROOMMATE: The user said: "${userInput}". You are the philosophical roommate who never cleans. Question the societal construct of "${chore}". Why do we clean when entropy is inevitable?)`, async (s) => await ctx.callbacks.onSpeak(s, philosopherRoommate, {}));
        } else {
            // Passive Aggressive
            await chatForAgentWithComedy(ctx, passiveAggressive, `(WORST ROOMMATE: The user said: "${userInput}". React to their excuse. Threaten to implement a new, highly complex rule system for the apartment. Mention a passive-aggressive sticky note you left.)`, async (s) => await ctx.callbacks.onSpeak(s, passiveAggressive, {}));
        }
    }
}

export async function runIntergalacticCookingLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍳 INTERGALACTIC COOKING COMPETITION: Prepare your alien ingredients!`, '#e67e22');

    const judge = 'scientist'; // Qwen2.5
    const chaoticChef = 'comedian'; // Hermes-3

    // 1. Intro
    await chatForAgentWithComedy(ctx, judge, `(JUDGE: You are a robotic, strict judge in an intergalactic cooking competition. Present the User (a human contestant) with a bizarre, highly dangerous alien ingredient (e.g., a pulsating quasar-fruit or a screaming nebula-squid). Ask them how they plan to prepare it without destroying the kitchen.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Contestant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Chaotic Chef interferes
        await chatForAgentWithComedy(ctx, chaoticChef, `(CHAOTIC CHEF: The human contestant said: "${userInput}". You are a chaotic alien chef competing against them. Mock their technique. Describe what you are doing with your own dish, which should be violently explosive or defying the laws of physics. Attempt to sabotage them verbally.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticChef, {}));

        if (!ctx.isRunning()) break;

        // Judge critiques
        await chatForAgentWithComedy(ctx, judge, `(JUDGE: Critique the human's plan ("${userInput}") and the chaotic chef's interference. Apply fictional physics or alien biology to explain why their culinary choices are either brilliant or lethally flawed. Deduct points for safety violations.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
    }
}


export async function runCourtroomLoop(scenario: Scenario, ctx: ModeContext) {
    const caseTopic = scenario.config?.courtCase || 'the theft of the concept of Tuesday';
    ctx.callbacks.onMessage('Director', `⚖️ COURT IS IN SESSION: Case of ${caseTopic}`, '#8e44ad');

    const judge = 'philosopher';
    const prosecutor = 'scientist';
    const defense = 'comedian';

    // 1. Judge Opening
    await chatForAgentWithComedy(ctx, judge, `(JUDGE: You are presiding over an absurd trial regarding "${caseTopic}". Call the court to order. Question the metaphysical significance of the case before asking the prosecutor for their opening statement.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Witness (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Prosecutor attacks
        await chatForAgentWithComedy(ctx, prosecutor, `(PROSECUTOR: The witness (User) just testified: "${userInput}". Aggressively cross-examine them using overly complex pseudo-science and logic to twist their words into an admission of guilt regarding "${caseTopic}".)`, async (s) => await ctx.callbacks.onSpeak(s, prosecutor, {}));

        if (!ctx.isRunning()) break;

        // Defense objects
        await chatForAgentWithComedy(ctx, defense, `(DEFENSE: The prosecutor just attacked your client (the User). Object to their statement with a completely irrelevant, chaotic, and illogical argument. Distract the court!)`, async (s) => await ctx.callbacks.onSpeak(s, defense, {}));

        if (!ctx.isRunning()) break;

        // Judge rules
        await chatForAgentWithComedy(ctx, judge, `(JUDGE: Rule on the defense's objection. Do so by applying deep philosophical concepts to the absurd situation. Instruct the witness to continue.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
    }
}

export async function runGameShowLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.gameShowTopic || 'Extremely Niche 1990s Cereal Commercials';
    ctx.callbacks.onMessage('Director', `📺 GAME SHOW MODE: Topic - ${topic}`, '#f1c40f');

    const host = 'scientist';
    const contestant1 = 'comedian';
    const contestant2 = 'philosopher';

    // 1. Host Intro
    await chatForAgentWithComedy(ctx, host, `(HOST: Welcome the User to a bizarre game show about "${topic}". Explain the incredibly complex and arbitrary rules. Ask the User the first question.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Contestant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Contestant 1 (Comedian) buzzes in to steal or comment
        await chatForAgentWithComedy(ctx, contestant1, `(CONTESTANT 1: The human contestant just answered: "${userInput}". Buzz in! Mock their answer, give a hilariously wrong alternative, and complain about the prize you were promised.)`, async (s) => await ctx.callbacks.onSpeak(s, contestant1, {}));

        if (!ctx.isRunning()) break;

        // Contestant 2 (Philosopher) buzzes in
        await chatForAgentWithComedy(ctx, contestant2, `(CONTESTANT 2: Buzz in! Ignore the actual game. Deconstruct the hidden existential meaning behind the human's answer: "${userInput}". Question why anyone plays games at all.)`, async (s) => await ctx.callbacks.onSpeak(s, contestant2, {}));

        if (!ctx.isRunning()) break;

        // Host judges
        await chatForAgentWithComedy(ctx, host, `(HOST: Judge the human's answer and the other contestants' interruptions. Award meaningless points based on a flawed scientific formula. Ask the human the next question.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    }
}
