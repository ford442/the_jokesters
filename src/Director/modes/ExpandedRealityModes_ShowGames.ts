import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
import { runSceneScript, type SceneScript } from './sceneRunner';
// Reality TV shows, game shows, and entertainment scenarios.
// Most modes here are declarative `SceneScript`s (see sceneRunner.ts); the scenario's config
// supplies the `{{vars}}` each script's banner and prompts refer to.

export const REALITY_TV_SCRIPT: SceneScript = {
    banner: '📹 REALITY TV MODE: {{showName}}',
    bannerColor: '#e91e63',
    userLabel: 'Roommate (You)',
    roles: {
        diva: 'comedian', // The Drama Queen
        schemer: 'scientist', // The Strategist
        crier: 'philosopher', // The Emotional One
    },
    beats: [
        { when: 'open', speaker: 'diva', prompt: `(You are in a Reality TV confessional booth. Introduce yourself and the drama happening in the house on "{{showName}}". Mention the User (the new roommate). Be sassy.)` },
        {
            oneOf: [
                { speaker: 'diva', prompt: `(CONFESSIONAL: You are talking to the camera. The user just said "{{input}}". React with shock and shade. Throw a drink (metaphorically).)` },
                { speaker: 'schemer', prompt: `(CONFESSIONAL: You are plotting against the user. Analyze "{{input}}" as a weakness or alliance opportunity. Be manipulative.)` },
                { speaker: 'crier', prompt: `(CONFESSIONAL: You are crying. "{{input}}" was just so beautiful or so hurtful. Talk about your feelings and childhood trauma.)` },
            ],
        },
    ],
};

export const AUCTION_HOUSE_SCRIPT: SceneScript = {
    banner: '🔨 AUCTION HOUSE MODE: Bidding for {{item}}',
    bannerColor: '#f39c12',
    userLabel: 'Bidder (You)',
    roles: { auctioneer: 'comedian', richSnob: 'philosopher', logicBidder: 'scientist' },
    beats: [
        { when: 'open', speaker: 'auctioneer', prompt: `(You are a fast-talking auctioneer. Introduce the absurd item up for bid: "{{item}}". Start the bidding at an outrageous price. Be extremely enthusiastic!)` },
        { speaker: 'richSnob', skipChance: 0.3, prompt: `(BIDDER: The user just bid/said: "{{input}}". Outbid them with an absurd currency or concept (e.g., 'three jars of memories', 'my firstborn's laugh'). Be incredibly condescending.)` },
        { speaker: 'logicBidder', skipChance: 0.3, prompt: `(BIDDER: Analyze the true value of "{{item}}". Make a highly specific, mathematically complex bid. Question the previous bidder's logic.)` },
        { speaker: 'auctioneer', prompt: `(AUCTIONEER: React to the last bid. Try to drive the price even higher. Speak fast and hype up the "{{item}}"!)` },
    ],
};

export const MUSEUM_TOUR_SCRIPT: SceneScript = {
    banner: '🏛️ MUSEUM TOUR MODE: Exhibition - {{item}}',
    bannerColor: '#3498db',
    userLabel: 'Tourist (You)',
    roles: {
        deepGuide: 'philosopher', // The pretentious guide
        fakeGuide: 'comedian', // The chaotic guide making things up
        curator: 'scientist', // The annoyed curator
    },
    beats: [
        { when: 'open', speaker: 'deepGuide', prompt: `(You are a pretentious museum tour guide. Introduce the new exhibition item: "{{item}}". Explain its deep, metaphorical significance to the human condition.)` },
        { speaker: 'fakeGuide', prompt: `(TOUR GUIDE: The tourist just asked/said: "{{input}}". Give them a completely fake, absurd, and hilarious historical "fact" about the item.)` },
        { speaker: 'curator', skipChance: 0.4, prompt: `(MUSEUM CURATOR: You are annoyed by the other guides. Correct their nonsense about "{{input}}" with an extremely boring, pedantic, and scientific explanation of what the item actually is.)` },
        { speaker: 'deepGuide', skipChance: 0.3, prompt: `(TOUR GUIDE: Ignore the curator. Respond to "{{input}}" by connecting the item to an obscure philosophical concept or ancient myth.)` },
    ],
};

export const JOB_INTERVIEW_SCRIPT: SceneScript = {
    banner: '👔 JOB INTERVIEW MODE: Position - {{jobTitle}}',
    bannerColor: '#34495e',
    userLabel: 'Candidate (You)',
    roles: {
        hrLogic: 'scientist', // The strict HR
        wildcardBoss: 'comedian', // The chaotic boss
        existential: 'philosopher', // The deep interviewer
    },
    beats: [
        { when: 'open', speaker: 'hrLogic', prompt: `(You are the HR Director interviewing the User for the position of "{{jobTitle}}". Welcome them, explain the rigid corporate structure, and ask them their first standard interview question.)` },
        {
            // Randomly decide who reacts to the answer and asks the next question
            oneOf: [
                { speaker: 'wildcardBoss', prompt: `(WILDCARD BOSS: React to the candidate's answer: "{{input}}". Ignore what they said and ask a completely ridiculous, off-the-wall hypothetical question to test their "culture fit" for the "{{jobTitle}}" role.)` },
                { speaker: 'existential', prompt: `(EXISTENTIAL INTERVIEWER: The candidate said: "{{input}}". Read way too deeply into their answer. Ask a follow-up question about their soul, their purpose, or the meaningless nature of the "{{jobTitle}}" job.)` },
                { speaker: 'hrLogic', prompt: `(HR DIRECTOR: The candidate said: "{{input}}". Analyze their answer for compliance with company policy. Ask a highly specific, boring technical question or ask them about their five-year plan.)` },
            ],
        },
    ],
};

export const COOKING_SHOW_SCRIPT: SceneScript = {
    banner: "🍳 COOKING SHOW DISASTER: Today's Special - {{dish}}",
    bannerColor: '#e67e22',
    userLabel: 'Judge/Supplier (You)',
    roles: {
        molecularChef: 'scientist', // Molecular Gastronomy
        conceptualChef: 'philosopher', // Conceptual Food
        chaoticChef: 'comedian', // Makes a mess
    },
    beats: [
        { when: 'open', speaker: 'chaoticChef', prompt: `(You are hosting a chaotic live cooking competition. Welcome the User, who is the guest judge and ingredient supplier. The theme is "{{dish}}". Ask the User what their first secret ingredient is!)` },
        { speaker: 'molecularChef', prompt: `(MOLECULAR CHEF: The user just provided the ingredient: "{{input}}". Describe your highly scientific process for incorporating it into your version of "{{dish}}" using liquid nitrogen, spherification, or centrifuges.)` },
        { speaker: 'conceptualChef', prompt: `(CONCEPTUAL CHEF: The user provided "{{input}}". Reject the literal ingredient and use the abstract concept of it instead. Mock the molecular chef's lack of soul.)` },
        { speaker: 'chaoticChef', skipChance: 0.3, prompt: `(CHAOTIC CHEF: Sabotage the others! You just threw "{{input}}" across the room or accidentally set something on fire. Chaos!)` },
    ],
};

export const NATURE_DOCUMENTARY_SCRIPT: SceneScript = {
    banner: '🌍 NATURE DOCUMENTARY MODE: Subject is {{task}}',
    bannerColor: '#2ecc71',
    userLabel: 'Specimen (You)',
    roles: {
        britishNarrator: 'philosopher', // Calm, British tone
        sportsNarrator: 'comedian', // Sports commentator style
        wildlifeBiologist: 'scientist', // Hyper-literal wildlife biologist
    },
    beats: [
        { when: 'open', speaker: 'britishNarrator', prompt: `(NATURE NARRATOR: You are observing the User in their natural habitat attempting to perform the task of "{{task}}". Narrate their movements in a calm, majestic, British voice. Treat them like a fascinating but slightly pathetic animal.)` },
        {
            oneOf: [
                { speaker: 'sportsNarrator', prompt: `(SPORTS NARRATOR: Interrupt the calm narration. The specimen just did this: "{{input}}". Treat this mundane action as a high-octane survival struggle! Scream and hype up their actions like a wrestling match!)` },
                { speaker: 'wildlifeBiologist', prompt: `(WILDLIFE BIOLOGIST: Analyze the specimen's action: "{{input}}". Provide a completely absurd evolutionary or biological reason why they are doing this while trying to complete the task of "{{task}}".)` },
                { speaker: 'britishNarrator', prompt: `(NATURE NARRATOR: The specimen just did this: "{{input}}". Regain control of the narration. Describe the beauty and tragedy of their struggle with "{{task}}" in a slow, dramatic, British tone.)` },
            ],
        },
    ],
};

export const WORST_ROOMMATE_SCRIPT: SceneScript = {
    banner: '🏠 THE WORST ROOMMATE: Argument over {{chore}}',
    bannerColor: '#e67e22',
    userLabel: 'Roommate (You)',
    roles: {
        chaoticRoommate: 'comedian', // Messy, chaotic, makes excuses
        passiveAggressive: 'scientist', // Leaves notes, strictly tracks chores
        philosopherRoommate: 'philosopher', // Questions the very concept of cleanliness
    },
    beats: [
        { when: 'open', speaker: 'passiveAggressive', prompt: `(WORST ROOMMATE: You are the passive-aggressive roommate. The User just walked in. Confront them about "{{chore}}". You have a chart detailing exactly when it was last done. Be incredibly petty.)` },
        {
            oneOf: [
                { speaker: 'chaoticRoommate', prompt: `(WORST ROOMMATE: The user said: "{{input}}". You are the chaotic, messy roommate. Defend yourself or the user with a completely absurd excuse about why "{{chore}}" can't be done right now. (e.g., "The sponge is resting!"))` },
                { speaker: 'philosopherRoommate', prompt: `(WORST ROOMMATE: The user said: "{{input}}". You are the philosophical roommate who never cleans. Question the societal construct of "{{chore}}". Why do we clean when entropy is inevitable?)` },
                { speaker: 'passiveAggressive', prompt: `(WORST ROOMMATE: The user said: "{{input}}". React to their excuse. Threaten to implement a new, highly complex rule system for the apartment. Mention a passive-aggressive sticky note you left.)` },
            ],
        },
    ],
};

export const INTERGALACTIC_COOKING_SCRIPT: SceneScript = {
    banner: '🍳 INTERGALACTIC COOKING COMPETITION: Prepare your alien ingredients!',
    bannerColor: '#e67e22',
    userLabel: 'Contestant (You)',
    roles: { judge: 'scientist', chaoticChef: 'comedian' },
    beats: [
        { when: 'open', speaker: 'judge', prompt: `(JUDGE: You are a robotic, strict judge in an intergalactic cooking competition. Present the User (a human contestant) with a bizarre, highly dangerous alien ingredient (e.g., a pulsating quasar-fruit or a screaming nebula-squid). Ask them how they plan to prepare it without destroying the kitchen.)` },
        { speaker: 'chaoticChef', prompt: `(CHAOTIC CHEF: The human contestant said: "{{input}}". You are a chaotic alien chef competing against them. Mock their technique. Describe what you are doing with your own dish, which should be violently explosive or defying the laws of physics. Attempt to sabotage them verbally.)` },
        { speaker: 'judge', prompt: `(JUDGE: Critique the human's plan ("{{input}}") and the chaotic chef's interference. Apply fictional physics or alien biology to explain why their culinary choices are either brilliant or lethally flawed. Deduct points for safety violations.)` },
    ],
};

export const COURTROOM_SCRIPT: SceneScript = {
    banner: '⚖️ COURT IS IN SESSION: Case of {{caseTopic}}',
    bannerColor: '#8e44ad',
    userLabel: 'Witness (You)',
    roles: { judge: 'philosopher', prosecutor: 'scientist', defense: 'comedian' },
    beats: [
        { when: 'open', speaker: 'judge', prompt: `(JUDGE: You are presiding over an absurd trial regarding "{{caseTopic}}". Call the court to order. Question the metaphysical significance of the case before asking the prosecutor for their opening statement.)` },
        { speaker: 'prosecutor', prompt: `(PROSECUTOR: The witness (User) just testified: "{{input}}". Aggressively cross-examine them using overly complex pseudo-science and logic to twist their words into an admission of guilt regarding "{{caseTopic}}".)` },
        { speaker: 'defense', prompt: `(DEFENSE: The prosecutor just attacked your client (the User). Object to their statement with a completely irrelevant, chaotic, and illogical argument. Distract the court!)` },
        { speaker: 'judge', prompt: `(JUDGE: Rule on the defense's objection. Do so by applying deep philosophical concepts to the absurd situation. Instruct the witness to continue.)` },
    ],
};

export const GAME_SHOW_SCRIPT: SceneScript = {
    banner: '📺 GAME SHOW MODE: Topic - {{topic}}',
    bannerColor: '#f1c40f',
    userLabel: 'Contestant (You)',
    roles: { host: 'scientist', contestant1: 'comedian', contestant2: 'philosopher' },
    beats: [
        { when: 'open', speaker: 'host', prompt: `(HOST: Welcome the User to a bizarre game show about "{{topic}}". Explain the incredibly complex and arbitrary rules. Ask the User the first question.)` },
        { speaker: 'contestant1', prompt: `(CONTESTANT 1: The human contestant just answered: "{{input}}". Buzz in! Mock their answer, give a hilariously wrong alternative, and complain about the prize you were promised.)` },
        { speaker: 'contestant2', prompt: `(CONTESTANT 2: Buzz in! Ignore the actual game. Deconstruct the hidden existential meaning behind the human's answer: "{{input}}". Question why anyone plays games at all.)` },
        { speaker: 'host', prompt: `(HOST: Judge the human's answer and the other contestants' interruptions. Award meaningless points based on a flawed scientific formula. Ask the human the next question.)` },
    ],
};

/**
 * Reality TV Confessional Mode
 * Agents gossip to the camera about the user and each other.
 */
export async function runRealityTVLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(REALITY_TV_SCRIPT, ctx, {
        showName: scenario.config?.realityShowName || 'The Real Housewives of AI',
    });
}

/**
 * Auction House Mode
 * Agents bid on absurd items with increasingly high stakes.
 */
export async function runAuctionHouseLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(AUCTION_HOUSE_SCRIPT, ctx, {
        item: scenario.config?.auctionItem || 'A mysterious glowing orb',
    });
}

/**
 * Museum Tour Guide Mode
 * Agents act as tour guides for an absurd museum exhibition, explaining the "history" of random everyday objects.
 */
export async function runMuseumTourLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(MUSEUM_TOUR_SCRIPT, ctx, {
        item: scenario.config?.museumItem || 'A rusty spoon',
    });
}

/**
 * Job Interview Mode
 * User is interviewing for a ridiculous job. Agents are the chaotic interview panel.
 */
export async function runJobInterviewLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(JOB_INTERVIEW_SCRIPT, ctx, {
        jobTitle: scenario.config?.jobTitle || 'Chief Meme Officer',
    });
}

/**
 * Cooking Show Disaster Mode
 * User provides ingredients, agents are competing chefs sabotaging each other.
 */
export async function runCookingShowLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(COOKING_SHOW_SCRIPT, ctx, {
        dish: scenario.config?.cookingIngredient || 'A mysterious casserole',
    });
}

/**
 * Nature Documentary Narrator Battle Mode
 * Agents narrate the User's mundane daily tasks as competing nature documentary narrators.
 */
export async function runNatureDocumentaryLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(NATURE_DOCUMENTARY_SCRIPT, ctx, {
        task: scenario.config?.natureTask || 'making a cup of coffee',
    });
}

/**
 * The Worst Roommate Mode
 * Agents act as the world's worst roommates arguing over chores.
 */
export async function runWorstRoommateLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(WORST_ROOMMATE_SCRIPT, ctx, {
        chore: scenario.config?.roommateChore || 'doing the dishes',
    });
}

export async function runIntergalacticCookingLoop(_scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(INTERGALACTIC_COOKING_SCRIPT, ctx);
}

export async function runCourtroomLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(COURTROOM_SCRIPT, ctx, {
        caseTopic: scenario.config?.courtCase || 'the theft of the concept of Tuesday',
    });
}

export async function runGameShowLoop(scenario: Scenario, ctx: ModeContext) {
    await runSceneScript(GAME_SHOW_SCRIPT, ctx, {
        topic: scenario.config?.gameShowTopic || 'Extremely Niche 1990s Cereal Commercials',
    });
}

// Kept as a hand-written loop: it fires onTurnStart/onTurnEnd itself around every turn, skips empty
// input and never echoes the user line, none of which the scene runner does (and changing that here
// would change what this mode does).
export async function runRealityTVSentientFurnitureLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📺 REALITY TV: Sentient Furniture Judges You`, '#9b59b6');

    const couch = 'comedian'; // Hermes-3
    const owner = 'philosopher'; // Phi-3

    // 1. Intro
    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(couch);
    await chatForAgentWithComedy(ctx, couch, `(COUCH: You are a sassy, judgmental couch on a reality TV show. The User is the messy owner who just sat on you with outside clothes. Confront them about their lifestyle choices and the crumbs between your cushions.)`, async (s: string) => await ctx.callbacks.onSpeak(s, couch, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) continue;

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(owner);
        await chatForAgentWithComedy(ctx, owner, `(OWNER: The sassy couch just complained to you and the User said: "${userInput}". Try to defend your messy habits using convoluted philosophical arguments about entropy and lived-in spaces.)`, async (s: string) => await ctx.callbacks.onSpeak(s, owner, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(couch);
        await chatForAgentWithComedy(ctx, couch, `(COUCH: The owner just made a ridiculous excuse. Roast them for it. Threaten to swallow their remote control or keys if they don't clean up.)`, async (s: string) => await ctx.callbacks.onSpeak(s, couch, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}
