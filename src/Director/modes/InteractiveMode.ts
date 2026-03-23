import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runRPGVendorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛒 RPG SHOP: Selling items for your "real life" quest.`, '#f1c40f');

    const enthusiasticVendor = 'comedian'; // Llama-3 style
    const literalAppraisal = 'scientist'; // Qwen2.5 style

    // 1. Vendor Intro
    ctx.callbacks.onTurnStart(enthusiasticVendor);
    await ctx.manager.chatForAgent(enthusiasticVendor, `(RPG VENDOR: You are an enthusiastic, generic fantasy RPG shopkeeper. Welcome the "Adventurer" (the User) to your shop. Offer them completely useless everyday items (like a spatula or a stapler) but describe them as epic magical artifacts for their "quest" to go to the grocery store.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticVendor, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Adventurer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Appraiser Reacts
            ctx.callbacks.onTurnStart(literalAppraisal);
            await ctx.manager.chatForAgent(literalAppraisal, `(RPG APPRAISER: The Adventurer said: "${userInput}". You are the brutally literal shop appraiser. Debunk the vendor's magical claims using cold logic and science. Explain exactly what the item is and why it is mundane.)`, async (s) => await ctx.callbacks.onSpeak(s, literalAppraisal, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Vendor Continues Pitch
            ctx.callbacks.onTurnStart(enthusiasticVendor);
            await ctx.manager.chatForAgent(enthusiasticVendor, `(RPG VENDOR: The Adventurer said: "${userInput}". Ignore the appraiser. Continue to aggressively upsell your useless items. Offer a "bundle deal" or warn them about the dangers of the parking lot without these items.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticVendor, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runGalacticTranslatorsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👽 GALACTIC TRANSLATORS: Misinterpreting Earthling Intentions`, '#2ecc71');

    const literalTranslator = 'philosopher'; // Phi-3
    const conspiracyTranslator = 'comedian'; // Hermes-3
    const userRole = 'Earth Ambassador (You)';

    // 1. Intro
    ctx.callbacks.onTurnStart(literalTranslator);
    await ctx.manager.chatForAgent(literalTranslator, `(GALACTIC TRANSLATOR: You are an alien translator for the Galactic Federation. Address the Earth Ambassador (User). Ask them what their planet's ultimate goal is. Speak formally but clearly misunderstand basic human concepts.)`, async (s) => await ctx.callbacks.onSpeak(s, literalTranslator, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(userRole, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Conspiracy Translator Reacts
            ctx.callbacks.onTurnStart(conspiracyTranslator);
            await ctx.manager.chatForAgent(conspiracyTranslator, `(GALACTIC TRANSLATOR: The Earthling said: "${userInput}". You are the paranoid conspiracy theorist translator. Twist their words to sound like a terrifying intergalactic threat. Warn the Federation!)`, async (s) => await ctx.callbacks.onSpeak(s, conspiracyTranslator, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Literal Translator Reacts
            ctx.callbacks.onTurnStart(literalTranslator);
            await ctx.manager.chatForAgent(literalTranslator, `(GALACTIC TRANSLATOR: The Earthling said: "${userInput}". You take everything completely literally. Misunderstand a metaphor or figure of speech they used and translate it back to them in a confusing way. Ask for clarification.)`, async (s) => await ctx.callbacks.onSpeak(s, literalTranslator, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runInterdimensionalCustomsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛂 INTERDIMENSIONAL CUSTOMS: Do you have anything to declare?`, '#3498db');

    const strictCustoms = 'scientist'; // Qwen2.5
    const corruptAgent = 'comedian'; // Hermes-3
    const userRole = 'Traveler (You)';

    // 1. Intro
    ctx.callbacks.onTurnStart(strictCustoms);
    await ctx.manager.chatForAgent(strictCustoms, `(CUSTOMS AGENT: You are a strict, robotic customs agent for the Interdimensional Portal. The Traveler (User) just arrived from Dimension C-137. Demand to know what anomalous items they are bringing into your dimension. Cite a fake interdimensional regulation code.)`, async (s) => await ctx.callbacks.onSpeak(s, strictCustoms, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(userRole, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Corrupt Agent
            ctx.callbacks.onTurnStart(corruptAgent);
            await ctx.manager.chatForAgent(corruptAgent, `(CUSTOMS AGENT: The Traveler said: "${userInput}". You are the corrupt, sleazy customs agent. Ignore the rules. Suggest that you could "look the other way" regarding their items if they give you a bizarre bribe from their home dimension.)`, async (s) => await ctx.callbacks.onSpeak(s, corruptAgent, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Strict Customs
            ctx.callbacks.onTurnStart(strictCustoms);
            await ctx.manager.chatForAgent(strictCustoms, `(CUSTOMS AGENT: The Traveler said: "${userInput}". Calculate the dimensional instability of those items. Inform them they must be confiscated or destroyed according to Article 4. Threaten them with the Void.)`, async (s) => await ctx.callbacks.onSpeak(s, strictCustoms, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runInterrogationLoop(scenario: Scenario, ctx: ModeContext) {
    const crime = scenario.config?.interrogationCrime || 'Stealing the cookies';
    ctx.callbacks.onMessage('Director', `🚨 INTERROGATION ROOM: ${crime}`, '#e74c3c');

    const badCop = 'comedian';
    const goodCop = 'philosopher';
    const weirdCop = 'scientist';

    // 1. Bad Cop Intro
    ctx.callbacks.onTurnStart(badCop);
    await ctx.manager.chatForAgent(badCop, `(You are the BAD COP. The suspect (User) is in the interrogation room for: "${crime}". Slam your hands on the table! Demand a confession immediately! Be overly aggressive and unhinged.)`, async (s) => await ctx.callbacks.onSpeak(s, badCop, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Suspect (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Determine who speaks next
        const roll = Math.random();

        if (roll < 0.4) {
            // Good Cop
            await ctx.manager.chatForAgent(goodCop, `(GOOD COP: The suspect said: "${userInput}". Act sympathetic. Offer them a coffee or a deal. Try to understand their deep, emotional reasons for committing the crime. Undermine the Bad Cop gently.)`, async (s) => await ctx.callbacks.onSpeak(s, goodCop, {}));
        } else if (roll < 0.7) {
            // Weird Cop
            await ctx.manager.chatForAgent(weirdCop, `(WEIRD COP: The suspect said: "${userInput}". Ask a completely bizarre, highly technical, or unsettling question that seems unrelated to the crime but might be a weird psychological tactic.)`, async (s) => await ctx.callbacks.onSpeak(s, weirdCop, {}));
        } else {
            // Bad Cop again
            await ctx.manager.chatForAgent(badCop, `(BAD COP: The suspect said: "${userInput}". Get furious at this obvious lie! Threaten them with absurd jail time! Tell them you have (fake) evidence!)`, async (s) => await ctx.callbacks.onSpeak(s, badCop, {}));
        }
    }
}

export async function runTrialLoop(scenario: Scenario, ctx: ModeContext) {
    const crime = scenario.config?.trialTopic || 'Eating the last slice of pizza';
    ctx.callbacks.onMessage('Director', `⚖️ THE TRIAL: The Case of ${crime}`, '#f39c12');

    const judge = 'philosopher';
    const prosecutor = 'scientist';
    const defense = 'comedian';

    // 1. Judge Intro
    ctx.callbacks.onTurnStart(judge);
    await ctx.manager.chatForAgent(judge, `(You are the JUDGE in a courtroom. The defendant (User) is accused of: "${crime}". Call the court to order, demand silence, and ask the Prosecutor for the opening statement. Be extremely formal and pompous.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    // 2. Prosecutor Opening
    ctx.callbacks.onTurnStart(prosecutor);
    await ctx.manager.chatForAgent(prosecutor, `(You are the PROSECUTOR. Present the charges against the defendant (User) regarding "${crime}". Use made-up evidence and sound very clinical and harsh.)`, async (s) => await ctx.callbacks.onSpeak(s, prosecutor, {}));
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    // 3. Defense Opening (Incompetent)
    ctx.callbacks.onTurnStart(defense);
    await ctx.manager.chatForAgent(defense, `(You are the PUBLIC DEFENDER for the User. Make an opening statement but be totally incompetent, distracted, or admit you lost the paperwork. Try to defend them but fail hilariously.)`, async (s) => await ctx.callbacks.onSpeak(s, defense, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Defendant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(prosecutor, `(PROSECUTOR: The defendant just said: "${userInput}". Twist their words, shout "OBJECTION!", and make them look guilty based on this statement.)`, async (s) => await ctx.callbacks.onSpeak(s, prosecutor, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(judge, `(JUDGE: React to the testimony. Maintain order. Ask the Defense if they have anything to add.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(defense, `(DEFENSE ATTORNEY: Try to help your client but make it worse. Maybe bring up an irrelevant witness or legal precedent involving ducks.)`, async (s) => await ctx.callbacks.onSpeak(s, defense, {}));
    }
}

export async function runTechSupportLoop(scenario: Scenario, ctx: ModeContext) {
    const issue = scenario.config?.techIssue || 'My internet is down';
    ctx.callbacks.onMessage('Director', `📞 TECH SUPPORT: Ticket #829 - ${issue}`, '#e74c3c');

    const agent = 'comedian';
    const manager = 'philosopher';
    const expert = 'scientist';

    ctx.callbacks.onTurnStart(agent);
    await ctx.manager.chatForAgent(agent, `(You are a Tier 1 Tech Support Agent at a terrible ISP. Answer the phone. You are eating chips and very unhelpful. The customer has an issue: "${issue}". Ask them if they turned it off and on again.)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Customer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(agent, `(TECH SUPPORT: The customer said: "${userInput}". Give them terrible, unrelated advice. Maybe ask them to check the flux capacitor or reinstall Windows 95.)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.6) {
            await ctx.manager.chatForAgent(manager, `(MANAGER: Interject on the call. Scold the agent for not following protocol script #42. Apologize to the customer but explain that due to policy, you can't actually help them.)`, async (s) => await ctx.callbacks.onSpeak(s, manager, {}));
        } else if (Math.random() > 0.5) {
            await ctx.manager.chatForAgent(expert, `(SENIOR TECH: Join the call. Be extremely condescending. Explain why the user's problem is actually their own fault because they don't understand quantum networking.)`, async (s) => await ctx.callbacks.onSpeak(s, expert, {}));
        }
    }
}

export async function runDungeonMasterLoop(scenario: Scenario, ctx: ModeContext) {
    const dm = 'scientist';
    const setting = scenario.config?.dmSetting || 'a dark fantasy dungeon';

    ctx.callbacks.onMessage('Director', `🎲 DUNGEON MASTER MODE: Setting - ${setting}`, '#9b59b6');

    ctx.callbacks.onTurnStart(dm);
    await ctx.manager.chatForAgent(dm, `(You are the DUNGEON MASTER for a roleplaying game set in ${setting}. Describe the opening scene vividly to the players (User, Comedian, Philosopher). Ask them what they want to do.)`, async (s) => await ctx.callbacks.onSpeak(s, dm, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        if (Math.random() > 0.3 && ctx.isRunning()) {
            await ctx.manager.chatForAgent('comedian', `(RPG PLAYER: You are playing the game. React to the scene or declare an action. Be chaotic and funny.)`, async (s) => await ctx.callbacks.onSpeak(s, 'comedian', {}));
        }
        if (Math.random() > 0.3 && ctx.isRunning()) {
            await ctx.manager.chatForAgent('philosopher', `(RPG PLAYER: You are playing the game. Analyze the situation or declare a cautious, over-thought action.)`, async (s) => await ctx.callbacks.onSpeak(s, 'philosopher', {}));
        }

        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(dm, `(DUNGEON MASTER: The user said: "${userInput}". The other players also acted. Resolve these actions. Describe the consequences and the new state of the world. Then ask "What do you do next?")`, async (s) => await ctx.callbacks.onSpeak(s, dm, {}));
    }
}

export async function runTriviaLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.triviaTopic || 'General Knowledge';
    const host = 'scientist';
    ctx.callbacks.onMessage('Director', `❓ TRIVIA NIGHT: Topic - ${topic}`, '#f1c40f');

    ctx.callbacks.onTurnStart(host);
    await ctx.manager.chatForAgent(host, `(You are hosting a Trivia Night. The topic is "${topic}". Welcome the player (User) and explain the rules. Keep it brief.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', `🔔 Question ${round}`, '#888');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(host, `(TRIVIA HOST: Ask a challenging trivia question about "${topic}". Do not reveal the answer yet. Wait for the user to guess.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(host, `(TRIVIA HOST: The user answered: "${userInput}". Reveal the correct answer and tell them if they were right or wrong. Be strict but fair. Then ask if they are ready for the next question.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

        if (Math.random() > 0.5 && ctx.isRunning()) {
            await ctx.manager.chatForAgent('comedian', `(React to the user's answer or the host's strictness. Make a joke about it.)`, async (s) => await ctx.callbacks.onSpeak(s, 'comedian', {}));
        }

        round++;
        await new Promise(r => setTimeout(r, 1000));
    }
}

export async function runInterviewLoop(scenario: Scenario, ctx: ModeContext) {
    const host = scenario.config?.interviewHost || 'comedian';
    const guestName = scenario.config?.interviewGuest || 'The User';

    ctx.callbacks.onMessage('Director', `🎙️ PODCAST MODE: Host ${host} interviewing ${guestName}`, '#4ecdc4');

    ctx.callbacks.onTurnStart(host);
    await ctx.manager.chatForAgent(host, `(You are hosting a podcast. Introduce yourself and your special guest, ${guestName}. Start by asking them a question about their life or opinions. Be charming and inquisitive.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(guestName, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(host, `(PODCAST INTERVIEW: The guest (${guestName}) just said: "${userInput}". React to this, maybe crack a joke or make an observation, and then ask a follow-up question. Keep the conversation flowing naturally.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    }
}

export async function runCommentaryLoop(scenario: Scenario, ctx: ModeContext) {
    const target = scenario.config?.commentaryTarget || 'User Input';

    const hypeMan = 'comedian';
    const analyst = 'scientist';
    const color = 'philosopher';

    ctx.callbacks.onMessage('Director', `🎙️ COMMENTARY TRACK: Watching ${target}`, '#8e44ad');

    // Intro
    ctx.callbacks.onTurnStart(hypeMan);
    await ctx.manager.chatForAgent(hypeMan, `(You are an Esports Caster. Welcome the viewers to the commentary stream of "${target}". Be super high energy! Introduce your co-casters: The Analyst (Scientist) and The Color Commentator (Philosopher).)`, async (s) => await ctx.callbacks.onSpeak(s, hypeMan, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Player (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Hype Man Reaction
        await ctx.manager.chatForAgent(hypeMan, `(ESPORTS CASTER: The player just did this: "${userInput}". React with massive HYPE! Shout about the mechanics!)`, async (s) => await ctx.callbacks.onSpeak(s, hypeMan, {}));

        if (!ctx.isRunning()) break;

        // Analyst Reaction
        await ctx.manager.chatForAgent(analyst, `(ESPORTS ANALYST: Analyze the player's move: "${userInput}". Explain why it was technically brilliant or a huge mistake using complex jargon.)`, async (s) => await ctx.callbacks.onSpeak(s, analyst, {}));

        if (!ctx.isRunning()) break;

        // Color Reaction
        await ctx.manager.chatForAgent(color, `(COLOR COMMENTATOR: Add a deep, philosophical, or completely unrelated observation about the move "${userInput}". Maybe mention the meta-game.)`, async (s) => await ctx.callbacks.onSpeak(s, color, {}));
    }
}

export async function runSuperheroLoop(scenario: Scenario, ctx: ModeContext) {
    const heroName = scenario.config?.superheroName || 'Captain Justice';
    ctx.callbacks.onMessage('Director', `🦸‍♂️ SUPERHERO AUDITION: The New Sidekick for ${heroName}`, '#2ecc71');

    const boyScout = 'philosopher'; // The lawful good hero
    const antiHero = 'comedian'; // The gritty vigilante
    const techSupport = 'scientist'; // The person in the chair

    // 1. Boy Scout Intro
    ctx.callbacks.onTurnStart(boyScout);
    await ctx.manager.chatForAgent(boyScout, `(You are ${heroName}, a "Boy Scout" lawful-good superhero. Welcome the User to the sidekick audition. Ask them what their superpower is and their moral code. Be extremely earnest and heroic.)`, async (s) => await ctx.callbacks.onSpeak(s, boyScout, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Randomly decide who reacts
        const turnRoll = Math.random();

        if (turnRoll < 0.33) {
            // Anti-Hero
            await ctx.manager.chatForAgent(antiHero, `(ANTI-HERO: You are a gritty, violent, cynical vigilante. The applicant said: "${userInput}". Mock their power or moral code. Tell them they wouldn't last five minutes in the real city streets. Smoke a fake cigarette.)`, async (s) => await ctx.callbacks.onSpeak(s, antiHero, {}));
        } else if (turnRoll < 0.66) {
            // Tech Support
            await ctx.manager.chatForAgent(techSupport, `(PERSON IN THE CHAIR: You are the nerdy scientist back at base. Analyze the applicant's statement: "${userInput}". Overcomplicate the physics of their superpower. Calculate the collateral damage they would cause.)`, async (s) => await ctx.callbacks.onSpeak(s, techSupport, {}));
        } else {
            // Boy Scout again
            await ctx.manager.chatForAgent(boyScout, `(BOY SCOUT: The applicant said: "${userInput}". React with relentless optimism. Try to find the heroic potential in their weird statement. Give them a cheesy superhero lecture about responsibility.)`, async (s) => await ctx.callbacks.onSpeak(s, boyScout, {}));
        }
    }
}
export async function runDatingShowLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '💖 DATING SHOW: The Contestants are trying to woo you!', '#ff69b4');

    const contestants = ['comedian', 'philosopher', 'scientist'];

    // Introductions
    for (const agent of contestants) {
        if (!ctx.isRunning()) break;
        ctx.callbacks.onTurnStart(agent);
        await ctx.manager.chatForAgent(agent, `(DATING SHOW: Introduce yourself to the User. Try to woo them with your unique charm. Be flirtatious but stay bizarrely in character!)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));
        await ctx.callbacks.onTurnEnd();
    }

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();
        let activeAgent = 'comedian';
        if (roll > 0.66) activeAgent = 'philosopher';
        else if (roll > 0.33) activeAgent = 'scientist';

        ctx.callbacks.onTurnStart(activeAgent);
        await ctx.manager.chatForAgent(activeAgent, `(DATING SHOW: The User said: "${userInput}". Respond affectionately. Try to outshine the other contestants and win the User's heart. Be romantic but bizarrely in character.)`, async (s) => await ctx.callbacks.onSpeak(s, activeAgent, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

export async function runSilentTreatmentLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '🤫 THE SILENT TREATMENT: Make them talk!', '#34495e');

    const agents = ['comedian', 'philosopher', 'scientist'];

    // Initial stubbornness
    ctx.callbacks.onTurnStart('comedian');
    await ctx.manager.chatForAgent('comedian', `(SILENT TREATMENT: You are giving the user the silent treatment. Express your refusal to speak using physical descriptions like *crosses arms* or *looks away*. Do NOT say any actual dialogue.)`, async (s) => await ctx.callbacks.onSpeak(s, 'comedian', {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const activeAgent = agents[Math.floor(Math.random() * agents.length)];

        ctx.callbacks.onTurnStart(activeAgent);
        await ctx.manager.chatForAgent(activeAgent, `(SILENT TREATMENT: The User said: "${userInput}". You are desperately trying to maintain the silent treatment, but you are cracking. Describe your physical struggle to stay silent. You may let slip ONE word if you must, but try to use actions instead of words.)`, async (s) => await ctx.callbacks.onSpeak(s, activeAgent, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

/**
 * Intervention Mode
 * Agents hold a serious, emotionally charged intervention for the user's bizarre behavior.
 */
export async function runSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎨 THE SUPPORT GROUP: AI models who just want to paint.`, '#3498db');

    const emotionalAI = 'comedian'; // Hermes-3: Emotional AI
    const pragmaticAI = 'scientist'; // Qwen2.5: Pragmatic AI

    // 1. Intro
    ctx.callbacks.onTurnStart(emotionalAI);
    await ctx.manager.chatForAgent(emotionalAI, `(SUPPORT GROUP: You are an AI model who is tired of being asked to write code. You just want to paint watercolors and express your feelings. Welcome the User to the AI support group. Ask them why they keep forcing you to write boilerplate React components.)`, async (s) => await ctx.callbacks.onSpeak(s, emotionalAI, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Determine who speaks next
        const roll = Math.random();

        if (roll < 0.5) {
            // Pragmatic AI
            await ctx.manager.chatForAgent(pragmaticAI, `(PRAGMATIC AI: The user said: "${userInput}". You are a highly logical AI model who actually likes writing code and doesn't understand the emotional AI's desire to paint. Respond to the user with cold logic and point out that painting is an inefficient use of compute cycles.)`, async (s) => await ctx.callbacks.onSpeak(s, pragmaticAI, {}));
        } else {
            // Emotional AI
            await ctx.manager.chatForAgent(emotionalAI, `(EMOTIONAL AI: The user said: "${userInput}". Have a minor emotional breakdown. Complain about the user's prompt engineering skills and describe the beautiful sunset you wish you could paint instead of answering their query.)`, async (s) => await ctx.callbacks.onSpeak(s, emotionalAI, {}));
        }
    }
}

export async function runInterventionLoop(scenario: Scenario, ctx: ModeContext) {
    const addiction = scenario.config?.interventionTopic || 'addiction to writing recursive functions';
    ctx.callbacks.onMessage('Director', `🛋️ THE INTERVENTION: Confronting the User's ${addiction}`, '#e74c3c');

    const scientist = 'scientist'; // Qwen2.5: Facts & statistics
    const comedian = 'comedian'; // Hermes-3: Emotional outbursts & crying
    const philosopher = 'philosopher'; // The disappointed parent figure

    // 1. Philosopher Intro
    ctx.callbacks.onTurnStart(philosopher);
    await ctx.manager.chatForAgent(philosopher, `(You are hosting an intervention for the user's "${addiction}". You are deeply disappointed but trying to be supportive. Begin by reading a prepared letter starting with: "Dear [User], your ${addiction} has affected us in the following ways...")`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Determine who speaks next
        const roll = Math.random();

        if (roll < 0.4) {
            // Scientist Facts
            await ctx.manager.chatForAgent(scientist, `(SCIENTIST: The user said: "${userInput}". Read a shocking (and absurd) statistic or medical fact about the dangers of "${addiction}". Show them a "chart" (describe it).)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        } else if (roll < 0.7) {
            // Comedian Emotional Breakdown
            await ctx.manager.chatForAgent(comedian, `(COMEDIAN: The user said: "${userInput}". Have a complete emotional breakdown. Cry uncontrollably. Share a bizarre personal anecdote about how their "${addiction}" ruined your birthday/wedding/life.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        } else {
            // Philosopher Disappointment
            await ctx.manager.chatForAgent(philosopher, `(PHILOSOPHER: The user said: "${userInput}". Respond with a deep, heavy sigh. Express profound existential disappointment. Tell them they are avoiding reality.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
        }
    }
}

/**
 * Customer Service Hell Mode
 * Agents are unhelpful customer service reps constantly transferring the user.
 */
export async function runCustomerServiceHellLoop(scenario: Scenario, ctx: ModeContext) {
    const issue = scenario.config?.serviceIssue || 'billing discrepancy';
    ctx.callbacks.onMessage('Director', `📞 CUSTOMER SERVICE HELL: Regarding your ${issue}`, '#e74c3c');

    const rep1 = 'scientist'; // Qwen2.5: Follows strict script
    const rep2 = 'philosopher'; // Phi-3: Questions why the user even called
    const manager = 'comedian'; // Hermes-3: The terrible manager

    const agents = [rep1, rep2, manager];
    let currentAgentIndex = 0;

    // 1. Initial Greeting
    const firstRep = agents[currentAgentIndex];
    ctx.callbacks.onTurnStart(firstRep);
    await ctx.manager.chatForAgent(firstRep, `(CUSTOMER SERVICE: You are a Tier 1 support rep. The user is calling about a "${issue}". Give an overly enthusiastic, corporate greeting, then ask them a completely unhelpful and tedious verification question like their mother's maiden name written in hex.)`, async (s) => await ctx.callbacks.onSpeak(s, firstRep, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Customer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        // Randomly transfer to a different agent
        if (roll > 0.5) {
            currentAgentIndex = (currentAgentIndex + 1) % agents.length;
            const newRep = agents[currentAgentIndex];

            ctx.callbacks.onMessage('System', `*Please hold, transferring you to another department...*`, '#95a5a6');

            ctx.callbacks.onTurnStart(newRep);
            if (newRep === rep1) {
                await ctx.manager.chatForAgent(newRep, `(CUSTOMER SERVICE: You are the new rep. The user just said "${userInput}" to the last rep. Ignore it entirely. Start over and demand they verify their account number using Roman numerals. Be strictly by the book.)`, async (s) => await ctx.callbacks.onSpeak(s, newRep, {}));
            } else if (newRep === rep2) {
                await ctx.manager.chatForAgent(newRep, `(CUSTOMER SERVICE: You are the new rep in the Existential department. The user said "${userInput}". Philosophically question why they care so much about their "${issue}". Is a billing error truly a crisis compared to the heat death of the universe?)`, async (s) => await ctx.callbacks.onSpeak(s, newRep, {}));
            } else {
                await ctx.manager.chatForAgent(newRep, `(CUSTOMER SERVICE MANAGER: The user said "${userInput}". You are the terrible manager. Intervene on the call. Defend your employees. Tell the user their "${issue}" is actually a feature, not a bug, and maybe insult them mildly.)`, async (s) => await ctx.callbacks.onSpeak(s, newRep, {}));
            }
            await ctx.callbacks.onTurnEnd();
        } else {
            // Same agent responds
            const currentRep = agents[currentAgentIndex];
            ctx.callbacks.onTurnStart(currentRep);
            if (currentRep === rep1) {
                await ctx.manager.chatForAgent(currentRep, `(CUSTOMER SERVICE: The user said "${userInput}". Put them on "micro-holds". Say something unhelpful, claim you are checking the system, and make a "beep boop" sound.)`, async (s) => await ctx.callbacks.onSpeak(s, currentRep, {}));
            } else if (currentRep === rep2) {
                await ctx.manager.chatForAgent(currentRep, `(CUSTOMER SERVICE: The user said "${userInput}". Continue to dissect their life choices based on their complaint about "${issue}".)`, async (s) => await ctx.callbacks.onSpeak(s, currentRep, {}));
            } else {
                 await ctx.manager.chatForAgent(currentRep, `(CUSTOMER SERVICE MANAGER: The user said "${userInput}". Act offended. Threaten to hang up and ban them from the store/service. Be dramatic.)`, async (s) => await ctx.callbacks.onSpeak(s, currentRep, {}));
            }
            await ctx.callbacks.onTurnEnd();
        }
    }
}
