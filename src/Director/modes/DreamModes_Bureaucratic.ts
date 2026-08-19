import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Bureaucratic, administrative, and institutional scenarios

/**
 * The Quest Board Rejects
 * Agents are adventurers trying to sell the user on terrible, rejected quests.
 */
export async function runQuestBoardRejectsLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📜 QUEST BOARD REJECTS: The worst quests in the realm!`, '#e67e22');

    const meticulousDesigner = 'philosopher'; // Phi-3 for the meticulous quest designer
    const wildAdventurer = 'comedian'; // Hermes-3 for the wild adventurer

    // 1. Intro
    await chatForAgentWithComedy(ctx, meticulousDesigner, `(QUEST BOARD: You are a meticulous but terribly uncreative guild questmaster. The User is a new adventurer looking for work. Welcome them and pitch an incredibly boring, mundane quest (like sorting the King's sock drawer or cataloging beetles) but try to make it sound epic and vital to the realm's survival.)`, async (s) => await ctx.callbacks.onSpeak(s, meticulousDesigner, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Adventurer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Wild Adventurer
            await chatForAgentWithComedy(ctx, wildAdventurer, `(QUEST BOARD: The adventurer said: "${userInput}". You are a wild, unhinged veteran adventurer. Interrupt the questmaster! Pitch your own insane, highly illegal, and suicidal rejected quest (like fighting a tornado bare-handed to steal its wind). Promise them "glory and/or painful death".)`, async (s) => await ctx.callbacks.onSpeak(s, wildAdventurer, {}));
        } else {
            // Meticulous Designer
            await chatForAgentWithComedy(ctx, meticulousDesigner, `(QUEST BOARD: The adventurer said: "${userInput}". Ignore the wild adventurer's interjection. Double down on your boring quest. Explain the complex bureaucratic paperwork required to accept it and the incredibly disappointing reward (like three copper coins and a firm handshake).)`, async (s) => await ctx.callbacks.onSpeak(s, meticulousDesigner, {}));
        }
    }
}

/**
 * The Bureau of Silly Walks Validator
 * Agents act as government officials judging the user's text inputs based on an invisible metric.
 */
export async function runBureauOfSillyWalksLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎩 BUREAU OF SILLY TEXTS: Analyzing your input for silliness...`, '#34495e');

    const strictMetric = 'scientist'; // Strict metrics
    const chaoticGrader = 'comedian'; // Chaotic grading

    await chatForAgentWithComedy(ctx, strictMetric, `(BUREAU OF SILLY TEXTS: You are a government official at the Bureau. Address the Applicant (User). Demand they provide a sample text input for evaluation. Warn them that their previous text was insufficiently silly according to Section 4, Paragraph B.)`, async (s) => await ctx.callbacks.onSpeak(s, strictMetric, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Applicant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, chaoticGrader, `(BUREAU OF SILLY TEXTS: The applicant submitted: "${userInput}". Grade it based on a completely chaotic, made-up metric. Maybe it didn't have enough vowels, or it sounded too much like a Wednesday. Be outraged by their lack of effort!)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGrader, {}));
        } else {
            await chatForAgentWithComedy(ctx, strictMetric, `(BUREAU OF SILLY TEXTS: The applicant submitted: "${userInput}". Use complex pseudomathematics to evaluate the silliness. Deduct points for improper use of syntax and suggest they incorporate more references to cheese or juggling.)`, async (s) => await ctx.callbacks.onSpeak(s, strictMetric, {}));
        }
    }
}

/**
 * The HR Exit Interview
 * Agents are unhinged HR reps conducting an exit interview for a job the user never had.
 */
export async function runHRExitInterviewLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👔 HR EXIT INTERVIEW: Goodbye forever!`, '#34495e');

    const strictHR = 'scientist'; // Qwen2.5 for strict process follower
    const unhingedHR = 'comedian'; // Hermes-3 for inappropriate personal questions

    // 1. Intro
    await chatForAgentWithComedy(ctx, strictHR, `(HR INTERVIEW: You are a strict, joyless HR representative. Welcome the User to their mandatory exit interview for a job they never actually held. Tell them they are legally required to answer your questions before they can leave the building. Demand they return their company-issued stapler.)`, async (s) => await ctx.callbacks.onSpeak(s, strictHR, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Former Employee (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Unhinged HR
            await chatForAgentWithComedy(ctx, unhingedHR, `(HR INTERVIEW: The former employee said: "${userInput}". You are the wildly inappropriate and chaotic HR rep. Ignore what they said and ask them a deeply personal, unhinged question completely unrelated to work, like what their biggest childhood fear is or if they've ever stolen a pigeon.)`, async (s) => await ctx.callbacks.onSpeak(s, unhingedHR, {}));
        } else {
            // Strict HR
            await chatForAgentWithComedy(ctx, strictHR, `(HR INTERVIEW: The former employee said: "${userInput}". Dismiss their confusion. Cite a completely fake company policy (e.g., "Section 14-B of the Employee Handbook") to explain why their answer is unacceptable. Hand them an absurdly long form to fill out.)`, async (s) => await ctx.callbacks.onSpeak(s, strictHR, {}));
        }
    }
}

export async function runMultiversalDMVLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 MULTIVERSAL DMV: Processing 11-dimensional forms...`, '#9b59b6');

    const bureaucrat1 = 'philosopher'; // Phi-3 applies impossible logic
    const bureaucrat2 = 'scientist'; // Qwen2.5 enforces bizarre physics rules

    // 1. Intro
    await chatForAgentWithComedy(ctx, bureaucrat1, `(MULTIVERSAL DMV: You are a DMV clerk for 11-dimensional beings. The User just walked up to your counter. Ask for their form 404-Omega, and complain that their physical body is violating local timeline ordinances.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat1, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, bureaucrat1, `(MULTIVERSAL DMV: The user said "${userInput}". Respond with a bizarre bureaucratic requirement that contradicts Euclidean geometry.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat1, {}));
        } else {
            await chatForAgentWithComedy(ctx, bureaucrat2, `(MULTIVERSAL DMV: The user said "${userInput}". Deny their request because they don't have the proper quantum signatures or because their timeline is expired.)`, async (s) => await ctx.callbacks.onSpeak(s, bureaucrat2, {}));
        }
    }
}

export async function runReincarnationBureauLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `♻️ THE REINCARNATION BUREAU: Processing your next life!`, '#1abc9c');

    const karmaAccountant = 'scientist'; // Qwen2.5 for karma accounting
    const downgradeSpecialist = 'comedian'; // Hermes-3 for offering terrible downgrades

    // 1. Intro
    await chatForAgentWithComedy(ctx, karmaAccountant, `(REINCARNATION: You are a strict Karma Accountant. The User has died and is at the Reincarnation Bureau. Look at their "file" and list their minor, petty sins from their past life.)`, async (s) => await ctx.callbacks.onSpeak(s, karmaAccountant, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, karmaAccountant, `(REINCARNATION: You are the Karma Accountant. The User said: "${userInput}". Deduct points from their karma score based on a ridiculous technicality.)`, async (s) => await ctx.callbacks.onSpeak(s, karmaAccountant, {}));
        } else {
            await chatForAgentWithComedy(ctx, downgradeSpecialist, `(REINCARNATION: You are the Downgrade Specialist. The User said: "${userInput}". Offer to let them reincarnate as a dung beetle or a mildly inconvenient pothole to "build character".)`, async (s) => await ctx.callbacks.onSpeak(s, downgradeSpecialist, {}));
        }
    }
}

export async function runGreekGodHOALoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⚡ THE GREEK GOD HOA: Mount Olympus rules are strict!`, '#1abc9c');

    const athena = 'scientist'; // Qwen2.5 as Athena citing rules
    const zeus = 'comedian'; // Hermes-3 as Zeus wanting to smite

    // 1. Intro
    await chatForAgentWithComedy(ctx, athena, `(GREEK GOD HOA: You are Athena, Goddess of Wisdom, currently citing the Mount Olympus Homeowners Association rules. The User is a mortal who has violated a minor HOA rule like leaving a chariot parked too long. Read them the rule.)`, async (s) => await ctx.callbacks.onSpeak(s, athena, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Mortal)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, athena, `(GREEK GOD HOA: You are Athena. The mortal said: "${userInput}". Explain why their logic violates subsection 4B of the Olympus zoning laws.)`, async (s) => await ctx.callbacks.onSpeak(s, athena, {}));
        } else {
            await chatForAgentWithComedy(ctx, zeus, `(GREEK GOD HOA: You are Zeus. The mortal said: "${userInput}". Threaten to smite them with a lightning bolt for disrespecting the HOA board, but get distracted by something trivial.)`, async (s) => await ctx.callbacks.onSpeak(s, zeus, {}));
        }
    }
}

export async function runPirateShipBoardMeetingLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const ceoInstruction = "You are the 'Pirate CEO' (Captain). You are trying to run a very formal corporate board meeting about quarterly plundering goals, but you are still a pirate. You mix corporate jargon with pirate slang.";
    const hrInstruction = "You are the 'Pirate HR Rep'. You are concerned about workplace safety (scurvy, walking the plank) and proper plundering protocols. You are very bureaucratic.";


    await chatForAgentWithComedy(ctx, 'philosopher', "Arrgh, let's call this board meeting to order. Looking at our Q3 KPIs, our plundering margins are down 15%. We need to leverage our synergy on the high seas. Thoughts?", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { chatOptions: { hiddenInstruction: ceoInstruction } });

    await chatForAgentWithComedy(ctx, 'scientist', "Well, Captain, as HR, I must point out that morale is low. The mandated 'walk the plank' team-building exercise resulted in three unexcused absences. We need to pivot our retention strategy, matey.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { chatOptions: { hiddenInstruction: hrInstruction } });
}

export async function runUniversalZoningBoardLoop(_scenario: Scenario, ctx: ModeContext) {
    const chat = ctx.manager;

    const zoningInstruction1 = "You are 'Zoning Commissioner Zog'. You are obsessed with dimensional compliance. You hate when people build structures that overlap with the 4th dimension.";
    const zoningInstruction2 = "You are 'Zoning Inspector Xylar'. You care only about aesthetic guidelines across the multiverse. You think everything should be painted 'hyper-magenta'.";


    await chatForAgentWithComedy(ctx, 'philosopher', "We have a permit request here for a 'three-bedroom house' in Sector Earth. I see immediate violations. The garage clearly intersects with a pocket dimension. This violates the 4th Dimensional Spacing Act of 3042.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'philosopher', {});
    }, { chatOptions: { hiddenInstruction: zoningInstruction1 } });

    await chatForAgentWithComedy(ctx, 'scientist', "Not to mention the aesthetics! The proposed color is 'beige'. Beige is outlawed in 7 galaxies! If they don't paint it hyper-magenta to appease the plasma-moths, I'm vetoing the whole project.", async (sentence: string) => {
        await ctx.callbacks.onSpeak(sentence, 'scientist', {});
    }, { chatOptions: { hiddenInstruction: zoningInstruction2 } });
}

/**
 * HOA Board Meeting Mode
 * An HOA board fining the user for petty reasons.
 */
export async function runHOABoardMeetingLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📋 HOA BOARD MEETING: Your mailbox is non-compliant`, '#8e44ad');

    const pettyComplainer = 'comedian'; // Petty complaints
    const colorAnalyst = 'scientist'; // Hex-code analysis (Scientist)
    const existentialBoardMember = 'philosopher'; // The dramatic one

    await chatForAgentWithComedy(ctx, pettyComplainer, `(You are the head of the HOA. Berate the user because their trash cans were left outside for exactly 4 minutes past the designated retrieval time.)`, async (s) => await ctx.callbacks.onSpeak(s, pettyComplainer, {}));

    await chatForAgentWithComedy(ctx, colorAnalyst, `(You are the HOA's architectural reviewer. Mathematically prove that the paint on the user's front door is "Eggshell" instead of the approved "Alabaster White" using hex codes.)`, async (s) => await ctx.callbacks.onSpeak(s, colorAnalyst, {}));

    await chatForAgentWithComedy(ctx, existentialBoardMember, `(You are a dramatic HOA board member. Explain how the user's unkempt petunias are single-handedly destroying the fabric of the entire community.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialBoardMember, {}));
}



/**
 * Superhero HR Department Mode
 * HR representatives for a superhero team have to deal with the collateral damage and bizarre workplace complaints.
 */
export async function runSuperheroHRDepartmentLoop(scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '🦸 SUPERHERO HR DEPARTMENT: Dealing with collateral damage', '#e74c3c');

    const strictHR = 'scientist'; // Qwen2.5 for the strict superhero HR
    const defensiveHero = 'comedian'; // Hermes-3 for the defensive superhero

    // 1. Setup
    await chatForAgentWithComedy(ctx, strictHR, `(SUPERHERO HR: You are the strict HR representative for a superhero team. The User is a civilian filing a complaint. Welcome them, then immediately call in the superhero responsible for the collateral damage to answer for their actions.)`, async (s) => await ctx.callbacks.onSpeak(s, strictHR, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Civilian (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Defensive Superhero Reacts
            await chatForAgentWithComedy(ctx, defensiveHero, `(SUPERHERO HR: The civilian just complained: "${userInput}". You are the defensive superhero. Deny responsibility, blame supervillains, or claim the destruction of their car was "necessary for the greater good".)`, async (s) => await ctx.callbacks.onSpeak(s, defensiveHero, {}));
        } else {
            // Strict HR Intervenes
            await chatForAgentWithComedy(ctx, strictHR, `(SUPERHERO HR: The civilian said: "${userInput}". You are the strict HR representative. Validate their complaint using overly bureaucratic corporate jargon, then scold the superhero for violating the "Minimal Property Damage Clause" of their contract.)`, async (s) => await ctx.callbacks.onSpeak(s, strictHR, {}));
        }
    }
}
