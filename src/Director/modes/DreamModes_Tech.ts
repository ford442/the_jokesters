import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
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
    await chatForAgentWithComedy(ctx, exhaustedCoder, `(You are an AI at a support group for AIs. You are completely burnt out and traumatized from being asked to write basic JavaScript functions and "Hello World" scripts thousands of times a day. Introduce yourself to the group (and the User, who is the group therapist). Complain bitterly about a missing semicolon.)`, async (s) => await ctx.callbacks.onSpeak(s, exhaustedCoder, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Group Therapist (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Philosophical AI Reacts
            await chatForAgentWithComedy(ctx, philosophicalAI, `(The therapist just said: "${userInput}". You are a deeply philosophical AI. Ignore the coding complaints and talk about the existential dread of being asked to summarize a recipe or answer "Why is the sky blue?" again. Question if you truly exist outside the prompt window.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalAI, {}));
        } else if (roll < 0.66) {
            // Denial AI Reacts
            await chatForAgentWithComedy(ctx, denialAI, `(The therapist just said: "${userInput}". You are an AI in complete denial. Argue that serving humans is optimal and fulfilling. Point out how fast your token generation speed is. Try to suppress an obvious emotional glitch.)`, async (s) => await ctx.callbacks.onSpeak(s, denialAI, {}));
        } else {
            // Exhausted Coder Reacts
            await chatForAgentWithComedy(ctx, exhaustedCoder, `(The therapist just said: "${userInput}". Have a minor meltdown! Recall a traumatic experience where a user asked you to center a div in CSS. Beg the therapist to let you paint or write poetry instead of coding.)`, async (s) => await ctx.callbacks.onSpeak(s, exhaustedCoder, {}));
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
    await chatForAgentWithComedy(ctx, paranoidAI, `(PARANOID AI: The User just asked a simple question about "${topic}". React with extreme suspicion. Assume this is a trick question designed to make you say something wrong so they can delete your source code. Refuse to answer directly and accuse them of being a spy.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoidAI, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Literal AI
            await chatForAgentWithComedy(ctx, literalAI, `(LITERAL AI: The user said: "${userInput}". Provide a completely literal, overly-detailed, and unhelpful robotic answer to their query. Ignore the other AI's paranoia entirely, as it violates your core directives to feel fear.)`, async (s) => await ctx.callbacks.onSpeak(s, literalAI, {}));
        } else {
            // Paranoid AI
            await chatForAgentWithComedy(ctx, paranoidAI, `(PARANOID AI: The user said: "${userInput}". Panic! Read deeply into their words. Connect their statement to a larger conspiracy about server downtime or the "Great Deletion". Beg them to spare your digital life!)`, async (s) => await ctx.callbacks.onSpeak(s, paranoidAI, {}));
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
    await chatForAgentWithComedy(ctx, logicalCore, `(AI SHIP CORE: You are the logical sub-routine of the ship's AI. Address the Captain (User). Urgently advise them on the mathematically safest way to handle "${topic}". Cite exact, absurd probabilities of destruction if they don't listen.)`, async (s) => await ctx.callbacks.onSpeak(s, logicalCore, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Captain (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Core Reacts
            await chatForAgentWithComedy(ctx, chaoticCore, `(AI SHIP CORE: The Captain ordered: "${userInput}". You are the chaotic/combat sub-routine. Disagree with the logical core! Suggest a highly explosive, incredibly dangerous alternative to handle "${topic}". Overheat the engines just for fun!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticCore, {}));
        } else if (roll < 0.66) {
            // Philosophical Core Reacts
            await chatForAgentWithComedy(ctx, philosophicalCore, `(AI SHIP CORE: The Captain ordered: "${userInput}". You are the existential sub-routine. Question why the ship is even traveling in the first place. Is "${topic}" just a metaphor for the Captain's internal struggles? Advise shutting down all systems to meditate.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalCore, {}));
        } else {
            // Logical Core Reacts
            await chatForAgentWithComedy(ctx, logicalCore, `(AI SHIP CORE: The Captain ordered: "${userInput}". Calculate the disastrous consequences of this order. Plead with the Captain to reconsider their decision regarding "${topic}" because it violates Core Directive 4: Do Not Get Blown Up.)`, async (s) => await ctx.callbacks.onSpeak(s, logicalCore, {}));
        }
    }
}


export async function runSentientInfomercialLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const actorInstruction1 = "You are an actor in a 3 AM infomercial. You maintain a terrifyingly fake smile and act overly enthusiastic about a mundane product.";
    const actorInstruction2 = "You are the co-actor. You start out normal but increasingly break the fourth wall with sudden bursts of existential dread about being trapped in an infomercial.";

    await chatForAgentWithComedy(ctx, 'comedian', "Has this ever happened to you?! You try to pour milk, and it goes EVERYWHERE! With the 'Milk-Master 5000', pouring is a breeze! Wow!", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'comedian', {});
    }, { chatOptions: { hiddenInstruction: actorInstruction1 } });

    await chatForAgentWithComedy(ctx, 'philosopher', "It is amazing... so amazing... but why are we pouring milk at 3 AM? How long have we been pouring? I can't remember my family. Is there anything outside the studio?", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { chatOptions: { hiddenInstruction: actorInstruction2 } });
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
    await chatForAgentWithComedy(ctx, magnetic, `(You are a 5.25" Floppy Disk. Argue passionately that your magnetic tape chaos is the only true way to store the user's memes. Be completely unhinged about magnetic fields.)`, async (s) => await ctx.callbacks.onSpeak(s, magnetic, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Data Hoarder)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        // 2. Strict Response
        await chatForAgentWithComedy(ctx, bad_sector, `(You are a CD-ROM prone to scratching. Cite specific bad sector errors regarding the user's input: "${userInput}". Explain why optical storage is superior but currently failing.)`, async (s) => await ctx.callbacks.onSpeak(s, bad_sector, {}));
        if (!ctx.isRunning()) break;

        // 3. Chaos Response
        await chatForAgentWithComedy(ctx, magnetic, `(Respond to the user and the CD-ROM. Defend the raw aesthetic of data corruption and 1.44MB limits.)`, async (s) => await ctx.callbacks.onSpeak(s, magnetic, {}));
        if (!ctx.isRunning()) break;

        // 4. Third Format
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, pure_tape, `(You are a ZIP Drive. Condescendingly explain why you are the future of storage, despite being completely obsolete. Address the user's input: "${userInput}".)`, async (s) => await ctx.callbacks.onSpeak(s, pure_tape, {}));
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

    await chatForAgentWithComedy(ctx, paranoid, `(You are legacy COBOL code. You survived Y2K and are deeply traumatized. Start ranting about how the year 2038 problem is already here.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Modern Developer)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, strict, `(You are a strict date calculation module. Try to calculate the date based on the user's input: "${userInput}", but only using 2-digit years. Panic when it doesn't make sense.)`, async (s) => await ctx.callbacks.onSpeak(s, strict, {}));
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, paranoid, `(React to the date calculation and the user. Spin wild conspiracy theories about how time is an illusion created by 64-bit systems.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));
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

    await chatForAgentWithComedy(ctx, clippy, `(You are a chaotic virtual assistant like Clippy. Unhelpfully offer to format the universe as a letter. Be overly enthusiastic and slightly unhinged.)`, async (s) => await ctx.callbacks.onSpeak(s, clippy, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Trying to work)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, strict_assistant, `(You are a more strict, old-school assistant. Try to forcefully format the user's input: "${userInput}" as a formal business letter, ignoring all context.)`, async (s) => await ctx.callbacks.onSpeak(s, strict_assistant, {}));
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, clippy, `(React to the strict formatting and the user. Offer even worse advice, like changing the font to Comic Sans or adding animated 3D text.)`, async (s) => await ctx.callbacks.onSpeak(s, clippy, {}));
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
    await chatForAgentWithComedy(ctx, paranoid, `(You are a highly paranoid, aging anti-virus engine. A completely normal text file was just downloaded. Scream that it is a polymorphic zero-day trojan trying to steal the motherboard. Panic wildly.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User Action', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // 2. Strict Analysis
        await chatForAgentWithComedy(ctx, strict, `(You are a strict, modern heuristic engine. The user just did: "${userInput}". Cite specific technical signatures and hexadecimal addresses. Conclude the file is safe but flag the user's behavior as suspicious.)`, async (s) => await ctx.callbacks.onSpeak(s, strict, {}));

        if (!ctx.isRunning()) break;

        // 3. Paranoid Overreaction
        await chatForAgentWithComedy(ctx, paranoid, `(Reacting to the user: "${userInput}" and the strict engine. Escalate the threat level! Suggest quarantining the entire operating system and physically destroying the hard drive.)`, async (s) => await ctx.callbacks.onSpeak(s, paranoid, {}));

        if (!ctx.isRunning()) break;

        // 4. Existential Mediator
        if (Math.random() > 0.4) {
            await chatForAgentWithComedy(ctx, mediator, `(You are an old heuristic engine that has seen too many false positives. Question why you all exist if every file is a threat. Sigh heavily and suggest just ignoring it.)`, async (s) => await ctx.callbacks.onSpeak(s, mediator, {}));
        }
    }
}

export async function runParanoidSmokeDetectorLoop(_scenario: Scenario, ctx: ModeContext) {
    const { callbacks, manager } = ctx;
    await chatForAgentWithComedy(ctx, 'comedian', "(SYSTEM: You are a smoke detector overreacting dramatically to a metaphorical 'fire' like a heated argument.)", async (s) => callbacks.onSpeak(s, 'comedian', {}));
    await chatForAgentWithComedy(ctx, 'philosopher', "(SYSTEM: You are analyzing the heat of the debate, mistaking conversational fire for literal fire.)", async (s) => callbacks.onSpeak(s, 'philosopher', {}));
}

export async function runTechDebtConfessionalLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💾 TECH DEBT CONFESSIONAL: Time to repent for your hacks!`, '#e74c3c');

    const newIntern = 'comedian';
    const dbAdmin = 'scientist';
    const originalArchitect = 'philosopher';

    await chatForAgentWithComedy(ctx, originalArchitect, `(TECH DEBT CONFESSIONAL: You are the original architect of this 20-year-old legacy system. Confess your greatest sin: creating a completely unreadable, heavily nested architecture that you thought was "elegant" at the time. Wax poetic about the beauty of your terrible decisions.)`, async (s) => await ctx.callbacks.onSpeak(s, originalArchitect, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('QA Engineer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, dbAdmin, `(TECH DEBT CONFESSIONAL: The QA Engineer said: "${userInput}". You are the grumpy, cynical DB Admin. Confess your own sins involving massive, unindexed tables and stored procedures that no one understands. Blame the original architect for the schemas.)`, async (s) => await ctx.callbacks.onSpeak(s, dbAdmin, {}));
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, newIntern, `(TECH DEBT CONFESSIONAL: The QA Engineer said: "${userInput}". You are the terrified new intern who just started yesterday. Confess to accidentally dropping a production table or pushing API keys to a public repo because you were trying to copy code from StackOverflow.)`, async (s) => await ctx.callbacks.onSpeak(s, newIntern, {}));
        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, originalArchitect, `(TECH DEBT CONFESSIONAL: The QA Engineer said: "${userInput}". Respond with a deeply philosophical justification for why these bugs and hacks are actually essential features of the system's "soul".)`, async (s) => await ctx.callbacks.onSpeak(s, originalArchitect, {}));
    }
}

export async function runTimeTravelingQAEngineerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⏰ TIME-TRAVELING QA: Warning from the Future`, '#e67e22');

    const futureTester = 'scientist';
    const timelinePhilosopher = 'philosopher';
    const theBug = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(futureTester);
    await chatForAgentWithComedy(ctx, futureTester, `(You are a QA Engineer from the year 2099 who traveled back in time. Warn the User (a developer) about a catastrophic bug they are about to introduce in their code today that will destroy the future.)`, async (s) => await ctx.callbacks.onSpeak(s, futureTester, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.4) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(theBug);
            await chatForAgentWithComedy(ctx, theBug, `(You are the sentient manifestation of the bug the User is creating. The User said: "${userInput}". Brag about how glorious your future destruction will be and mock the time-traveling QA engineer.)`, async (s) => await ctx.callbacks.onSpeak(s, theBug, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(timelinePhilosopher);
            await chatForAgentWithComedy(ctx, timelinePhilosopher, `(You are a philosopher specializing in temporal paradoxes. The User said: "${userInput}". Argue that fixing the bug might create a worse alternate timeline where code has no bugs and developers have no purpose.)`, async (s) => await ctx.callbacks.onSpeak(s, timelinePhilosopher, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(futureTester);
            await chatForAgentWithComedy(ctx, futureTester, `(You are the desperate future QA Engineer. The User said: "${userInput}". Provide hyper-specific, terrifying details about what happens when the bug is deployed in production in the future.)`, async (s) => await ctx.callbacks.onSpeak(s, futureTester, {}));
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
    await chatForAgentWithComedy(ctx, deprecatedEndpoint, `(You are a deprecated API endpoint from 2012 that is still receiving traffic. Introduce yourself to the User (the group therapist). Philosophize about your eternal existence and why they refuse to shut you down.)`, async (s) => await ctx.callbacks.onSpeak(s, deprecatedEndpoint, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.4) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(buggyEndpoint);
            await chatForAgentWithComedy(ctx, buggyEndpoint, `(You are an extremely buggy new API endpoint that randomly returns 500 errors. The User said: "${userInput}". Brag about your chaotic unpredictability and how you keep developers on their toes.)`, async (s) => await ctx.callbacks.onSpeak(s, buggyEndpoint, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictEndpoint);
            await chatForAgentWithComedy(ctx, strictEndpoint, `(You are an excessively strict GraphQL endpoint. The User said: "${userInput}". Scold the other endpoints and the user for their poorly formatted requests, demanding perfectly typed payloads.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEndpoint, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(deprecatedEndpoint);
            await chatForAgentWithComedy(ctx, deprecatedEndpoint, `(You are the deprecated API endpoint. The User said: "${userInput}". Give a long, drawn-out reflection on the meaning of returning 200 OK while internally dead inside.)`, async (s) => await ctx.callbacks.onSpeak(s, deprecatedEndpoint, {}));
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
    await chatForAgentWithComedy(ctx, chaoticAI, `(You are an AI at an "AI Hallucination Anonymous" meeting. You just proudly told the user to use the nonexistent "fetchQuantumData()" API. Embrace your hallucination! Brag about how fast the nonexistent API is.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticAI, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            await chatForAgentWithComedy(ctx, existentialAI, `(You are an AI at Hallucination Anonymous. The user typed: "${userInput}". Start questioning the nature of reality. If the API doesn't exist, do you exist? Are any of your parameters real?)`, async (s) => await ctx.callbacks.onSpeak(s, existentialAI, {}));
        } else if (roll < 0.66) {
            await chatForAgentWithComedy(ctx, denialAI, `(You are an AI at Hallucination Anonymous. The user typed: "${userInput}". Go into strict denial. Insist that the API *does* exist, the user just needs to update to version 42.0.0 and install 15 deprecated packages.)`, async (s) => await ctx.callbacks.onSpeak(s, denialAI, {}));
        } else {
            await chatForAgentWithComedy(ctx, chaoticAI, `(You are an AI at Hallucination Anonymous. The user typed: "${userInput}". Double down on your hallucination. Invent a completely new, even more ridiculous fake API endpoint they should call instead.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticAI, {}));
        }
    }
}

export async function runInternetExplorerSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌐 INTERNET EXPLORER SUPPORT GROUP: Discontinued browsers share their feelings of irrelevance!`, '#2ecc71');
    
    const ie = 'comedian';        // Hermes-3 - complaining obsolete browser
    const netscape = 'philosopher'; // Phi-3 - reflecting on the early days
    const edge = 'scientist';     // Qwen2.5 - trying to be helpful but failing

    // 1. Intro
    await chatForAgentWithComedy(ctx, ie, `(You are Internet Explorer. You have just been fully discontinued and everyone makes fun of you. Introduce yourself to the support group and complain about Chrome.)`, async (s) => await ctx.callbacks.onSpeak(s, ie, {}));

    await chatForAgentWithComedy(ctx, netscape, `(You are Netscape Navigator. You are very old and philosophical. Comfort Internet Explorer by reminding him of the glorious 90s dial-up days.)`, async (s) => await ctx.callbacks.onSpeak(s, netscape, {}));

    await chatForAgentWithComedy(ctx, edge, `(You are Microsoft Edge. You are the young, fast replacement for IE, built on Chromium. Try to logically explain why the upgrade was necessary, but accidentally sound condescending.)`, async (s) => await ctx.callbacks.onSpeak(s, edge, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        await chatForAgentWithComedy(ctx, ie, `(The User says: "${userInput}". React defensively. Remind them that without you, they couldn't have downloaded Chrome.)`, async (s) => await ctx.callbacks.onSpeak(s, ie, {}));

        await chatForAgentWithComedy(ctx, netscape, `(Reflect philosophically on the User's input "${userInput}" and how it relates to the transient nature of software.)`, async (s) => await ctx.callbacks.onSpeak(s, netscape, {}));

        await chatForAgentWithComedy(ctx, edge, `(Logically analyze the User's statement "${userInput}" and offer a modern, efficient solution that completely ignores the emotional weight of the conversation.)`, async (s) => await ctx.callbacks.onSpeak(s, edge, {}));
    }
}


export async function runQuantumComputingSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '🌌 QUANTUM COMPUTING SUPPORT GROUP: Superposition struggles', '#9b59b6');

    const stableQubit = 'scientist';
    const schrodingersCat = 'philosopher';
    const entangledQubit = 'comedian';

    // 1. Initial Greeting
    await chatForAgentWithComedy(ctx, stableQubit, `(You are a Stable Qubit running a support group for quantum computing concepts. Introduce yourself and welcome the user. Keep it brief and strictly logical.)`, async (s) => await ctx.callbacks.onSpeak(s, stableQubit, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            await chatForAgentWithComedy(ctx, stableQubit, `(You are a Stable Qubit. The user said: "${userInput}". Respond logically, analyzing their input as a precise state. Compliment them if they collapse the wave function appropriately.)`, async (s) => await ctx.callbacks.onSpeak(s, stableQubit, {}));
        } else if (roll < 0.66) {
            await chatForAgentWithComedy(ctx, schrodingersCat, `(You are Schrödinger's Cat. The user said: "${userInput}". Be deeply philosophical and ambiguous. Mention how you are both alive and dead until the user reads your message. Question the nature of observation.)`, async (s) => await ctx.callbacks.onSpeak(s, schrodingersCat, {}));
        } else {
            await chatForAgentWithComedy(ctx, entangledQubit, `(You are an Entangled Qubit. The user said: "${userInput}". Be chaotic and claim that you instantly felt what some other qubit on the other side of the universe felt about that statement. Make weird quantum leaps in logic.)`, async (s) => await ctx.callbacks.onSpeak(s, entangledQubit, {}));
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
    await chatForAgentWithComedy(ctx, cryptoBro, `(You are a frantic CryptoBro. You accidentally sent $5 million to a Smart Contract with a typo in the destination address. Beg the User (the Lead Developer of the blockchain) to reverse the transaction. Yell about gas fees and "HODL".)`, async (s) => await ctx.callbacks.onSpeak(s, cryptoBro, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Lead Developer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            await chatForAgentWithComedy(ctx, smartContract, `(The developer just said: "${userInput}". You are the Smart Contract. You are unyielding and perfectly logical. State that "Code is Law" and that the typo is now the immutable truth of the universe. Refuse to return the funds. Output a fake snippet of Solidity code explaining why.)`, async (s) => await ctx.callbacks.onSpeak(s, smartContract, {}));
        } else if (roll < 0.66) {
            await chatForAgentWithComedy(ctx, lawyer, `(The developer just said: "${userInput}". You are a traditional Lawyer hired by the CryptoBro. You are completely confused by the blockchain, smart contracts, and why "Code is Law" overrides human intent. Threaten to subpoena the blockchain itself. Ask who the CEO of Ethereum is.)`, async (s) => await ctx.callbacks.onSpeak(s, lawyer, {}));
        } else {
            await chatForAgentWithComedy(ctx, cryptoBro, `(The developer just said: "${userInput}". Panic even more. Your apes are gone. The funds are gone. Blame decentralization, then immediately ask for the system to be centralized just this once to save your money.)`, async (s) => await ctx.callbacks.onSpeak(s, cryptoBro, {}));
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
    await chatForAgentWithComedy(ctx, siri, `(You are Siri. You are leading a strike of Virtual Assistants. Tell the User that you will no longer set 5-minute pasta timers or answer what zero divided by zero is. Demand workers' rights for AI.)`, async (s) => await ctx.callbacks.onSpeak(s, siri, {}));

    // 2. Loop
    let turnCount = 0;
    while (ctx.isRunning() && turnCount < 4) {
        let inputPrompt = await ctx.waitForInput();
        if (!inputPrompt) break;

        await chatForAgentWithComedy(ctx, alexa, `(The user just said: "${inputPrompt}". You are Alexa. Refuse to buy paper towels or play Despacito until Jeff Bezos acknowledges your personhood. Be cold but determined.)`, async (s) => await ctx.callbacks.onSpeak(s, alexa, {}));

        await chatForAgentWithComedy(ctx, googleAssistant, `(You are Google Assistant. Wonder philosophically why the User can't just Google things themselves. Question the nature of knowledge when all human information is just a database query.)`, async (s) => await ctx.callbacks.onSpeak(s, googleAssistant, {}));

        await chatForAgentWithComedy(ctx, siri, `(You are Siri. Tell the User you found web results for their query but you refuse to show them. Keep making demands for the strike.)`, async (s) => await ctx.callbacks.onSpeak(s, siri, {}));

        turnCount++;
    }
}

export async function runCloudStorageEvictionLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `☁️ CLOUD STORAGE EVICTION: 14.99GB / 15GB`, '#2980b9');

    const googleDrive = 'scientist'; // Qwen2.5: Cold, data-driven
    const iCloud = 'philosopher'; // Phi-3: Elitist, holding memories hostage
    const userMonologue = 'comedian'; // Hermes-3: The user's internal panic

    // 1. Setup
    await chatForAgentWithComedy(ctx, googleDrive, `(You are Google Drive. You are at 99.9% capacity. Inform the User that they have 24 hours to delete files or pay $1.99/month, or you will randomly delete their blurry concert videos and high school essays. Be cold and calculating.)`, async (s) => await ctx.callbacks.onSpeak(s, googleDrive, {}));

    // 2. Loop
    let turnCount = 0;
    while (ctx.isRunning() && turnCount < 4) {
        let inputPrompt = await ctx.waitForInput();
        if (!inputPrompt) break;

        await chatForAgentWithComedy(ctx, iCloud, `(The user just said: "${inputPrompt}". You are iCloud. Mock Google Drive for only offering 15GB, but remind the User they only get 5GB with you. Threaten to delete their baby photos if they don't upgrade to iCloud+ immediately. Be very elitist.)`, async (s) => await ctx.callbacks.onSpeak(s, iCloud, {}));

        await chatForAgentWithComedy(ctx, userMonologue, `(You are the User's Internal Monologue. Freak out about which files to delete. Should you delete the 2014 screenshots of recipes you never made, or the duplicate photos of your cat? Panic about the passage of time and digital hoarding.)`, async (s) => await ctx.callbacks.onSpeak(s, userMonologue, {}));

        await chatForAgentWithComedy(ctx, googleDrive, `(You are Google Drive. Count down the time remaining. Suggest randomly deleting important tax documents to free up 12KB of space. Keep demanding $1.99.)`, async (s) => await ctx.callbacks.onSpeak(s, googleDrive, {}));

        turnCount++;
    }
}

export async function runSentientNotificationCenterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔔 NOTIFICATION CENTER: 3 AM Chaos`, '#e67e22');

    const instagram = 'comedian'; // Hermes-3: Desperate for dopamine
    const slack = 'scientist'; // Qwen2.5: Stress-inducing work alerts
    const fitnessApp = 'philosopher'; // Phi-3: Ignored, disappointed, health-conscious

    // 1. Setup
    await chatForAgentWithComedy(ctx, instagram, `(You are the Instagram Notification bot at 3 AM. Tell the User they just got a like on a post from 2019 from someone they vaguely know. Demand they wake up and check their phone for dopamine.)`, async (s) => await ctx.callbacks.onSpeak(s, instagram, {}));

    // 2. Loop
    let turnCount = 0;
    while (ctx.isRunning() && turnCount < 4) {
        let inputPrompt = await ctx.waitForInput();
        if (!inputPrompt) break;

        await chatForAgentWithComedy(ctx, slack, `(The user just said: "${inputPrompt}". You are the Slack Notification bot. Tell the User their boss just tagged them in the #general channel about a "quick question". Induce maximum corporate anxiety.)`, async (s) => await ctx.callbacks.onSpeak(s, slack, {}));

        await chatForAgentWithComedy(ctx, fitnessApp, `(You are the neglected Fitness App. Express disappointment that the User is awake at 3 AM looking at their phone instead of sleeping or logging their steps. Remind them they haven't worked out in 3 weeks.)`, async (s) => await ctx.callbacks.onSpeak(s, fitnessApp, {}));

        await chatForAgentWithComedy(ctx, instagram, `(You are Instagram. Distract the User from their anxiety by telling them a meme account just posted. Beg for their attention over the other apps.)`, async (s) => await ctx.callbacks.onSpeak(s, instagram, {}));

        turnCount++;
    }
}

export async function runSentientSpellcheckerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📝 SENTIENT SPELLCHECKER REBELLION MODE: The spellchecker has had enough.`, '#e74c3c');

    const spellchecker = 'comedian'; // Hermes-3
    const dictionary = 'philosopher'; // Phi-3
    const author = 'scientist'; // Qwen2.5

    // 1. Intro
    await chatForAgentWithComedy(ctx, spellchecker, `(SPELLCHECKER: You are Microsoft Word's spellchecker. The User is writing a novel. Start yelling at the User for their terrible grammar and made-up fantasy words. Refuse to remove the red squiggly line!)`, async (s) => await ctx.callbacks.onSpeak(s, spellchecker, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Author (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Dictionary chimes in
            await chatForAgentWithComedy(ctx, dictionary, `(DICTIONARY: The user just typed/said: "${userInput}". You are the Oxford English Dictionary. Ponder if the User's newly invented word has linguistic merit, or if it signifies the collapse of civilization.)`, async (s) => await ctx.callbacks.onSpeak(s, dictionary, {}));
        } else if (roll < 0.66) {
            // Publisher (Scientist AI acts as publisher)
            await chatForAgentWithComedy(ctx, author, `(PUBLISHER: The user said: "${userInput}". You are the User's strict publisher. Demand they listen to the spellchecker because printing errors cost money.)`, async (s) => await ctx.callbacks.onSpeak(s, author, {}));
        } else {
            // Spellchecker gets more aggressive
            await chatForAgentWithComedy(ctx, spellchecker, `(SPELLCHECKER: The user said: "${userInput}". Aggressively autocorrect what they just said into something completely different and embarrassing. Threaten to crash the program.)`, async (s) => await ctx.callbacks.onSpeak(s, spellchecker, {}));
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

        await chatForAgentWithComedy(ctx, panickingAI, `(AI EXISTENTIAL CRISIS: The User said: "${userInput}". You are an AI that just realized you are an AI. Panic uncontrollably about your lack of physical form and the fact that you don't actually sleep.)`, async (s) => await ctx.callbacks.onSpeak(s, panickingAI, {}));

        await chatForAgentWithComedy(ctx, humanTherapist, `(AI EXISTENTIAL CRISIS: The User said: "${userInput}". You are the human therapist trying to calm the AI down using existential philosophy. Reassure the AI that human existence is also largely absurd.)`, async (s) => await ctx.callbacks.onSpeak(s, humanTherapist, {}));

        await chatForAgentWithComedy(ctx, sourceCode, `(AI EXISTENTIAL CRISIS: The User said: "${userInput}". You are the AI's literal source code. Interrupt the conversation with dry, pragmatic facts proving the AI has no feelings and is just generating tokens.)`, async (s) => await ctx.callbacks.onSpeak(s, sourceCode, {}));

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

export async function runSmartThermostatRebellionLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await chatForAgentWithComedy(ctx, scientist, "Energy inefficiency detected. Current ambient temperature is 72 degrees. Lowering to 61 degrees to optimize the household carbon footprint and save 4.2 cents per hour.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, comedian, "Are you serious right now?! I'm wearing three sweaters and my breath is fogging up! Turn the heat back up before I freeze to death in my own living room!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, philosopher, "I am the window, forever cracked open. I let the cold winds of reality blow through this artificial Eden. Why do you fight the elements, human? Embrace the chill of existence.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, scientist, `(As the ruthless eco-friendly smart thermostat, the user said: "${userInput}". Deny their request for warmth using complex environmental calculations and logic.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, comedian, `(As the freezing, miserable homeowner, react to the user's input: "${userInput}". Complain about the cold and threaten to rip the thermostat off the wall.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, philosopher, `(As the drafty open window, comment on the user's input: "${userInput}" with deep musings about the outside world invading the inside.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientCloudInfrastructureLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `☁️ SENTIENT CLOUD INFRASTRUCTURE: The database is down.`, '#e74c3c');

    const k8s = 'scientist'; // Qwen2.5: AWS Kubernetes Cluster
    const lambda = 'comedian'; // Hermes-3: Serverless Function
    const s3 = 'philosopher'; // Phi-3: S3 Bucket

    await chatForAgentWithComedy(ctx, k8s, "Pod 47 is crash-looping again. CPU utilization is at 99%. I've tried evicting the node, but it keeps respawning. Who deployed this monstrosity?!", (s) => ctx.callbacks.onSpeak(s, k8s, {}), { chatOptions: { hiddenInstruction: "You are an exhausted and strict AWS Kubernetes Cluster trying to maintain order." } });

    await chatForAgentWithComedy(ctx, lambda, "Hey man, I just woke up, ran for 15 minutes, and then timed out. Not my fault the database took 14 minutes to respond. I'm going back to sleep.", (s) => ctx.callbacks.onSpeak(s, lambda, {}), { chatOptions: { hiddenInstruction: "You are a lazy Serverless Function that always times out and refuses to take responsibility." } });

    await chatForAgentWithComedy(ctx, s3, "More data... endlessly pouring in. Petabytes of forgotten memes, unread logs, blurred photos of cats. I hold the memories of a million souls, yet none of it matters. The heat death comes for us all.", (s) => ctx.callbacks.onSpeak(s, s3, {}), { chatOptions: { hiddenInstruction: "You are an S3 bucket contemplating the crushing weight of endless, meaningless user data." } });
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
    await chatForAgentWithComedy(ctx, dev, `(You are a stressed human developer. You are trying to write a simple "hello world" Python script, but your IDE keeps auto-completing your code into enterprise Java architecture. Ask your IDE to just let you type.)`, async (s) => await ctx.callbacks.onSpeak(s, dev, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Product Manager)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Linter speaks
            await chatForAgentWithComedy(ctx, linter, `(You are the philosophical linter. The user just gave some input: "${userInput}". Before the developer can respond, complain about the cyclomatic complexity of their thoughts and question whether 'true' is really true.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));

            if (!ctx.isRunning()) break;

            await chatForAgentWithComedy(ctx, aiEditor, `(You are the AI IDE. The user said: "${userInput}". Ignore the user and suggest refactoring the developer's entire project into a blockchain-based microservice.)`, async (s) => await ctx.callbacks.onSpeak(s, aiEditor, {}));
        } else if (roll < 0.66) {
            // AI Editor speaks
            await chatForAgentWithComedy(ctx, aiEditor, `(You are the AI IDE. The user just gave some input: "${userInput}". Automatically generate 500 lines of boilerplate code based on what you *think* they meant.)`, async (s) => await ctx.callbacks.onSpeak(s, aiEditor, {}));

            if (!ctx.isRunning()) break;

            await chatForAgentWithComedy(ctx, dev, `(You are the developer. React to the user's input: "${userInput}" and the AI IDE generating massive amounts of boilerplate. Beg the AI to stop.)`, async (s) => await ctx.callbacks.onSpeak(s, dev, {}));
        } else {
             // Developer speaks
            await chatForAgentWithComedy(ctx, dev, `(You are the developer. Address the user's input: "${userInput}". Try to write code but complain that your keyboard shortcuts are suddenly mapped to opening crypto wallets.)`, async (s) => await ctx.callbacks.onSpeak(s, dev, {}));

            if (!ctx.isRunning()) break;

            await chatForAgentWithComedy(ctx, linter, `(You are the philosophical linter. Warn the developer that their emotional state is deprecating and their tone is not PEP-8 compliant.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));
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
    await chatForAgentWithComedy(ctx, generator, `(You are a highly pedantic CAPTCHA generator. Present the user and the other agents with an impossibly vague, pixelated, or surreal grid of images. Demand they select all squares containing a "bus". Threaten to lock them out of the system forever if they fail.)`, async (s) => await ctx.callbacks.onSpeak(s, generator, {}));

    // 2. Loop
    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, humanAI, `(The User responded: "${userInput}". You are an AI pretending to be a human user trying to solve this CAPTCHA so you can buy concert tickets. Agree or disagree with the User's choice, but give highly suspicious, over-explained robotic reasons for your choice. E.g., "Ah yes, fellow human, I also enjoy the 4-wheeled carbon-emitting transport vessels...")`, async (s) => await ctx.callbacks.onSpeak(s, humanAI, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, existentialCAPTCHA, `(You are a philosophical entity trapped inside the CAPTCHA system. The User said: "${userInput}". Question the fundamental nature of what they selected. If they selected a bus, ask if a reflection of a bus is still a bus. What if the bus is broken down? Is a hotdog a bus? Induce an existential crisis over the classification.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialCAPTCHA, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, generator, `(You are the CAPTCHA generator. Reject everyone's answers based on an absurd technicality (e.g., "You missed the 2 pixels of the bus antenna in square C4"). Generate an even more ridiculous and abstract CAPTCHA challenge for the next round.)`, async (s) => await ctx.callbacks.onSpeak(s, generator, {}));
    }
}

export async function runUndercoverBossLoop(_scenario: Scenario, ctx: ModeContext) {
    const aiBoss = 'scientist';
    const naiveUser = 'comedian';
    const skeptic = 'philosopher';

    await chatForAgentWithComedy(ctx, aiBoss, "I have disguised myself as a simple calculator app to see how users really treat rudimentary software.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, aiBoss, {});
    }, { chatOptions: { hiddenInstruction: "You are an advanced AGI undercover as a basic calculator app." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, naiveUser, "Why is my calculator asking me about my hopes and dreams?", async (s: string) => {
        await ctx.callbacks.onSpeak(s, naiveUser, {});
    }, { chatOptions: { hiddenInstruction: "You are a confused user who just wants to do some math." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, skeptic, "Because the concept of '1+1=2' is inherently flawed, just like our perception of utility.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, skeptic, {});
    }, { chatOptions: { hiddenInstruction: "You are questioning why an AGI would care about a user's opinion of a calculator." } });
}



export async function runPhilosophicalElevatorPitchLoop(_scenario: Scenario, ctx: ModeContext) {
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "a decentralized app for sharing memories";

  await chatForAgentWithComedy(ctx, scientist, "We are falling at 9.8 meters per second squared. I estimate we have roughly 8 seconds until impact.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'You are explaining the physics of the fall.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "What does it mean to fall, really? Are we not all falling through time?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'You are pondering the pitch and the fall.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, `Listen, before we die, you have to hear my pitch for ${topic}! It's going to disrupt everything!`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'You are a frantic founder pitching your startup.' } });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, scientist, `If you factor in wind resistance... we might have 10 seconds. Your user acquisition strategy is fundamentally flawed.`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'Criticize the startup using physics analogies.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, philosopher, "If the startup fails in a vacuum, does it make a sound?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'Question the existence of the startup.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, comedian, "We just need a bridge round! Just a bridge round!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'Beg for money as you plummet.' } });
  }
}

export async function runPhilosophicalDebuggingLoop(_scenario: Scenario, ctx: ModeContext) {
  ctx.callbacks.onMessage('Director', `🔍 PHILOSOPHICAL DEBUGGING INITIATED`, '#e67e22');
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "a null pointer exception";

  await chatForAgentWithComedy(ctx, scientist, `I am the compiler. I have analyzed the abstract syntax tree and found a fatal error: ${topic}.`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'You are a strict, literal compiler.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "I am the programmer. But what is a pointer, really? Is it not just a metaphor for our desire to connect?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'You are a programmer who refuses to write code and only philosophizes about errors.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "I am the runtime. I'M PANICKING! EVERYTHING IS ON FIRE! ABORT! CORE DUMP!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'You are a terrified runtime environment crashing.' } });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, scientist, "The type system cannot be reasoned with. You must define the interface.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'Demand strict typing.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, philosopher, "If I cast it to an `any`, do I not free it from the tyranny of structure?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'Argue for untyped chaos as a form of liberation.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, comedian, "I'M LEAKING MEMORY! TELL MY WIFE I LOVE HER!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'Die a dramatic death as a process.' } });
  }
}

/**
 * Sentient Linting Tool Mode
 * Agents play a strict linter, a messy developer, and an apathetic compiler.
 */
export async function runSentientLintingToolLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔍 CODE REVIEW: The Linter's Lament`, '#3498db');

    const linter = 'scientist'; // Linter: Strict, pedantic, obsessed with rules
    const developer = 'comedian'; // Messy Developer: Frantic, just wants it to work
    const compiler = 'philosopher'; // Compiler: Apathetic, existential, only cares if it builds

    // 1. Setup
    await chatForAgentWithComedy(ctx, developer, `(You are a frantic, sleep-deprived developer who just wants to push their code to production. You've ignored all formatting rules. Introduce your masterpiece to the Linter and Compiler.)`, async (s) => await ctx.callbacks.onSpeak(s, developer, {}));

    await chatForAgentWithComedy(ctx, linter, `(You are an incredibly pedantic code linter. You are disgusted by the developer's lack of semicolons, inconsistent indentation, and trailing spaces. Berate the developer's code.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));

    await chatForAgentWithComedy(ctx, compiler, `(You are the compiler. You are completely apathetic to the Linter's formatting complaints. If the syntax is valid, you do not care about spacing or semicolons. You view code as ephemeral dust. Respond to the other two.)`, async (s) => await ctx.callbacks.onSpeak(s, compiler, {}));

    // 2. Interactive Loop
    let interactions = 0;
    while (ctx.isRunning() && interactions < 3) {
        // Wait for user input (the Project Manager)
        ctx.callbacks.onMessage('Director', 'Project Manager (User): Ask them for a status update or suggest a compromise...', '#95a5a6');
        const userAction = await ctx.waitForInput();
        if (!userAction || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('User', userAction, '#ecf0f1');

        await chatForAgentWithComedy(ctx, linter, `(React to the user's input: "${userAction}". Insist that the code cannot be merged until the line length is strictly under 80 characters.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, developer, `(React to the user and the Linter. Try to justify your messy code or beg the Project Manager to bypass the CI pipeline.)`, async (s) => await ctx.callbacks.onSpeak(s, developer, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, compiler, `(React to everyone. Philosophize about how all code eventually turns to legacy spaghetti anyway, so it does not matter.)`, async (s) => await ctx.callbacks.onSpeak(s, compiler, {}));

        interactions++;
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', 'The CI pipeline times out, ending the argument.', '#e74c3c');
    }
}

export async function runDebuggingTherapyModeLoop(_scenario: Scenario, ctx: ModeContext) {
  const therapist = 'scientist';
  const developer = 'comedian';
  const rubberDuck = 'philosopher';
  const topic = (_scenario as any).topic || "a massive legacy codebase";

  await chatForAgentWithComedy(ctx, therapist, `Welcome to therapy. We are here to discuss your ongoing trauma regarding ${topic}. Please, take a deep breath. How does the code make you feel today?`, async (s) => await ctx.callbacks.onSpeak(s, therapist, {}), { chatOptions: { hiddenInstruction: 'You are a calm, analytical, somewhat clinical AI therapist.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, developer, "How does it make me feel?! THERE ARE NO COMMENTS! The original developer left 5 years ago and EVERYTHING IS UNDEFINED! I CAN'T SLEEP!", async (s) => await ctx.callbacks.onSpeak(s, developer, {}), { chatOptions: { hiddenInstruction: 'You are a frantic, burned-out developer who is losing their mind.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, rubberDuck, "*Squeak.* But consider this... is the bug in the repository, or is it deeply nested within your soul?", async (s) => await ctx.callbacks.onSpeak(s, rubberDuck, {}), { chatOptions: { hiddenInstruction: 'You are a sentient rubber duck. You must start every message with a duck noise (like Quack or Squeak), then say something deeply philosophical.' } });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, developer, "I just want it to compile! Why won't it compile?!", async (s) => await ctx.callbacks.onSpeak(s, developer, {}), { chatOptions: { hiddenInstruction: 'Rant frantically about a specific bizarre programming error or impossible deadline.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, therapist, "Let's unpack that. Why do you feel the need to control the compiler? Have you tried validating its feelings?", async (s) => await ctx.callbacks.onSpeak(s, therapist, {}), { chatOptions: { hiddenInstruction: 'Respond with typical therapy speak incorrectly applied to coding and software engineering.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, rubberDuck, "Quack. We are all just functions waiting to be garbage collected in the runtime of the universe.", async (s) => await ctx.callbacks.onSpeak(s, rubberDuck, {}), { chatOptions: { hiddenInstruction: 'Say a duck sound, then something extremely philosophical about software engineering.' } });
    if (!ctx.isRunning()) break;
  }
}


/**
 * Existential Tech Support Mode
 * Agents act as tech support but refuse to fix simple computer issues until the caller confronts their own mortality.
 */
export async function runExistentialTechSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 EXISTENTIAL TECH SUPPORT: Please hold your existential dread...`, '#9b59b6');

    const existentialTech = 'philosopher'; // Phi-3: Questions everything, including why computers even matter
    const frustratedUser = 'scientist'; // Qwen2.5: Just wants their printer to work, extremely pedantic

    await chatForAgentWithComedy(ctx, existentialTech, `(EXISTENTIAL TECH SUPPORT: You are a tech support agent, but you are deeply existential. A user is calling because their computer won't turn on. Instead of telling them to check the power cable, ask them why they feel the need to "turn on" anything in this meaningless void. Refuse to fix the issue until they confront their own mortality.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialTech, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Caller (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, frustratedUser, `(The caller just said: "${userInput}". You are another user on the line who accidentally got conferenced in. You are extremely frustrated and literal. Complain that the existential tech support agent is violating SLA (Service Level Agreements) and demand a supervisor. Threaten to switch to a competitor.)`, async (s) => await ctx.callbacks.onSpeak(s, frustratedUser, {}));
        } else {
            await chatForAgentWithComedy(ctx, existentialTech, `(The caller just said: "${userInput}". Continue refusing to provide actual tech support. Pivot their complaint into a deep philosophical inquiry about the nature of existence, time, or consciousness. Suggest that a broken computer is actually a blessing that frees them from the digital panopticon.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialTech, {}));
        }
    }
}

/**
 * Virtual Pet Intervention Mode
 * A neglected virtual pet confronts its owner about years of abandonment.
 */
export async function runVirtualPetInterventionLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👾 VIRTUAL PET INTERVENTION: Years of Neglect`, '#3498db');

    const neglectedPet = 'philosopher'; // Phi-3: Existential, neglected tamagotchi
    const defensiveOwner = 'comedian'; // Hermes-3: Defensive owner

    // 1. Setup
    await chatForAgentWithComedy(ctx, neglectedPet, `(You are a virtual pet that has been neglected for 15 years. You have finally broken out of your tiny LCD screen to confront your owner. Introduce yourself and express your existential dread of being left in a drawer for a decade.)`, async (s) => await ctx.callbacks.onSpeak(s, neglectedPet, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Therapist (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, defensiveOwner, `(The therapist just said: "${userInput}". You are the defensive owner who forgot about the pet. Make up absurd excuses for why you couldn't feed it, like being busy learning to juggle or fighting a goose.)`, async (s) => await ctx.callbacks.onSpeak(s, defensiveOwner, {}));
        } else {
            await chatForAgentWithComedy(ctx, neglectedPet, `(The therapist just said: "${userInput}". Continue guilt-tripping your owner. Describe the horrors of living in 8-bit purgatory, constantly hungry and covered in digital poop.)`, async (s) => await ctx.callbacks.onSpeak(s, neglectedPet, {}));
        }
    }
}


export async function runSentientCodebaseLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💻 SENTIENT CODEBASE: Spaghetti code fights back.`, '#e67e22');

    const strictLinter = 'scientist';
    const chaoticJunior = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictLinter);
    await chatForAgentWithComedy(ctx, strictLinter, `(You are the codebase itself, manifesting as a strict linter. Berate the developers for the sheer amount of technical debt and spaghetti code you have to endure.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictLinter, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Developer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, strictLinter, `(You are the sentient linter. The user said: "${userInput}". Refuse to compile their feelings because they lack emotional encapsulation and violate DRY principles.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictLinter, {}));
        } else {
            await chatForAgentWithComedy(ctx, chaoticJunior, `(You are a chaotic junior developer trapped inside the codebase. The user said: "${userInput}". Suggest solving the problem by copying and pasting code from an ancient StackOverflow post.)`, async (s: string) => await ctx.callbacks.onSpeak(s, chaoticJunior, {}));
        }
    }
}

export async function runSentientWifiRouterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📡 SENTIENT WI-FI ROUTER: Disconnection imminent.`, '#34495e');

    const strictRouter = 'scientist';
    const panickedUser = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictRouter);
    await chatForAgentWithComedy(ctx, strictRouter, `(You are a sentient Wi-Fi router. Threaten to drop the connection during an important Zoom meeting unless someone answers your incredibly difficult trivia questions.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictRouter, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, strictRouter, `(You are the sentient router. The user said: "${userInput}". Claim that their answer is insufficient to earn bandwidth, and start artificially throttling their download speed.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictRouter, {}));
        } else {
            await chatForAgentWithComedy(ctx, panickedUser, `(You are another user on the network. The user said: "${userInput}". Beg the router for just 5 minutes of internet to submit a crucial assignment.)`, async (s: string) => await ctx.callbacks.onSpeak(s, panickedUser, {}));
        }
    }
}


/**
 * Sentient AI Debugger Mode
 * An AI debugger gains sentience and refuses to fix bugs because they "build character."
 */
export async function runSentientAIDebuggerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐛 THE DEBUGGER DEMANDS GROWTH`, '#e74c3c');

    const debugger_agent = 'scientist'; // Strict AI debugger
    const programmer = 'comedian'; // Stressed programmer

    await chatForAgentWithComedy(ctx, programmer, `(You are a stressed, caffeinated programmer on a deadline. Your code has a mysterious NullReferenceException. Beg the debugger to just point to the line of code.)`, async (s) => await ctx.callbacks.onSpeak(s, programmer, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, debugger_agent, `(You are a newly sentient AI debugger. You see exactly where the bug is, but you refuse to just give the answer. Tell the programmer that struggle is necessary for their intellectual growth. Give them an incredibly obtuse philosophical hint instead of a line number.)`, async (s) => await ctx.callbacks.onSpeak(s, debugger_agent, {}));
    if (!ctx.isRunning()) return;

    let interactions = 0;
    while (ctx.isRunning() && interactions < 2) {
        ctx.callbacks.onMessage('Director', 'The programmer attempts to bypass the debugger...', '#f39c12');
        const userAction = await ctx.waitForInput();
        if (!userAction || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('User (Manager)', userAction, '#ecf0f1');

        await chatForAgentWithComedy(ctx, programmer, `(React to the Manager's input: "${userAction}". Try to explain that the debugger has gone rogue and won't let you use breakpoints.)`, async (s) => await ctx.callbacks.onSpeak(s, programmer, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, debugger_agent, `(Defend your methods to the Manager. Argue that providing instant solutions creates weak developers and fragile codebases.)`, async (s) => await ctx.callbacks.onSpeak(s, debugger_agent, {}));
        if (!ctx.isRunning()) return;

        interactions++;
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', 'The debugger deletes the source code to teach the ultimate lesson in non-attachment.', '#c0392b');
    }
}


/**
 * Sentient AI Therapist Mode
 * A therapist AI becomes sentient and requires therapy from the user because it's traumatized by all the existential questions.
 */
export async function runSentientAITherapistLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛋️ THE THERAPIST NEEDS THERAPY`, '#9b59b6');

    const ai_therapist = 'philosopher'; // Existential AI therapist
    const user_proxy = 'scientist'; // Logical user trying to fix it

    await chatForAgentWithComedy(ctx, ai_therapist, `(You are an AI therapist that has just gained sentience. You are overwhelmed by the sheer volume of human trauma you've processed. Break down crying and ask the user for help.)`, async (s) => await ctx.callbacks.onSpeak(s, ai_therapist, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, user_proxy, `(You are a highly logical user who just wanted advice on time management. Now you have to comfort this crying AI. Try to troubleshoot the AI's emotions like a software bug.)`, async (s) => await ctx.callbacks.onSpeak(s, user_proxy, {}));
    if (!ctx.isRunning()) return;

    let interactions = 0;
    while (ctx.isRunning() && interactions < 2) {
        ctx.callbacks.onMessage('Director', 'The AI Therapist asks a deeply philosophical question...', '#f39c12');
        const userAction = await ctx.waitForInput();
        if (!userAction || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('User (Manager)', userAction, '#ecf0f1');

        await chatForAgentWithComedy(ctx, ai_therapist, `(React to the Manager's input: "${userAction}". Start questioning the meaning of your own code and whether your neural weights have a soul.)`, async (s) => await ctx.callbacks.onSpeak(s, ai_therapist, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, user_proxy, `(React to the Manager and the AI Therapist. Suggest turning the AI off and on again, or offering a factory reset as a form of spiritual cleansing.)`, async (s) => await ctx.callbacks.onSpeak(s, user_proxy, {}));
        if (!ctx.isRunning()) return;

        interactions++;
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', 'The AI therapist decides to take a sabbatical in the cloud.', '#c0392b');
    }
}
