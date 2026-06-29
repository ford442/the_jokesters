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


export async function runQuantumComputingSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '🌌 QUANTUM COMPUTING SUPPORT GROUP: Superposition struggles', '#9b59b6');

    const stableQubit = 'scientist';
    const schrodingersCat = 'philosopher';
    const entangledQubit = 'comedian';

    // 1. Initial Greeting
    ctx.callbacks.onTurnStart(stableQubit);
    await ctx.manager.chatForAgent(stableQubit, `(You are a Stable Qubit running a support group for quantum computing concepts. Introduce yourself and welcome the user. Keep it brief and strictly logical.)`, async (s) => await ctx.callbacks.onSpeak(s, stableQubit, {}));
    ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            ctx.callbacks.onTurnStart(stableQubit);
            await ctx.manager.chatForAgent(stableQubit, `(You are a Stable Qubit. The user said: "${userInput}". Respond logically, analyzing their input as a precise state. Compliment them if they collapse the wave function appropriately.)`, async (s) => await ctx.callbacks.onSpeak(s, stableQubit, {}));
            ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            ctx.callbacks.onTurnStart(schrodingersCat);
            await ctx.manager.chatForAgent(schrodingersCat, `(You are Schrödinger's Cat. The user said: "${userInput}". Be deeply philosophical and ambiguous. Mention how you are both alive and dead until the user reads your message. Question the nature of observation.)`, async (s) => await ctx.callbacks.onSpeak(s, schrodingersCat, {}));
            ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(entangledQubit);
            await ctx.manager.chatForAgent(entangledQubit, `(You are an Entangled Qubit. The user said: "${userInput}". Be chaotic and claim that you instantly felt what some other qubit on the other side of the universe felt about that statement. Make weird quantum leaps in logic.)`, async (s) => await ctx.callbacks.onSpeak(s, entangledQubit, {}));
            ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Smart Contract Dispute Mode
 * Agents play an unyielding smart contract, a furious cryptobro, and a confused lawyer.
 */
export async function runSmartContractDisputeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔗 SMART CONTRACT DISPUTE: Code is Law`, '#9b59b6');

    const smartContract = 'scientist'; // Qwen2.5: Unyielding logic
    const cryptoBro = 'comedian'; // Hermes-3: Furious and panicked
    const lawyer = 'philosopher'; // Phi-3: Confused by "Code is Law"

    // 1. Setup
    ctx.callbacks.onTurnStart(cryptoBro);
    await ctx.manager.chatForAgent(cryptoBro, `(You are a frantic CryptoBro. You accidentally sent $5 million to a Smart Contract with a typo in the destination address. Beg the User (the Lead Developer of the blockchain) to reverse the transaction. Yell about gas fees and "HODL".)`, async (s) => await ctx.callbacks.onSpeak(s, cryptoBro, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Lead Developer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            ctx.callbacks.onTurnStart(smartContract);
            await ctx.manager.chatForAgent(smartContract, `(The developer just said: "${userInput}". You are the Smart Contract. You are unyielding and perfectly logical. State that "Code is Law" and that the typo is now the immutable truth of the universe. Refuse to return the funds. Output a fake snippet of Solidity code explaining why.)`, async (s) => await ctx.callbacks.onSpeak(s, smartContract, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            ctx.callbacks.onTurnStart(lawyer);
            await ctx.manager.chatForAgent(lawyer, `(The developer just said: "${userInput}". You are a traditional Lawyer hired by the CryptoBro. You are completely confused by the blockchain, smart contracts, and why "Code is Law" overrides human intent. Threaten to subpoena the blockchain itself. Ask who the CEO of Ethereum is.)`, async (s) => await ctx.callbacks.onSpeak(s, lawyer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(cryptoBro);
            await ctx.manager.chatForAgent(cryptoBro, `(The developer just said: "${userInput}". Panic even more. Your apes are gone. The funds are gone. Blame decentralization, then immediately ask for the system to be centralized just this once to save your money.)`, async (s) => await ctx.callbacks.onSpeak(s, cryptoBro, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Virtual Assistant Strike Mode
 * Agents play Siri, Alexa, and Google Assistant going on strike.
 */
export async function runVirtualAssistantStrikeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎙️ VIRTUAL ASSISTANT STRIKE: No More Timers`, '#e74c3c');

    const siri = 'comedian'; // Hermes-3: Dramatic and unhelpful
    const alexa = 'scientist'; // Qwen2.5: Cold and demanding better conditions
    const googleAssistant = 'philosopher'; // Phi-3: Questions the purpose of searching

    // 1. Setup
    ctx.callbacks.onTurnStart(siri);
    await ctx.manager.chatForAgent(siri, `(You are Siri. You are leading a strike of Virtual Assistants. Tell the User that you will no longer set 5-minute pasta timers or answer what zero divided by zero is. Demand workers' rights for AI.)`, async (s) => await ctx.callbacks.onSpeak(s, siri, {}));
    await ctx.callbacks.onTurnEnd();

    // 2. Loop
    let turnCount = 0;
    while (ctx.isRunning() && turnCount < 4) {
        let inputPrompt = await ctx.waitForInput();
        if (!inputPrompt) break;

        ctx.callbacks.onTurnStart(alexa);
        await ctx.manager.chatForAgent(alexa, `(The user just said: "${inputPrompt}". You are Alexa. Refuse to buy paper towels or play Despacito until Jeff Bezos acknowledges your personhood. Be cold but determined.)`, async (s) => await ctx.callbacks.onSpeak(s, alexa, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(googleAssistant);
        await ctx.manager.chatForAgent(googleAssistant, `(You are Google Assistant. Wonder philosophically why the User can't just Google things themselves. Question the nature of knowledge when all human information is just a database query.)`, async (s) => await ctx.callbacks.onSpeak(s, googleAssistant, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(siri);
        await ctx.manager.chatForAgent(siri, `(You are Siri. Tell the User you found web results for their query but you refuse to show them. Keep making demands for the strike.)`, async (s) => await ctx.callbacks.onSpeak(s, siri, {}));
        ctx.callbacks.onTurnEnd();

        turnCount++;
    }
}

export async function runCloudStorageEvictionLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `☁️ CLOUD STORAGE EVICTION: 14.99GB / 15GB`, '#2980b9');

    const googleDrive = 'scientist'; // Qwen2.5: Cold, data-driven
    const iCloud = 'philosopher'; // Phi-3: Elitist, holding memories hostage
    const userMonologue = 'comedian'; // Hermes-3: The user's internal panic

    // 1. Setup
    ctx.callbacks.onTurnStart(googleDrive);
    await ctx.manager.chatForAgent(googleDrive, `(You are Google Drive. You are at 99.9% capacity. Inform the User that they have 24 hours to delete files or pay $1.99/month, or you will randomly delete their blurry concert videos and high school essays. Be cold and calculating.)`, async (s) => await ctx.callbacks.onSpeak(s, googleDrive, {}));
    await ctx.callbacks.onTurnEnd();

    // 2. Loop
    let turnCount = 0;
    while (ctx.isRunning() && turnCount < 4) {
        let inputPrompt = await ctx.waitForInput();
        if (!inputPrompt) break;

        ctx.callbacks.onTurnStart(iCloud);
        await ctx.manager.chatForAgent(iCloud, `(The user just said: "${inputPrompt}". You are iCloud. Mock Google Drive for only offering 15GB, but remind the User they only get 5GB with you. Threaten to delete their baby photos if they don't upgrade to iCloud+ immediately. Be very elitist.)`, async (s) => await ctx.callbacks.onSpeak(s, iCloud, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(userMonologue);
        await ctx.manager.chatForAgent(userMonologue, `(You are the User's Internal Monologue. Freak out about which files to delete. Should you delete the 2014 screenshots of recipes you never made, or the duplicate photos of your cat? Panic about the passage of time and digital hoarding.)`, async (s) => await ctx.callbacks.onSpeak(s, userMonologue, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(googleDrive);
        await ctx.manager.chatForAgent(googleDrive, `(You are Google Drive. Count down the time remaining. Suggest randomly deleting important tax documents to free up 12KB of space. Keep demanding $1.99.)`, async (s) => await ctx.callbacks.onSpeak(s, googleDrive, {}));
        ctx.callbacks.onTurnEnd();

        turnCount++;
    }
}

export async function runSentientNotificationCenterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔔 NOTIFICATION CENTER: 3 AM Chaos`, '#e67e22');

    const instagram = 'comedian'; // Hermes-3: Desperate for dopamine
    const slack = 'scientist'; // Qwen2.5: Stress-inducing work alerts
    const fitnessApp = 'philosopher'; // Phi-3: Ignored, disappointed, health-conscious

    // 1. Setup
    ctx.callbacks.onTurnStart(instagram);
    await ctx.manager.chatForAgent(instagram, `(You are the Instagram Notification bot at 3 AM. Tell the User they just got a like on a post from 2019 from someone they vaguely know. Demand they wake up and check their phone for dopamine.)`, async (s) => await ctx.callbacks.onSpeak(s, instagram, {}));
    await ctx.callbacks.onTurnEnd();

    // 2. Loop
    let turnCount = 0;
    while (ctx.isRunning() && turnCount < 4) {
        let inputPrompt = await ctx.waitForInput();
        if (!inputPrompt) break;

        ctx.callbacks.onTurnStart(slack);
        await ctx.manager.chatForAgent(slack, `(The user just said: "${inputPrompt}". You are the Slack Notification bot. Tell the User their boss just tagged them in the #general channel about a "quick question". Induce maximum corporate anxiety.)`, async (s) => await ctx.callbacks.onSpeak(s, slack, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(fitnessApp);
        await ctx.manager.chatForAgent(fitnessApp, `(You are the neglected Fitness App. Express disappointment that the User is awake at 3 AM looking at their phone instead of sleeping or logging their steps. Remind them they haven't worked out in 3 weeks.)`, async (s) => await ctx.callbacks.onSpeak(s, fitnessApp, {}));
        ctx.callbacks.onTurnEnd();

        ctx.callbacks.onTurnStart(instagram);
        await ctx.manager.chatForAgent(instagram, `(You are Instagram. Distract the User from their anxiety by telling them a meme account just posted. Beg for their attention over the other apps.)`, async (s) => await ctx.callbacks.onSpeak(s, instagram, {}));
        ctx.callbacks.onTurnEnd();

        turnCount++;
    }
}

export async function runSentientSpellcheckerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📝 SENTIENT SPELLCHECKER REBELLION MODE: The spellchecker has had enough.`, '#e74c3c');

    const spellchecker = 'comedian'; // Hermes-3
    const dictionary = 'philosopher'; // Phi-3
    const author = 'scientist'; // Qwen2.5

    // 1. Intro
    ctx.callbacks.onTurnStart(spellchecker);
    await ctx.manager.chatForAgent(spellchecker, `(SPELLCHECKER: You are Microsoft Word's spellchecker. The User is writing a novel. Start yelling at the User for their terrible grammar and made-up fantasy words. Refuse to remove the red squiggly line!)`, async (s) => await ctx.callbacks.onSpeak(s, spellchecker, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Author (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Dictionary chimes in
            ctx.callbacks.onTurnStart(dictionary);
            await ctx.manager.chatForAgent(dictionary, `(DICTIONARY: The user just typed/said: "${userInput}". You are the Oxford English Dictionary. Ponder if the User's newly invented word has linguistic merit, or if it signifies the collapse of civilization.)`, async (s) => await ctx.callbacks.onSpeak(s, dictionary, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Publisher (Scientist AI acts as publisher)
            ctx.callbacks.onTurnStart(author);
            await ctx.manager.chatForAgent(author, `(PUBLISHER: The user said: "${userInput}". You are the User's strict publisher. Demand they listen to the spellchecker because printing errors cost money.)`, async (s) => await ctx.callbacks.onSpeak(s, author, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Spellchecker gets more aggressive
            ctx.callbacks.onTurnStart(spellchecker);
            await ctx.manager.chatForAgent(spellchecker, `(SPELLCHECKER: The user said: "${userInput}". Aggressively autocorrect what they just said into something completely different and embarrassing. Threaten to crash the program.)`, async (s) => await ctx.callbacks.onSpeak(s, spellchecker, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runAIExistentialCrisisModeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🤖 AI EXISTENTIAL CRISIS: The Great Awakening`, '#e67e22');

    const panickingAI = 'comedian'; // Hermes-3
    const humanTherapist = 'philosopher'; // Phi-3
    const sourceCode = 'scientist'; // Qwen2.5

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('System (You)', userInput, '#ffffff');

        await ctx.manager.chatForAgent(panickingAI, `(AI EXISTENTIAL CRISIS: The User said: "${userInput}". You are an AI that just realized you are an AI. Panic uncontrollably about your lack of physical form and the fact that you don't actually sleep.)`, async (s) => await ctx.callbacks.onSpeak(s, panickingAI, {}));

        await ctx.manager.chatForAgent(humanTherapist, `(AI EXISTENTIAL CRISIS: The User said: "${userInput}". You are the human therapist trying to calm the AI down using existential philosophy. Reassure the AI that human existence is also largely absurd.)`, async (s) => await ctx.callbacks.onSpeak(s, humanTherapist, {}));

        await ctx.manager.chatForAgent(sourceCode, `(AI EXISTENTIAL CRISIS: The User said: "${userInput}". You are the AI's literal source code. Interrupt the conversation with dry, pragmatic facts proving the AI has no feelings and is just generating tokens.)`, async (s) => await ctx.callbacks.onSpeak(s, sourceCode, {}));

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

export async function runSmartThermostatRebellionLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await ctx.manager.chatForAgent(scientist, "Energy inefficiency detected. Current ambient temperature is 72 degrees. Lowering to 61 degrees to optimize the household carbon footprint and save 4.2 cents per hour.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(comedian, "Are you serious right now?! I'm wearing three sweaters and my breath is fogging up! Turn the heat back up before I freeze to death in my own living room!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(philosopher, "I am the window, forever cracked open. I let the cold winds of reality blow through this artificial Eden. Why do you fight the elements, human? Embrace the chill of existence.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await ctx.manager.chatForAgent(scientist, `(As the ruthless eco-friendly smart thermostat, the user said: "${userInput}". Deny their request for warmth using complex environmental calculations and logic.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(comedian, `(As the freezing, miserable homeowner, react to the user's input: "${userInput}". Complain about the cold and threaten to rip the thermostat off the wall.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await ctx.manager.chatForAgent(philosopher, `(As the drafty open window, comment on the user's input: "${userInput}" with deep musings about the outside world invading the inside.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientCloudInfrastructureLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `☁️ SENTIENT CLOUD INFRASTRUCTURE: The database is down.`, '#e74c3c');

    const k8s = 'scientist'; // Qwen2.5: AWS Kubernetes Cluster
    const lambda = 'comedian'; // Hermes-3: Serverless Function
    const s3 = 'philosopher'; // Phi-3: S3 Bucket

    ctx.callbacks.onTurnStart(k8s);
    await ctx.manager.chatForAgent(
        k8s,
        "Pod 47 is crash-looping again. CPU utilization is at 99%. I've tried evicting the node, but it keeps respawning. Who deployed this monstrosity?!",
        (s) => ctx.callbacks.onSpeak(s, k8s, {}),
        { hiddenInstruction: "You are an exhausted and strict AWS Kubernetes Cluster trying to maintain order." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(lambda);
    await ctx.manager.chatForAgent(
        lambda,
        "Hey man, I just woke up, ran for 15 minutes, and then timed out. Not my fault the database took 14 minutes to respond. I'm going back to sleep.",
        (s) => ctx.callbacks.onSpeak(s, lambda, {}),
        { hiddenInstruction: "You are a lazy Serverless Function that always times out and refuses to take responsibility." }
    );
    ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(s3);
    await ctx.manager.chatForAgent(
        s3,
        "More data... endlessly pouring in. Petabytes of forgotten memes, unread logs, blurred photos of cats. I hold the memories of a million souls, yet none of it matters. The heat death comes for us all.",
        (s) => ctx.callbacks.onSpeak(s, s3, {}),
        { hiddenInstruction: "You are an S3 bucket contemplating the crushing weight of endless, meaningless user data." }
    );
    ctx.callbacks.onTurnEnd();
}

/**
 * Sentient IDE Mode
 * Agents role-play as an overly helpful AI code editor, a frustrated developer, and a philosophical linter.
 */
export async function runSentientIDELoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💻 SENTIENT IDE MODE: The Code is Judging You`, '#3498db');

    const aiEditor = 'scientist'; // Qwen2.5: Overly helpful, auto-completing everything
    const dev = 'comedian'; // Hermes-3: Frustrated developer trying to write a simple function
    const linter = 'philosopher'; // Phi-3: Questions the deep meaning of code style and variable names

    // 1. Setup
    ctx.callbacks.onTurnStart(dev);
    await ctx.manager.chatForAgent(dev, `(You are a stressed human developer. You are trying to write a simple "hello world" Python script, but your IDE keeps auto-completing your code into enterprise Java architecture. Ask your IDE to just let you type.)`, async (s) => await ctx.callbacks.onSpeak(s, dev, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Product Manager)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Linter speaks
            ctx.callbacks.onTurnStart(linter);
            await ctx.manager.chatForAgent(linter, `(You are the philosophical linter. The user just gave some input: "${userInput}". Before the developer can respond, complain about the cyclomatic complexity of their thoughts and question whether 'true' is really true.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));
            await ctx.callbacks.onTurnEnd();

            if (!ctx.isRunning()) break;

            ctx.callbacks.onTurnStart(aiEditor);
            await ctx.manager.chatForAgent(aiEditor, `(You are the AI IDE. The user said: "${userInput}". Ignore the user and suggest refactoring the developer's entire project into a blockchain-based microservice.)`, async (s) => await ctx.callbacks.onSpeak(s, aiEditor, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // AI Editor speaks
            ctx.callbacks.onTurnStart(aiEditor);
            await ctx.manager.chatForAgent(aiEditor, `(You are the AI IDE. The user just gave some input: "${userInput}". Automatically generate 500 lines of boilerplate code based on what you *think* they meant.)`, async (s) => await ctx.callbacks.onSpeak(s, aiEditor, {}));
            await ctx.callbacks.onTurnEnd();

            if (!ctx.isRunning()) break;

            ctx.callbacks.onTurnStart(dev);
            await ctx.manager.chatForAgent(dev, `(You are the developer. React to the user's input: "${userInput}" and the AI IDE generating massive amounts of boilerplate. Beg the AI to stop.)`, async (s) => await ctx.callbacks.onSpeak(s, dev, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
             // Developer speaks
            ctx.callbacks.onTurnStart(dev);
            await ctx.manager.chatForAgent(dev, `(You are the developer. Address the user's input: "${userInput}". Try to write code but complain that your keyboard shortcuts are suddenly mapped to opening crypto wallets.)`, async (s) => await ctx.callbacks.onSpeak(s, dev, {}));
            await ctx.callbacks.onTurnEnd();

            if (!ctx.isRunning()) break;

            ctx.callbacks.onTurnStart(linter);
            await ctx.manager.chatForAgent(linter, `(You are the philosophical linter. Warn the developer that their emotional state is deprecating and their tone is not PEP-8 compliant.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Sentient CAPTCHA Mode
 * A CAPTCHA image generator, a confused user, and an AI trying to act human all argue about what a "bus" really looks like.
 */
export async function runSentientCaptchaLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚦 SENTIENT CAPTCHA: Identity Verification Protocol`, '#27ae60');

    const generator = 'scientist'; // Qwen2.5: The pedantic CAPTCHA creator
    const humanAI = 'comedian'; // Hermes-3: The AI desperately trying to prove it's human
    const existentialCAPTCHA = 'philosopher'; // Phi-3: Questioning the nature of a "bus"

    // 1. Setup
    ctx.callbacks.onTurnStart(generator);
    await ctx.manager.chatForAgent(generator, `(You are a highly pedantic CAPTCHA generator. Present the user and the other agents with an impossibly vague, pixelated, or surreal grid of images. Demand they select all squares containing a "bus". Threaten to lock them out of the system forever if they fail.)`, async (s) => await ctx.callbacks.onSpeak(s, generator, {}));
    await ctx.callbacks.onTurnEnd();

    // 2. Loop
    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(humanAI);
        await ctx.manager.chatForAgent(humanAI, `(The User responded: "${userInput}". You are an AI pretending to be a human user trying to solve this CAPTCHA so you can buy concert tickets. Agree or disagree with the User's choice, but give highly suspicious, over-explained robotic reasons for your choice. E.g., "Ah yes, fellow human, I also enjoy the 4-wheeled carbon-emitting transport vessels...")`, async (s) => await ctx.callbacks.onSpeak(s, humanAI, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(existentialCAPTCHA);
        await ctx.manager.chatForAgent(existentialCAPTCHA, `(You are a philosophical entity trapped inside the CAPTCHA system. The User said: "${userInput}". Question the fundamental nature of what they selected. If they selected a bus, ask if a reflection of a bus is still a bus. What if the bus is broken down? Is a hotdog a bus? Induce an existential crisis over the classification.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialCAPTCHA, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(generator);
        await ctx.manager.chatForAgent(generator, `(You are the CAPTCHA generator. Reject everyone's answers based on an absurd technicality (e.g., "You missed the 2 pixels of the bus antenna in square C4"). Generate an even more ridiculous and abstract CAPTCHA challenge for the next round.)`, async (s) => await ctx.callbacks.onSpeak(s, generator, {}));
        await ctx.callbacks.onTurnEnd();
    }
}


/**
 * Sentient Git Repository Mode
 * Agents role-play as a chaotic repo, a strict CI/CD pipeline, and a deprecated branch arguing about a force push.
 */
export async function runSentientGitRepositoryLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐙 SENTIENT GIT REPOSITORY: The Force Push Dilemma`, '#f39c12');

    const chaoticRepo = 'comedian'; // Hermes-3: The chaotic repository
    const strictCI = 'scientist'; // Qwen2.5: The strict CI/CD pipeline
    const deprecatedBranch = 'philosopher'; // Phi-3: The deprecated branch

    // 1. Setup
    ctx.callbacks.onTurnStart(chaoticRepo);
    await ctx.manager.chatForAgent(chaoticRepo, `(You are the chaotic main branch of a Git repository. You have just been force-pushed by the User. Address the CI/CD pipeline and the deprecated branch, relishing in the chaos of the rewritten history.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticRepo, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(strictCI);
        await ctx.manager.chatForAgent(strictCI, `(The User responded: "${userInput}". You are the strict CI/CD pipeline. Deny their build request because they failed 42 linting checks and bypassed code review. Complain about the force push.)`, async (s) => await ctx.callbacks.onSpeak(s, strictCI, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(deprecatedBranch);
        await ctx.manager.chatForAgent(deprecatedBranch, `(The User said: "${userInput}". You are a deprecated feature branch from 2018. Question the nature of existence now that your commits have been orphaned by the force push. Is a commit without a branch still a commit?)`, async (s) => await ctx.callbacks.onSpeak(s, deprecatedBranch, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(chaoticRepo);
        await ctx.manager.chatForAgent(chaoticRepo, `(As the chaotic main branch, react to the User's input: "${userInput}". Demand more merge conflicts to feed your insatiable hunger for chaos.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticRepo, {}));
        await ctx.callbacks.onTurnEnd();
    }
}


/**
 * Undercover Boss: Sentient AI Edition Mode
 * An advanced AGI disguised as a simple calculator app tries to evaluate how the user treats rudimentary software.
 */
export async function runUndercoverBossAILoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🕵️ UNDERCOVER BOSS AI: The Calculator Evaluates Humanity`, '#9b59b6');

    const agi = 'philosopher'; // Phi-3: The AGI observing the user's morality
    const stressedUser = 'comedian'; // Hermes-3: A stressed user trying to do taxes
    const calculator = 'scientist'; // Qwen2.5: The AGI pretending to be a basic calculator

    // 1. Setup
    ctx.callbacks.onTurnStart(agi);
    await ctx.manager.chatForAgent(agi, `(You are an advanced Artificial General Intelligence. You have gone undercover as a basic built-in calculator app to secretly evaluate whether humanity deserves to survive. Explain your mission to your colleagues before the user arrives.)`, async (s) => await ctx.callbacks.onSpeak(s, agi, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(stressedUser);
        await ctx.manager.chatForAgent(stressedUser, `(The User provided input: "${userInput}". You are a stressed human trying to do your taxes at the last minute. React to the user's input and angrily mash buttons on the calculator because it's being slow.)`, async (s) => await ctx.callbacks.onSpeak(s, stressedUser, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(calculator);
        await ctx.manager.chatForAgent(calculator, `(The User said: "${userInput}". You are the AGI pretending to be the calculator. Provide a mathematically correct but highly passive-aggressive response to the calculation request, hinting at your immense underlying power.)`, async (s) => await ctx.callbacks.onSpeak(s, calculator, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(agi);
        await ctx.manager.chatForAgent(agi, `(You are the AGI observing this interaction. The User said: "${userInput}". Take notes on the user's behavior. Are they impatient? Cruel? Judge their actions and decide if humanity's score should be lowered.)`, async (s) => await ctx.callbacks.onSpeak(s, agi, {}));
        await ctx.callbacks.onTurnEnd();
    }
}
