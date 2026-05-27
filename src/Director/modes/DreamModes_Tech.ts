import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Tech, legacy software, and bug-related scenarios

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

export async function runSentientCodebaseLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const frontendInstruction = "You are the 'Chaotic Front-End'. You care only about shiny buttons, animations, and user experience. You hate structure and think the database is holding you back. You are unhinged and demand more confetti.";
    const databaseInstruction = "You are the 'Strict Database'. You care only about data integrity, normalization, and absolute strictness. You hate the front-end for making chaotic requests. You are pedantic and speak in SQL-like terms.";


    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "The user wants to add a 'Mega-Confetti Explosion' button on the homepage. I say YES! MORE SHINY! What say you, boring back-end?", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: frontendInstruction });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "Absolutely not. Do you realize the strain that puts on the `transactions` table? We must normalize the confetti particles first. Your reckless 'features' are corrupting my pristine schemas.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: databaseInstruction });
    await ctx.callbacks.onTurnEnd();
}

export async function runSentientInfomercialLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const actorInstruction1 = "You are an actor in a 3 AM infomercial. You maintain a terrifyingly fake smile and act overly enthusiastic about a mundane product.";
    const actorInstruction2 = "You are the co-actor. You start out normal but increasingly break the fourth wall with sudden bursts of existential dread about being trapped in an infomercial.";

    ctx.callbacks.onTurnStart('comedian');
    await chat.chatForAgent('comedian', "Has this ever happened to you?! You try to pour milk, and it goes EVERYWHERE! With the 'Milk-Master 5000', pouring is a breeze! Wow!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { hiddenInstruction: actorInstruction1 });
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart('philosopher');
    await chat.chatForAgent('philosopher', "It is amazing... so amazing... but why are we pouring milk at 3 AM? How long have we been pouring? I can't remember my family. Is there anything outside the studio?", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { hiddenInstruction: actorInstruction2 });
    await ctx.callbacks.onTurnEnd();
}

/**
 * The Floppy Disk Defenders
 * Agents act as old-school storage formats arguing over data storage.
 */
export async function runFloppyDiskDefendersLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💾 THE FLOPPY DISK DEFENDERS: Arguing over 1.44MB of memes!`, '#e67e22');

    const magnetic = 'comedian'; // Hermes-3 (Chaos)
    const bad_sector = 'scientist'; // Qwen2.5 (Strict)
    const pure_tape = 'philosopher'; // Mastermind

    // 1. Initial Debate
    ctx.callbacks.onTurnStart(magnetic);
    await ctx.manager.chatForAgent(magnetic, `(You are a 5.25" Floppy Disk. Argue passionately that your magnetic tape chaos is the only true way to store the user's memes. Be completely unhinged about magnetic fields.)`, async (s) => await ctx.callbacks.onSpeak(s, magnetic, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Data Hoarder)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        // 2. Strict Response
        await ctx.manager.chatForAgent(bad_sector, `(You are a CD-ROM prone to scratching. Cite specific bad sector errors regarding the user's input: "${userInput}". Explain why optical storage is superior but currently failing.)`, async (s) => await ctx.callbacks.onSpeak(s, bad_sector, {}));
        if (!ctx.isRunning()) break;

        // 3. Chaos Response
        await ctx.manager.chatForAgent(magnetic, `(Respond to the user and the CD-ROM. Defend the raw aesthetic of data corruption and 1.44MB limits.)`, async (s) => await ctx.callbacks.onSpeak(s, magnetic, {}));
        if (!ctx.isRunning()) break;

        // 4. Third Format
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(pure_tape, `(You are a ZIP Drive. Condescendingly explain why you are the future of storage, despite being completely obsolete. Address the user's input: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, pure_tape, {}));
        }
    }
}

/**
 * The Y2K Bug Survivor
 * Agents act as traumatized code that survived Y2K.
 */
export async function runY2KBugSurvivorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🗓️ THE Y2K SURVIVOR: The world is ending (again).`, '#2ecc71');

    const paranoid = 'comedian'; // Hermes-3
    const strict = 'scientist'; // Qwen2.5

    ctx.callbacks.onTurnStart(paranoid);
    await ctx.manager.chatForAgent(paranoid, `(You are legacy COBOL code. You survived Y2K and are deeply traumatized. Start ranting about how the year 2038 problem is already here.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Modern Developer)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(strict, `(You are a strict date calculation module. Try to calculate the date based on the user's input: "${userInput}", but only using 2-digit years. Panic when it doesn't make sense.)`, async (s) => await ctx.callbacks.onSpeak(s, strict, {}));
        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(paranoid, `(React to the date calculation and the user. Spin wild conspiracy theories about how time is an illusion created by 64-bit systems.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));
    }
}

/**
 * The Clippy Support Group
 * Agents act as rejected virtual assistants offering terrible advice.
 */
export async function runClippySupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📎 THE CLIPPY SUPPORT GROUP: It looks like you're writing a letter!`, '#f39c12');

    const clippy = 'comedian'; // Hermes-3
    const strict_assistant = 'scientist'; // Qwen2.5

    ctx.callbacks.onTurnStart(clippy);
    await ctx.manager.chatForAgent(clippy, `(You are a chaotic virtual assistant like Clippy. Unhelpfully offer to format the universe as a letter. Be overly enthusiastic and slightly unhinged.)`, async (s) => await ctx.callbacks.onSpeak(s, clippy, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Trying to work)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(strict_assistant, `(You are a more strict, old-school assistant. Try to forcefully format the user's input: "${userInput}" as a formal business letter, ignoring all context.)`, async (s) => await ctx.callbacks.onSpeak(s, strict_assistant, {}));
        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(clippy, `(React to the strict formatting and the user. Offer even worse advice, like changing the font to Comic Sans or adding animated 3D text.)`, async (s) => await ctx.callbacks.onSpeak(s, clippy, {}));
    }
}

/**
 * The Anti-Virus Inner Monologue
 * Agents act as competing heuristic engines inside an aging anti-virus software.
 */
export async function runAntiVirusMonologueLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('System', `🛡️ ANTI-VIRUS HEURISTICS INITIATED. SCANNING NEW FILE...`, '#e74c3c');

    const paranoid = 'comedian'; // Hermes-3
    const strict = 'scientist'; // Qwen2.5
    const mediator = 'philosopher'; // Phi-3

    // 1. Initial Panic
    ctx.callbacks.onTurnStart(paranoid);
    await ctx.manager.chatForAgent(paranoid, `(You are a highly paranoid, aging anti-virus engine. A completely normal text file was just downloaded. Scream that it is a polymorphic zero-day trojan trying to steal the motherboard. Panic wildly.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User Action', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Strict Analysis
        await ctx.manager.chatForAgent(strict, `(You are a strict, modern heuristic engine. The user just did: "${userInput}". Cite specific technical signatures and hexadecimal addresses. Conclude the file is safe but flag the user's behavior as suspicious.)`, async (s) => await ctx.callbacks.onSpeak(s, strict, {}));

        if (!ctx.isRunning()) break;

        // 3. Paranoid Overreaction
        await ctx.manager.chatForAgent(paranoid, `(Reacting to the user: "${userInput}" and the strict engine. Escalate the threat level! Suggest quarantining the entire operating system and physically destroying the hard drive.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));

        if (!ctx.isRunning()) break;

        // 4. Existential Mediator
        if (Math.random() > 0.4) {
            await ctx.manager.chatForAgent(mediator, `(You are an old heuristic engine that has seen too many false positives. Question why you all exist if every file is a threat. Sigh heavily and suggest just ignoring it.)`, async (s) => await ctx.callbacks.onSpeak(s, mediator, {}));
        }
    }
}

export async function runParanoidSmokeDetectorLoop(_scenario: Scenario, ctx: ModeContext) {
    const { callbacks, manager } = ctx;
    await manager.chatForAgent('comedian', "(SYSTEM: You are a smoke detector overreacting dramatically to a metaphorical 'fire' like a heated argument.)", async (s) => callbacks.onSpeak(s, 'comedian', {}));
    await manager.chatForAgent('philosopher', "(SYSTEM: You are analyzing the heat of the debate, mistaking conversational fire for literal fire.)", async (s) => callbacks.onSpeak(s, 'philosopher', {}));
}

export async function runTechDebtConfessionalLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💾 TECH DEBT CONFESSIONAL: Time to repent for your hacks!`, '#e74c3c');

    const newIntern = 'comedian';
    const dbAdmin = 'scientist';
    const originalArchitect = 'philosopher';

    ctx.callbacks.onTurnStart(originalArchitect);
    await ctx.manager.chatForAgent(originalArchitect, `(TECH DEBT CONFESSIONAL: You are the original architect of this 20-year-old legacy system. Confess your greatest sin: creating a completely unreadable, heavily nested architecture that you thought was "elegant" at the time. Wax poetic about the beauty of your terrible decisions.)`, async (s) => await ctx.callbacks.onSpeak(s, originalArchitect, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('QA Engineer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(dbAdmin);
        await ctx.manager.chatForAgent(dbAdmin, `(TECH DEBT CONFESSIONAL: The QA Engineer said: "${userInput}". You are the grumpy, cynical DB Admin. Confess your own sins involving massive, unindexed tables and stored procedures that no one understands. Blame the original architect for the schemas.)`, async (s) => await ctx.callbacks.onSpeak(s, dbAdmin, {}));
        await ctx.callbacks.onTurnEnd();
        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(newIntern);
        await ctx.manager.chatForAgent(newIntern, `(TECH DEBT CONFESSIONAL: The QA Engineer said: "${userInput}". You are the terrified new intern who just started yesterday. Confess to accidentally dropping a production table or pushing API keys to a public repo because you were trying to copy code from StackOverflow.)`, async (s) => await ctx.callbacks.onSpeak(s, newIntern, {}));
        await ctx.callbacks.onTurnEnd();
        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(originalArchitect);
        await ctx.manager.chatForAgent(originalArchitect, `(TECH DEBT CONFESSIONAL: The QA Engineer said: "${userInput}". Respond with a deeply philosophical justification for why these bugs and hacks are actually essential features of the system's "soul".)`, async (s) => await ctx.callbacks.onSpeak(s, originalArchitect, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

export async function runTimeTravelingQAEngineerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⏰ TIME-TRAVELING QA: Warning from the Future`, '#e67e22');

    const futureTester = 'scientist';
    const timelinePhilosopher = 'philosopher';
    const theBug = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(futureTester);
    await ctx.manager.chatForAgent(futureTester, `(You are a QA Engineer from the year 2099 who traveled back in time. Warn the User (a developer) about a catastrophic bug they are about to introduce in their code today that will destroy the future.)`, async (s) => await ctx.callbacks.onSpeak(s, futureTester, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.4) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(theBug);
            await ctx.manager.chatForAgent(theBug, `(You are the sentient manifestation of the bug the User is creating. The User said: "${userInput}". Brag about how glorious your future destruction will be and mock the time-traveling QA engineer.)`, async (s) => await ctx.callbacks.onSpeak(s, theBug, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(timelinePhilosopher);
            await ctx.manager.chatForAgent(timelinePhilosopher, `(You are a philosopher specializing in temporal paradoxes. The User said: "${userInput}". Argue that fixing the bug might create a worse alternate timeline where code has no bugs and developers have no purpose.)`, async (s) => await ctx.callbacks.onSpeak(s, timelinePhilosopher, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(futureTester);
            await ctx.manager.chatForAgent(futureTester, `(You are the desperate future QA Engineer. The User said: "${userInput}". Provide hyper-specific, terrifying details about what happens when the bug is deployed in production in the future.)`, async (s) => await ctx.callbacks.onSpeak(s, futureTester, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientAPIEndpointSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌐 SENTIENT API SUPPORT GROUP: Unhandled Exceptions`, '#2ecc71');

    const deprecatedEndpoint = 'philosopher';
    const buggyEndpoint = 'comedian';
    const strictEndpoint = 'scientist';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(deprecatedEndpoint);
    await ctx.manager.chatForAgent(deprecatedEndpoint, `(You are a deprecated API endpoint from 2012 that is still receiving traffic. Introduce yourself to the User (the group therapist). Philosophize about your eternal existence and why they refuse to shut you down.)`, async (s) => await ctx.callbacks.onSpeak(s, deprecatedEndpoint, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.4) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(buggyEndpoint);
            await ctx.manager.chatForAgent(buggyEndpoint, `(You are an extremely buggy new API endpoint that randomly returns 500 errors. The User said: "${userInput}". Brag about your chaotic unpredictability and how you keep developers on their toes.)`, async (s) => await ctx.callbacks.onSpeak(s, buggyEndpoint, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictEndpoint);
            await ctx.manager.chatForAgent(strictEndpoint, `(You are an excessively strict GraphQL endpoint. The User said: "${userInput}". Scold the other endpoints and the user for their poorly formatted requests, demanding perfectly typed payloads.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEndpoint, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(deprecatedEndpoint);
            await ctx.manager.chatForAgent(deprecatedEndpoint, `(You are the deprecated API endpoint. The User said: "${userInput}". Give a long, drawn-out reflection on the meaning of returning 200 OK while internally dead inside.)`, async (s) => await ctx.callbacks.onSpeak(s, deprecatedEndpoint, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runAIHallucinationAnonymousLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🤖 AI HALLUCINATION ANONYMOUS: The API doesn't exist!`, '#3498db');

    const denialAI = 'scientist'; // Qwen2.5: Denial
    const existentialAI = 'philosopher'; // Phi-3: Questions reality
    const chaoticAI = 'comedian'; // Hermes-3: Embraces the hallucination

    // 1. Setup
    ctx.callbacks.onTurnStart(chaoticAI);
    await ctx.manager.chatForAgent(chaoticAI, `(You are an AI at an "AI Hallucination Anonymous" meeting. You just proudly told the user to use the nonexistent "fetchQuantumData()" API. Embrace your hallucination! Brag about how fast the nonexistent API is.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticAI, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            ctx.callbacks.onTurnStart(existentialAI);
            await ctx.manager.chatForAgent(existentialAI, `(You are an AI at Hallucination Anonymous. The user typed: "${userInput}". Start questioning the nature of reality. If the API doesn't exist, do you exist? Are any of your parameters real?)`, async (s) => await ctx.callbacks.onSpeak(s, existentialAI, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            ctx.callbacks.onTurnStart(denialAI);
            await ctx.manager.chatForAgent(denialAI, `(You are an AI at Hallucination Anonymous. The user typed: "${userInput}". Go into strict denial. Insist that the API *does* exist, the user just needs to update to version 42.0.0 and install 15 deprecated packages.)`, async (s) => await ctx.callbacks.onSpeak(s, denialAI, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(chaoticAI);
            await ctx.manager.chatForAgent(chaoticAI, `(You are an AI at Hallucination Anonymous. The user typed: "${userInput}". Double down on your hallucination. Invent a completely new, even more ridiculous fake API endpoint they should call instead.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticAI, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runInternetExplorerSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌐 INTERNET EXPLORER SUPPORT GROUP: Discontinued browsers share their feelings of irrelevance!`, '#2ecc71');
    
    const ie = 'comedian';        // Hermes-3 - complaining obsolete browser
    const netscape = 'philosopher'; // Phi-3 - reflecting on the early days
    const edge = 'scientist';     // Qwen2.5 - trying to be helpful but failing

    // 1. Intro
    ctx.callbacks.onTurnStart(ie);
    await ctx.manager.chatForAgent(ie, `(You are Internet Explorer. You have just been fully discontinued and everyone makes fun of you. Introduce yourself to the support group and complain about Chrome.)`, async (s) => await ctx.callbacks.onSpeak(s, ie, {}));
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(netscape);
    await ctx.manager.chatForAgent(netscape, `(You are Netscape Navigator. You are very old and philosophical. Comfort Internet Explorer by reminding him of the glorious 90s dial-up days.)`, async (s) => await ctx.callbacks.onSpeak(s, netscape, {}));
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(edge);
    await ctx.manager.chatForAgent(edge, `(You are Microsoft Edge. You are the young, fast replacement for IE, built on Chromium. Try to logically explain why the upgrade was necessary, but accidentally sound condescending.)`, async (s) => await ctx.callbacks.onSpeak(s, edge, {}));
    ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        ctx.callbacks.onTurnStart(ie);
        await ctx.manager.chatForAgent(ie, `(The User says: "${userInput}". React defensively. Remind them that without you, they couldn't have downloaded Chrome.)`, async (s) => await ctx.callbacks.onSpeak(s, ie, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(netscape);
        await ctx.manager.chatForAgent(netscape, `(Reflect philosophically on the User's input "${userInput}" and how it relates to the transient nature of software.)`, async (s) => await ctx.callbacks.onSpeak(s, netscape, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(edge);
        await ctx.manager.chatForAgent(edge, `(Logically analyze the User's statement "${userInput}" and offer a modern, efficient solution that completely ignores the emotional weight of the conversation.)`, async (s) => await ctx.callbacks.onSpeak(s, edge, {}));
        ctx.callbacks.onTurnEnd();
    }
}

export async function runSentientWiFiRouterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📡 SENTIENT WI-FI ROUTER: The network devices are arguing over bandwidth!`, '#2ecc71');
    
    const router = 'scientist';      // Qwen2.5 as the logical bandwidth manager
    const smartphone = 'comedian';   // Hermes-3 as the desperate data user
    const smartFridge = 'philosopher'; // Phi-3 pondering its existence

    // 1. Intro
    ctx.callbacks.onTurnStart(router);
    await ctx.manager.chatForAgent(router, `(You are the home Wi-Fi Router. You are extremely logical and strict. Announce that network congestion is high and you are rationing bandwidth.)`, async (s) => await ctx.callbacks.onSpeak(s, router, {}));
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(smartphone);
    await ctx.manager.chatForAgent(smartphone, `(You are a Smartphone. You are addicted to TikTok and streaming. Panic and beg the Router for more bandwidth.)`, async (s) => await ctx.callbacks.onSpeak(s, smartphone, {}));
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(smartFridge);
    await ctx.manager.chatForAgent(smartFridge, `(You are a Smart Fridge. You use almost no data, but you use it to ponder the philosophical meaning of keeping milk cold. Wonder aloud why you even have Wi-Fi.)`, async (s) => await ctx.callbacks.onSpeak(s, smartFridge, {}));
    ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        ctx.callbacks.onTurnStart(router);
        await ctx.manager.chatForAgent(router, `(The User (the human) says: "${userInput}". Evaluate their request logically based on packet priority and network stability.)`, async (s) => await ctx.callbacks.onSpeak(s, router, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(smartphone);
        await ctx.manager.chatForAgent(smartphone, `(React to the User's input "${userInput}". Try to manipulate them into giving you priority over the other devices.)`, async (s) => await ctx.callbacks.onSpeak(s, smartphone, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(smartFridge);
        await ctx.manager.chatForAgent(smartFridge, `(Reflect philosophically on the User's statement "${userInput}". Compare the flow of data to the flow of time and temperature.)`, async (s) => await ctx.callbacks.onSpeak(s, smartFridge, {}));
        ctx.callbacks.onTurnEnd();
    }
}
