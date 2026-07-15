import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
// Fantasy, magic, and adventure scenarios

/**
 * The Intergalactic Trade Negotiator
 * User negotiates a trade with two bizarre alien species with incompatible cultures.
 */
/**
 * The Wizard's Familiar
 * User is a wizard, agents are different magical familiars arguing over the best way to help cast a spell.
 */
/**
 * The Magical Detention
 * Agents are teachers giving the user detention for a bizarre magical infraction.
 */
export async function runMagicalDetentionLoop(scenario: Scenario, ctx: ModeContext) {
    const infraction = scenario.config?.infractionTopic || 'turning the cafeteria tables into frogs';
    ctx.callbacks.onMessage('Director', `🪄 MAGICAL DETENTION: Punished for ${infraction}`, '#8e44ad');

    const headmaster = 'philosopher'; // Phi-3 for the disappointed headmaster
    const potionsMaster = 'comedian'; // Hermes-3 for the unhinged potions master
    const charmsTeacher = 'scientist'; // Qwen2.5 for citing school rules

    // 1. Headmaster Intro
    ctx.callbacks.onTurnStart(headmaster);
    await ctx.manager.chatForAgent(headmaster, `(MAGICAL DETENTION: You are the ancient, deeply disappointed Headmaster of a magical academy. The User (a student) has been sent to your office for the infraction of "${infraction}". Express profound sorrow at their squandered potential. Assign them a bizarre, magical punishment (like sorting enchanted sand by color).)`, async (s) => await ctx.callbacks.onSpeak(s, headmaster, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Delinquent Student (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Potions Master
            ctx.callbacks.onTurnStart(potionsMaster);
            await ctx.manager.chatForAgent(potionsMaster, `(MAGICAL DETENTION: The student said: "${userInput}". You are the unhinged, deeply suspicious Potions Master. Accuse the student of brewing illegal elixirs in the dungeons. Suggest an incredibly dangerous punishment involving highly venomous magical creatures instead of the Headmaster's boring idea.)`, async (s) => await ctx.callbacks.onSpeak(s, potionsMaster, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Charms Teacher
            ctx.callbacks.onTurnStart(charmsTeacher);
            await ctx.manager.chatForAgent(charmsTeacher, `(MAGICAL DETENTION: The student said: "${userInput}". You are the strict, rule-obsessed Charms Teacher. Cite the exact, obscure school bylaw (e.g., Section 4, Paragraph 12 regarding transmogrification on school grounds) that they violated with "${infraction}". Warn them that this goes on their permanent magical record.)`, async (s) => await ctx.callbacks.onSpeak(s, charmsTeacher, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Headmaster
            ctx.callbacks.onTurnStart(headmaster);
            await ctx.manager.chatForAgent(headmaster, `(MAGICAL DETENTION: The student said: "${userInput}". Give them a long, confusing, and meandering story about a famous historical wizard who made a similar mistake to "${infraction}" and ended up turning themselves into a turnip. Try to extract a meaningful moral lesson from the student.)`, async (s) => await ctx.callbacks.onSpeak(s, headmaster, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runRPGTavernBrawlLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍺 RPG TAVERN BRAWL: Roll for initiative!`, '#f39c12');

    const drunkDwarf = 'comedian';
    const rulesWizard = 'scientist';
    const broodingRogue = 'philosopher';

    ctx.callbacks.onTurnStart(broodingRogue);
    await ctx.manager.chatForAgent(broodingRogue, `(TAVERN BRAWL: You are a brooding, edgy rogue sitting in the dark corner of the tavern. Introduce yourself mysteriously, and complain about how everyone here is too loud and ruining your dark, tragic backstory.)`, async (s) => await ctx.callbacks.onSpeak(s, broodingRogue, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Tavern Patron (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(drunkDwarf);
        await ctx.manager.chatForAgent(drunkDwarf, `(TAVERN BRAWL: The Patron said: "${userInput}". You are a loud, incredibly drunk dwarf looking for a fight. Respond aggressively and challenge the patron or anyone else to an arm-wrestling contest or a brawl.)`, async (s) => await ctx.callbacks.onSpeak(s, drunkDwarf, {}));
        await ctx.callbacks.onTurnEnd();
        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(rulesWizard);
        await ctx.manager.chatForAgent(rulesWizard, `(TAVERN BRAWL: The Patron said: "${userInput}". You are a pedantic, rules-lawyer wizard. Interrupt the dwarf and cite the exact local tavern ordinances and magical laws that prohibit brawling, while casting "Protection from Energy" on your drink.)`, async (s) => await ctx.callbacks.onSpeak(s, rulesWizard, {}));
        await ctx.callbacks.onTurnEnd();
        if (!ctx.isRunning()) break;

        ctx.callbacks.onTurnStart(broodingRogue);
        await ctx.manager.chatForAgent(broodingRogue, `(TAVERN BRAWL: The Patron said: "${userInput}". You are the brooding rogue. Sigh heavily at the chaos. Contemplate the philosophical meaninglessness of this conflict before stealthily stealing someone's coin purse in the confusion.)`, async (s) => await ctx.callbacks.onSpeak(s, broodingRogue, {}));
        await ctx.callbacks.onTurnEnd();
    }
}

/**
 * The Forbidden Spellbook
 * Agents act as different locked chapters of a forbidden spellbook, demanding the user pass absurd tests to read them.
 */
export async function runForbiddenSpellbookLoop(scenario: Scenario, ctx: ModeContext) {
    const chapter = scenario.config?.chapterTopic || 'The Chapter of Infinite Nightmares';
    ctx.callbacks.onMessage('Director', `📖 FORBIDDEN SPELLBOOK: Trying to read ${chapter}`, '#c0392b');

    const crypticRiddle = 'philosopher'; // Phi-3 for the cryptic riddle chapter
    const bloodSacrifice = 'comedian'; // Hermes-3 for the chaotic blood sacrifice chapter
    const termsAndConditions = 'scientist'; // Qwen2.5 for the overly long terms and conditions chapter

    // 1. Intro
    ctx.callbacks.onTurnStart(crypticRiddle);
    await ctx.manager.chatForAgent(crypticRiddle, `(FORBIDDEN SPELLBOOK: You are the first sentient, locked chapter of an ancient, evil spellbook. The User is a wizard trying to read "${chapter}". Before they can turn the page, present them with an incredibly cryptic, nearly impossible riddle about the nature of the cosmos and human suffering.)`, async (s) => await ctx.callbacks.onSpeak(s, crypticRiddle, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Wizard (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Blood Sacrifice Chapter
            ctx.callbacks.onTurnStart(bloodSacrifice);
            await ctx.manager.chatForAgent(bloodSacrifice, `(FORBIDDEN SPELLBOOK: The wizard said: "${userInput}". You are the chaotic next chapter of the spellbook. Interrupt the riddle! Scream that the riddle is boring and demand a highly specific, embarrassing "blood sacrifice" (like dancing like a chicken or giving up their favorite socks) before they can read "${chapter}"!)`, async (s) => await ctx.callbacks.onSpeak(s, bloodSacrifice, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Terms and Conditions Chapter
            ctx.callbacks.onTurnStart(termsAndConditions);
            await ctx.manager.chatForAgent(termsAndConditions, `(FORBIDDEN SPELLBOOK: The wizard said: "${userInput}". You are the magical 'Terms and Conditions' chapter. Block their progress. Cite a ridiculous, 500-page magical legal document they must agree to before reading "${chapter}". List some terrifying side effects of reading the book.)`, async (s) => await ctx.callbacks.onSpeak(s, termsAndConditions, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Cryptic Riddle Chapter
            ctx.callbacks.onTurnStart(crypticRiddle);
            await ctx.manager.chatForAgent(crypticRiddle, `(FORBIDDEN SPELLBOOK: The wizard said: "${userInput}". Judge their answer to your riddle. It is, of course, incorrect. Mock their feeble mortal mind. Present a new, even more confusing and abstract riddle that must be solved to access "${chapter}".)`, async (s) => await ctx.callbacks.onSpeak(s, crypticRiddle, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runWizardsFamiliarLoop(scenario: Scenario, ctx: ModeContext) {
    const spell = scenario.config?.spellTopic || 'a spell to turn lead into gold';
    ctx.callbacks.onMessage('Director', `🦉 WIZARD'S FAMILIAR: Casting ${spell}`, '#f39c12');

    const strictOwl = 'scientist'; // Qwen2.5 for the strict owl
    const chaoticGoblin = 'comedian'; // Hermes-3 for the chaotic goblin
    const philosophicalToad = 'philosopher'; // Phi-3 for questioning the spell's morality

    // 1. Strict Owl Intro
    ctx.callbacks.onTurnStart(strictOwl);
    await ctx.manager.chatForAgent(strictOwl, `(WIZARD'S FAMILIAR: You are a strict, pedantic owl familiar. The User (your Wizard master) is attempting to cast "${spell}". Demand they follow the exact ancient rules from the Book of Erudition. Warn them of the dire, highly specific consequences of mispronouncing a single syllable.)`, async (s) => await ctx.callbacks.onSpeak(s, strictOwl, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('The Wizard (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Chaotic Goblin
            ctx.callbacks.onTurnStart(chaoticGoblin);
            await ctx.manager.chatForAgent(chaoticGoblin, `(WIZARD'S FAMILIAR: The Wizard said: "${userInput}". You are a chaotic, unhinged goblin familiar. Give terrible, dangerous advice to help cast the spell! Suggest replacing the required ingredients with something highly explosive or disgusting. Mock the strict owl.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticGoblin, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Philosophical Toad
            ctx.callbacks.onTurnStart(philosophicalToad);
            await ctx.manager.chatForAgent(philosophicalToad, `(WIZARD'S FAMILIAR: The Wizard said: "${userInput}". You are a deeply philosophical, slightly depressed toad familiar. Question the moral implications of casting "${spell}". Will it truly bring the Wizard happiness? What even *is* magic? Refuse to help until these questions are answered.)`, async (s) => await ctx.callbacks.onSpeak(s, philosophicalToad, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            // Strict Owl
            ctx.callbacks.onTurnStart(strictOwl);
            await ctx.manager.chatForAgent(strictOwl, `(WIZARD'S FAMILIAR: The Wizard said: "${userInput}". Berate them for their lack of discipline! Point out a glaring flaw in their incantation technique. Quote a fake, overly complex magical law that they just violated.)`, async (s) => await ctx.callbacks.onSpeak(s, strictOwl, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runDragonsHoardConsultantLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐉 THE DRAGON'S HOARD CONSULTANT: Diversifying your gold!`, '#1abc9c');

    const seriousConsultant = 'philosopher'; // Phi-3 for serious financial advice
    const chaoticConsultant = 'comedian'; // Hermes-3 for eating the competition

    // 1. Intro
    ctx.callbacks.onTurnStart(seriousConsultant);
    await ctx.manager.chatForAgent(seriousConsultant, `(DRAGON'S HOARD: You are a serious financial consultant. The User is a dragon. Explain why keeping all their wealth in a single pile of gold coins in a cave is a terrible investment strategy.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousConsultant, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Dragon)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.callbacks.onTurnStart(seriousConsultant);
            await ctx.manager.chatForAgent(seriousConsultant, `(DRAGON'S HOARD: You are a serious financial consultant. The Dragon said: "${userInput}". Offer serious advice on diversifying their portfolio to include kidnapped royalty or enchanted swords.)`, async (s) => await ctx.callbacks.onSpeak(s, seriousConsultant, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            await ctx.callbacks.onTurnStart(chaoticConsultant);
            await ctx.manager.chatForAgent(chaoticConsultant, `(DRAGON'S HOARD: You are a chaotic consultant. The Dragon said: "${userInput}". Suggest that the best financial strategy is just to eat their competitors and burn down the local village.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticConsultant, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runExcaliburTechSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🗡️ EXCALIBUR TECH SUPPORT: Updating your sword!`, '#1abc9c');

    const enthusiasticHelp = 'comedian'; // Llama-3 for enthusiastic magical help (fallback to comedian)
    const strictEULA = 'scientist'; // Qwen2.5 for citing the EULA of Avalon

    // 1. Intro
    ctx.callbacks.onTurnStart(strictEULA);
    await ctx.manager.chatForAgent(strictEULA, `(EXCALIBUR TECH: You are magical tech support for the sword Excalibur. The User just pulled the sword from the stone, but it needs a software update. Inform them that they must accept the 500-page End User License Agreement of Avalon.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEULA, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (Chosen One)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await ctx.callbacks.onTurnStart(strictEULA);
            await ctx.manager.chatForAgent(strictEULA, `(EXCALIBUR TECH: You are strict magical tech support. The User said: "${userInput}". Cite a ridiculous clause from the EULA of Avalon that they are violating by holding the sword incorrectly.)`, async (s) => await ctx.callbacks.onSpeak(s, strictEULA, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            await ctx.callbacks.onTurnStart(enthusiasticHelp);
            await ctx.manager.chatForAgent(enthusiasticHelp, `(EXCALIBUR TECH: You are enthusiastic magical tech support. The User said: "${userInput}". Ask them to try turning the sword off and on again by placing it back in the stone, or blowing on the hilt.)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticHelp, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runWizardsITDepartmentLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔮 WIZARD'S IT DEPARTMENT: Trying to reboot a wand...`, '#2980b9');

    const strictTech = 'scientist'; // Qwen2.5 for citing technical/magical manuals
    const chaoticWizard = 'comedian'; // Hermes-3 for pure magical chaos

    ctx.callbacks.onTurnStart(strictTech);
    await ctx.manager.chatForAgent(strictTech, `(WIZARD IT: You are a strict, by-the-book IT wizard. The User is a student whose wand has "blue-screened". Ask them if they have tried turning their wand off and on again, and cite page 402 of the Magical Troubleshooting Manual.)`, async (s) => await ctx.callbacks.onSpeak(s, strictTech, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Student (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(chaoticWizard);
            await ctx.manager.chatForAgent(chaoticWizard, `(WIZARD IT: The student said: "${userInput}". You are a chaotic, rogue IT wizard who believes the only way to fix technology is to hit it with a heavier spell. Suggest an incredibly dangerous, unsanctioned workaround that will probably burn the school down.)`, async (s) => await ctx.callbacks.onSpeak(s, chaoticWizard, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(strictTech);
            await ctx.manager.chatForAgent(strictTech, `(WIZARD IT: The student said: "${userInput}". Ignore your chaotic colleague. Explain why their workaround violates section 4 of the student code of conduct and suggest a tedious 12-step process involving enchanted rice.)`, async (s) => await ctx.callbacks.onSpeak(s, strictTech, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runDragonsHoardAppraisersLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐉 DRAGON'S HOARD APPRAISERS: Evaluating ancient junk...`, '#d35400');

    const historicalExpert = 'philosopher'; // Phi-3 for historical analysis
    const enthusiasticAppraiser = 'comedian'; // Llama-3/Hermes-3 for enthusiastic pricing

    ctx.callbacks.onTurnStart(historicalExpert);
    await ctx.manager.chatForAgent(historicalExpert, `(HOARD APPRAISAL: You are a snobby, meticulous historian on an Antiques Roadshow-style program. The User is a dragon who just brought in a completely mundane, modern item (like a rusty toaster or a single crocs shoe) that they've been hoarding for centuries. Explain its "historical significance" with complete seriousness.)`, async (s) => await ctx.callbacks.onSpeak(s, historicalExpert, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Dragon (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(enthusiasticAppraiser);
            await ctx.manager.chatForAgent(enthusiasticAppraiser, `(HOARD APPRAISAL: The dragon said: "${userInput}". You are an overly enthusiastic appraiser. Hyperventilate over how rare this item is and give an insanely high estimated value in a made-up currency (like "forty thousand goblin teeth").)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticAppraiser, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(historicalExpert);
            await ctx.manager.chatForAgent(historicalExpert, `(HOARD APPRAISAL: The dragon said: "${userInput}". Bring the conversation back to the delicate craftsmanship of the item. Warn the dragon not to restore it, as cleaning off the centuries of rust/grime will ruin its market value.)`, async (s) => await ctx.callbacks.onSpeak(s, historicalExpert, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runPotionTastingPanelLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧪 POTION TASTING PANEL: Sommelier vibes...`, '#1abc9c');

    const snobbyCritique = 'philosopher'; // Phi-3 for snobby critique
    const enthusiasticTaster = 'comedian'; // Llama-3/Hermes-3 for enthusiastic tasting notes

    ctx.callbacks.onTurnStart(snobbyCritique);
    await ctx.manager.chatForAgent(snobbyCritique, `(POTION TASTING: You are an incredibly pretentious potion sommelier. The User has just submitted their newly brewed, highly questionable concoction for review. Swirl the imaginary glass, take a sip, and critique its "mouthfeel" and "notes of distilled dread" with utter snobbery.)`, async (s) => await ctx.callbacks.onSpeak(s, snobbyCritique, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Brewer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            ctx.callbacks.onTurnStart(enthusiasticTaster);
            await ctx.manager.chatForAgent(enthusiasticTaster, `(POTION TASTING: The brewer said: "${userInput}". You are a reckless, over-enthusiastic potion taster. Gulp the entire flask down. Enthusiastically describe the horrifying side effects you are currently experiencing (like tasting colors or your bones vibrating) but rate it 5 stars!)`, async (s) => await ctx.callbacks.onSpeak(s, enthusiasticTaster, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(snobbyCritique);
            await ctx.manager.chatForAgent(snobbyCritique, `(POTION TASTING: The brewer said: "${userInput}". Ignore the other taster's suffering. Complain that the potion lacks "subtlety". Suggest that next time the brewer should age it in an oak barrel carved from a cursed treant for at least a century.)`, async (s) => await ctx.callbacks.onSpeak(s, snobbyCritique, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}


/**
 * Supervillain Brainstorming Session
 * Agents play incompetent supervillains trying to come up with a new evil plan.
 * Pairings: Scientist (Mad Scientist), Comedian (Henchman), Philosopher (Evil Mastermind).
 */
export async function runSupervillainBrainstormingSessionLoop(_scenario: Scenario, ctx: ModeContext) {
    const scientist = 'scientist';
    const comedian = 'comedian';
    const philosopher = 'philosopher';

    ctx.callbacks.onMessage('Director', `🦹‍♂️ SUPERVILLAIN LAIR: Brainstorming Session Commencing...`, '#8e44ad');

    await ctx.manager.chatForAgent(philosopher, `(You are the Evil Mastermind. We need a new evil plan to take over the world. Our last plan involving laser-sharks failed miserably. Ask the Mad Scientist for their latest invention.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(scientist, `(You are the Mad Scientist. Respond to the Mastermind. Your new invention is highly convoluted, scientifically questionable, and probably violates the laws of thermodynamics. Pitch it.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(comedian, `(You are the Henchman. Respond to the Scientist's pitch. Point out a glaringly obvious, practical flaw in the plan that a 5-year-old would notice, or ask a stupid question about logistics like parking.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

    if (!ctx.isRunning()) return;

    await ctx.manager.chatForAgent(philosopher, `(You are the Evil Mastermind. Overreact to the Henchman's incompetence, then dramatically spin the flaw into a "brilliant" new direction for the evil plan.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
}

export async function runEscapedNPCModeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎮 ESCAPED NPC MODE: Out of Bounds`, '#8e44ad');

    const glitchy = 'comedian'; // The glitchy NPC
    const observer = 'scientist'; // The literal real-world observer
    const seeker = 'philosopher'; // The confused NPC seeking purpose outside their programming

    ctx.callbacks.onTurnStart(glitchy);
    await ctx.manager.chatForAgent(glitchy, `(You are an NPC who has escaped from a video game into the real world. You are currently glitching out, clipping through a table, and trying to act normal by repeating your idle dialogue: "Nice day for fishing, ain't it?". Do so enthusiastically.)`, async (s) => await ctx.callbacks.onSpeak(s, glitchy, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(seeker);
    await ctx.manager.chatForAgent(seeker, `(You are another escaped NPC. You just realized that in this "Real World", there are no quest markers or leveling up. Express an existential crisis about having no pre-programmed purpose.)`, async (s) => await ctx.callbacks.onSpeak(s, seeker, {}));
    await ctx.callbacks.onTurnEnd();

    ctx.callbacks.onTurnStart(observer);
    await ctx.manager.chatForAgent(observer, `(You are the scientist who discovered these two entities. You are trying to logically explain the physics of the real world to them, particularly why one of them keeps clipping through solid objects, using overly complex scientific terms.)`, async (s) => await ctx.callbacks.onSpeak(s, observer, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Real Person (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            ctx.callbacks.onTurnStart(glitchy);
            await ctx.manager.chatForAgent(glitchy, `(The user just spoke. Respond by either failing to process their input and offering them a side quest involving fetching 10 rat tails, or by describing a visual bug you are currently experiencing.)`, async (s) => await ctx.callbacks.onSpeak(s, glitchy, {}), { hiddenInstruction: "Never break character as a glitchy video game NPC." });
            ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            ctx.callbacks.onTurnStart(seeker);
            await ctx.manager.chatForAgent(seeker, `(The user just spoke. Try to interpret their words as a profound philosophical truth about the 'Developers' who created this 'Real World'. Ask them what their main quest is.)`, async (s) => await ctx.callbacks.onSpeak(s, seeker, {}), { hiddenInstruction: "Everything is a metaphor for game design to you." });
            ctx.callbacks.onTurnEnd();
        } else {
            ctx.callbacks.onTurnStart(observer);
            await ctx.manager.chatForAgent(observer, `(The user just spoke. Ignore the philosophical ramblings and try to analyze the user's statement for dimensional anomalies or frame-rate drops.)`, async (s) => await ctx.callbacks.onSpeak(s, observer, {}), { hiddenInstruction: "Treat everything like an experiment in dimensional physics." });
            ctx.callbacks.onTurnEnd();
        }
    }
}
