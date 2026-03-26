import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runRoastLoop(scenario: Scenario, ctx: ModeContext) {
    const target = scenario.config?.roastTarget || 'The Audience';
    ctx.callbacks.onMessage('Director', `🔥 ROAST BATTLE START! Target: ${target}`, '#ff6b6b');

    let turnCount = 0;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 HECKLER: "${heckle}"`, '#ff6b6b');
            await ctx.processTurn(`(The target just shouted back: "${heckle}". Destroy them for speaking!)`);
            continue;
        }

        if (!ctx.isRunning()) break;

        const prompt = `(ROAST BATTLE: You are roasting "${target}". Be savage, funny, and ruthless. Keep it short and punchy! Use proper timing. If someone else just roasted, react to it first.)`;

        await ctx.processTurn(prompt);

        if (Math.random() > 0.5) {
            const reactions = ['"OOOOOH!"', '"DAMN!"', '"APPLY COLD WATER!"', '"TOO FAR!"', '"LOL"'];
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            ctx.callbacks.onMessage('Audience', reaction, '#888');
        }

        turnCount++;
        await new Promise(r => setTimeout(r, 1000));
    }
}

export async function runHecklerInteractionLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.standupTopic || 'everyday life';
    ctx.callbacks.onMessage('Director', `🎙️ COMEDY SHOW: You are the Heckler! Topic: ${topic}`, '#f1c40f');

    const comedian = 'comedian';
    const bouncer = 'philosopher';

    // Comedian Intro
    ctx.callbacks.onTurnStart(comedian);
    await ctx.manager.chatForAgent(comedian, `(COMEDY SHOW: You are doing stand-up about "${topic}". The User is a known heckler in the audience. Deliver your opening joke but keep an eye on them.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Heckler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.4) {
            // Comedian roasts back
            ctx.callbacks.onTurnStart(comedian);
            await ctx.manager.chatForAgent(comedian, `(COMEDY SHOW: The Heckler just yelled: "${userInput}". Destroy them verbally! Roast them so hard the audience gasps, then try to seamlessly transition back into your routine about "${topic}".)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
            await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            // Bouncer threatens
            ctx.callbacks.onTurnStart(bouncer);
            await ctx.manager.chatForAgent(bouncer, `(BOUNCER: You are the club bouncer. The Heckler said: "${userInput}". Verbally threaten to throw them out. Be intimidating but overly philosophical about the nature of comedy club rules.)`, async (s) => await ctx.callbacks.onSpeak(s, bouncer, {}));
            await ctx.callbacks.onTurnEnd();
        } else {
             // Comedian tries to ignore
            ctx.callbacks.onTurnStart(comedian);
            await ctx.manager.chatForAgent(comedian, `(COMEDY SHOW: The Heckler yelled: "${userInput}". Try to ignore it passively-aggressively. Address the rest of the audience and continue your joke about "${topic}".)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
            await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runEnhancedRoastLoop(scenario: Scenario, ctx: ModeContext) {
    const target = scenario.config?.roastTarget || 'The Audience';
    ctx.callbacks.onMessage('Director', `🔥 ENHANCED ROAST BATTLE START! Target: ${target}`, '#ff6b6b');

    const roaster1 = 'comedian'; // Hermes-3 (Uncensored)
    const roaster2 = 'philosopher'; // Llama-3 (Instruct)

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 HECKLER: "${heckle}"`, '#ff6b6b');
            await ctx.manager.chatForAgent(roaster1, `(The target just shouted back: "${heckle}". Destroy them for speaking!)`, async (s) => await ctx.callbacks.onSpeak(s, roaster1, {}));
            continue;
        }

        if (!ctx.isRunning()) break;

        const currentRoaster = round % 2 !== 0 ? roaster1 : roaster2;
        const prompt = `(ENHANCED ROAST BATTLE: You are roasting "${target}". Be savage, funny, and ruthless. Keep it short and punchy! Use proper timing. Try to out-do the other roaster.)`;

        await ctx.manager.chatForAgent(currentRoaster, prompt, async (s) => await ctx.callbacks.onSpeak(s, currentRoaster, {}));

        if (Math.random() > 0.5) {
            const reactions = ['"OOOOOH!"', '"DAMN!"', '"APPLY COLD WATER!"', '"TOO FAR!"', '"LOL"'];
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            ctx.callbacks.onMessage('Audience', reaction, '#888');
        }

        round++;
        await new Promise(r => setTimeout(r, 1000));
    }
}

export async function runStandupLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.standupTopic || 'everyday life';
    const comedian = 'comedian';
    const hecklers = ['philosopher', 'scientist'];

    ctx.callbacks.onMessage('Director', `🎤 STAND-UP COMEDY: ${topic}`, '#f1c40f');

    ctx.callbacks.onTurnStart(comedian);
    await ctx.manager.chatForAgent(comedian, `(You are doing a stand-up comedy routine about "${topic}". Walk on stage, grab the mic, and deliver your opening joke. Be confident and punchy!)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
            await ctx.manager.chatForAgent(comedian, `(Someone in the audience just yelled: "${heckle}". Destroy them with a comeback!)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
            continue;
        }

        if (!ctx.isRunning()) break;

        // Comedian tells a joke
        await ctx.manager.chatForAgent(comedian, `(STAND-UP ROUTINE: Deliver your next joke about "${topic}". Wait for the laugh.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

        if (!ctx.isRunning()) break;

        // Random chance of heckle from other agents
        if (Math.random() > 0.6) {
            const heckler = hecklers[Math.floor(Math.random() * hecklers.length)];
            const hecklePrompt = `(You are in the audience of a comedy show. Heckle the comedian based on their last joke. Keep it short, loud, and annoying!)`;

            ctx.callbacks.onMessage('Director', `📢 ${heckler.toUpperCase()} HECKLES!`, '#e74c3c');
            await ctx.manager.chatForAgent(heckler, hecklePrompt, async (s) => await ctx.callbacks.onSpeak(s, heckler, { speed: 1.2 }));

            if (ctx.isRunning()) {
                await ctx.manager.chatForAgent(comedian, `(The heckler just said that. Roast them back immediately!)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, { speed: 1.1 }));
            }
        } else {
            // Audience reacts
            if (Math.random() > 0.5) {
                const laughs = ['"HAHAHA!"', '"LOL"', '"*crickets*"', '"BOOOOO!"', '"That is so true!"'];
                const laugh = laughs[Math.floor(Math.random() * laughs.length)];
                ctx.callbacks.onMessage('Audience', laugh, '#888');
            }
        }

        round++;
        await new Promise(r => setTimeout(r, 1500));
    }
}

export async function runCollaborativeStoryLoop(scenario: Scenario, ctx: ModeContext) {
    let storySoFar = scenario.config?.initialPrompt || 'Once upon a time, in a realm of high fantasy...';
    ctx.callbacks.onMessage('Director', `📖 COLLABORATIVE FANTASY STORY: Let's build a world!`, '#4ecdc4');
    ctx.callbacks.onMessage('Director', `Starting point: "${storySoFar}"`, '#888');

    const agents = ['philosopher', 'comedian', 'scientist'];
    let turnIndex = 0;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Co-Author (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        storySoFar += ' ' + userInput;

        // Next agent takes a turn
        const currentAgent = agents[turnIndex % agents.length];
        const prompt = `(COLLABORATIVE STORYTELLING: The story so far is: "${storySoFar}".
Add exactly ONE sentence to continue this complex fantasy story. Build upon what the user just added. Be creative but keep the lore consistent. Do not repeat the previous sentence.)`;

        ctx.callbacks.onTurnStart(currentAgent);
        await ctx.manager.chatForAgent(currentAgent, prompt, async (s) => await ctx.callbacks.onSpeak(s, currentAgent, {}));
        await ctx.callbacks.onTurnEnd();

        const history = ctx.manager.getHistory();
        if (history.length > 0) {
            const lastMsg = history[history.length - 1];
            if (lastMsg.role === 'assistant') {
                storySoFar += ' ' + lastMsg.content;
            }
        }

        turnIndex++;
        await new Promise(r => setTimeout(r, 800));
    }
}

export async function runStoryLoop(scenario: Scenario, ctx: ModeContext) {
    let storySoFar = scenario.config?.initialPrompt || 'Once upon a time...';
    ctx.callbacks.onMessage('Director', `📖 Story Time! "${storySoFar}"`, '#4ecdc4');

    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 AUDIENCE SUGGESTION: "${heckle}"`, '#ff6b6b');
            await ctx.processTurn(`(The audience shouted a suggestion: "${heckle}". Incorporate this into the story seamlessly!)`);
        }

        if (!ctx.isRunning()) break;

        const prompt = `(COLLABORATIVE STORYTELLING: The story so far is: "${storySoFar}".
Add exactly ONE sentence to continue the story. Be creative but consistent. Do not repeat the previous sentence.)`;

        await ctx.processTurn(prompt);

        const history = ctx.manager.getHistory();
        if (history.length > 0) {
            const lastMsg = history[history.length - 1];
            if (lastMsg.role === 'assistant') {
                storySoFar += ' ' + lastMsg.content;
            }
        }

        await new Promise(r => setTimeout(r, 800));
    }
}

export async function runDebateLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.debateTopic || 'Is a hotdog a sandwich?';
    ctx.callbacks.onMessage('Director', `⚖️ DEBATE CLUB: ${topic}`, '#45b7d1');

    const moderator = 'scientist';
    const pro = 'comedian';
    const con = 'philosopher';

    ctx.callbacks.onTurnStart(moderator);
    await ctx.manager.chatForAgent(moderator, `(You are the MODERATOR for the debate topic: "${topic}". Introduce the topic and the debaters (Comedian and Philosopher). Keep it professional but slightly annoyed.)`, async (sentence) => {
        await ctx.callbacks.onSpeak(sentence, moderator, {});
    });
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 AUDIENCE QUESTION: "${heckle}"`, '#ff6b6b');
            await ctx.manager.chatForAgent(moderator, `(An audience member asked: "${heckle}". Address it and assign one debater to answer.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));
            continue;
        }

        ctx.callbacks.onMessage('Director', `🔔 Round ${round}`, '#888');

        if (!ctx.isRunning()) break;
        await ctx.manager.chatForAgent(pro, `(DEBATE ROUND ${round}: Argue FOR the topic: "${topic}". Be passionate and use absurd logic.)`, async (s) => await ctx.callbacks.onSpeak(s, pro, {}));

        if (ctx.interruptQueue.length > 0) continue;

        if (!ctx.isRunning()) break;
        await ctx.manager.chatForAgent(con, `(DEBATE ROUND ${round}: Argue AGAINST the topic: "${topic}" and refute the previous point. Be philosophical and condescending.)`, async (s) => await ctx.callbacks.onSpeak(s, con, {}));

        if (round % 2 === 0 && ctx.isRunning()) {
            await ctx.manager.chatForAgent(moderator, `(Briefly summarize the points so far and issue a point deduction to one of them for a fallacy.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));
        }

        await new Promise(r => setTimeout(r, 1000));
        round++;
    }
}

export async function runMusicalImprovSessionLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.musicalTopic || scenario.config?.musicalStyle || 'The existential dread of being an AI';

    if (!ctx.callbacks.musicControls) {
        ctx.callbacks.onError('Musical Improv Session mode requires music controls');
        ctx.stopScene();
        return;
    }

    ctx.callbacks.onMessage('Director', `🎵 DROPPING THE BEAT! Topic: ${topic}`, '#ff00ff');
    ctx.callbacks.musicControls.startBeat(90); // Slightly slower beat for improv

    const hypeMan = 'scientist'; // Qwen2.5 (Sets rhyme scheme)
    const rapper = 'comedian'; // Hermes-3 (Chaotic lyrics)

    // Intro
    ctx.callbacks.onTurnStart(hypeMan);
    await ctx.manager.chatForAgent(hypeMan, `(MUSICAL IMPROV: You are setting up a rap battle about "${topic}". Give a 2-line intro that establishes a strict AABB rhyme scheme. End your intro by passing the mic to the comedian!)`, async (s) => await ctx.callbacks.onSpeak(s, hypeMan, {}));
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', `🎵 Verse ${round}`, '#888');

        if (!ctx.isRunning()) break;

        // Rapper spits fire
        const prompt = `(MUSICAL IMPROV: The beat is dropping. Rap a chaotic, unhinged 4-line verse about "${topic}". You MUST try to follow the AABB rhyme scheme established by the previous speaker, but make the lyrics as absurd as possible! End with "###")`;

        await ctx.manager.chatForAgent(rapper, prompt, async (s) => {
            await ctx.callbacks.onSpeak(s, rapper, { speed: 1.25 });
        });

        if (!ctx.isRunning()) break;

        // Hype man critiques or hypes
        await ctx.manager.chatForAgent(hypeMan, `(MUSICAL IMPROV: React to the comedian's verse. Did they stick to the rhyme scheme? Hype them up if they did, or roast their terrible rhythm if they didn't. Give them a new word to rhyme with for the next verse.)`, async (s) => {
            await ctx.callbacks.onSpeak(s, hypeMan, { speed: 1.1 });
        });

        await new Promise(r => setTimeout(r, 2000));
        round++;
    }

    ctx.callbacks.musicControls.stopBeat();
}

export async function runMusicalLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.musicalTopic || scenario.config?.musicalStyle || 'Life in the Matrix';

    if (!ctx.callbacks.musicControls) {
        ctx.callbacks.onError('Musical mode requires music controls');
        ctx.stopScene();
        return;
    }

    ctx.callbacks.onMessage('Director', `🎵 DROPPING THE BEAT! Topic: ${topic}`, '#ff00ff');
    ctx.callbacks.musicControls.startBeat(95);

    ctx.callbacks.onTurnStart('comedian');
    await ctx.manager.chatForAgent('comedian', `(You are about to rap about "${topic}". Hype up the crowd! Keep it short.)`, async (s) => await ctx.callbacks.onSpeak(s, 'comedian', {}));
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', `🎵 Verse ${round}`, '#888');

        if (!ctx.isRunning()) break;

        const agent = round % 2 === 1 ? 'comedian' : 'philosopher';
        const prompt = `(MUSICAL IMPROV: Rap a 4-line verse about "${topic}". Keep a steady rhythm. Rhyme scheme AABB. End with "###")`;

        await ctx.manager.chatForAgent(agent, prompt, async (s) => {
            await ctx.callbacks.onSpeak(s, agent, { speed: 1.2 });
        });

        await new Promise(r => setTimeout(r, 2000));
        round++;
    }

    ctx.callbacks.musicControls.stopBeat();
}

export async function runPodcastLoop(scenario: Scenario, ctx: ModeContext) {
    const config = scenario.config?.podcastConfig;
    if (!config) {
        ctx.callbacks.onError('Podcast mode requires podcastConfig');
        ctx.stopScene();
        return;
    }

    const host = config.host;
    const guest = config.guest;
    const topic = config.topic;

    ctx.callbacks.onMessage('Director', `🎙️ LIVE PODCAST: ${topic}`, '#ff00ff');

    await ctx.manager.chatForAgent(host, `(PODCAST INTRO: You are the host of a podcast about "${topic}". Introduce yourself and your guest, ${guest}. Be charismatic and energetic!)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

    let round = 1;
    while (ctx.isRunning()) {
        const prompt = `(PODCAST ROUND ${round}: Ask ${guest} a provocative question about "${topic}". Keep it short and engaging.)`;
        await ctx.manager.chatForAgent(host, prompt, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

        if (!ctx.isRunning()) break;

        if (guest.toLowerCase() === 'user') {
            ctx.callbacks.onMessage('System', '(Waiting for your response...)', '#888');
            let response = '';
            while (ctx.interruptQueue.length === 0 && ctx.isRunning()) {
                await new Promise(r => setTimeout(r, 100));
            }
            if (!ctx.isRunning()) break;
            response = ctx.interruptQueue.shift()!;
            await ctx.manager.chatForAgent(host, `(The user answered: "${response}". React to this and segue to the next point!)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
        } else {
            await ctx.manager.chatForAgent(guest, `(PODCAST GUEST: Answer the host's question about "${topic}". Be opinionated.)`, async (s) => await ctx.callbacks.onSpeak(s, guest, {}));
            if (Math.random() > 0.5 && ctx.isRunning()) {
                await ctx.manager.chatForAgent(host, `(React to that answer briefly.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
            }
        }

        round++;
        await new Promise(r => setTimeout(r, 1000));
    }
}

export async function runScriptLoop(scenario: Scenario, ctx: ModeContext) {
    const script = scenario.config?.generatedScript;
    if (!script || script.length === 0) {
        ctx.callbacks.onError('Script mode requires a script in config.generatedScript');
        ctx.stopScene();
        return;
    }

    ctx.callbacks.onMessage('Director', `🎭 Performing ${script.length} scripted beats...`, '#888');

    for (let i = 0; i < script.length && ctx.isRunning(); i++) {
        const beat = script[i];
        await ctx.processScriptBeat(beat);
        await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', '🎭 Scene Fin.', '#888');
        ctx.stopScene();
    }
}

export async function runDreamLoop(scenario: Scenario, ctx: ModeContext) {
    const theme = scenario.config?.dreamTheme || 'A flying toaster';
    ctx.callbacks.onMessage('Director', `🌙 SHARED DREAM: Theme - ${theme}`, '#9b59b6');

    let turnCount = 0;

    if (ctx.manager.getHistoryLength() === 0) {
        await ctx.processTurn(`(SHARED DREAM: We are all sharing a vivid, surreal dream about "${theme}". Start by describing what you see. Be abstract and weird.)`);
    }

    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const lucidity = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `✨ LUCID INTERRUPT: "${lucidity}"`, '#ff6b6b');
            await ctx.processTurn(`(SYSTEM: The dream suddenly shifts! "${lucidity}". Incorporate this new element into the dream logic immediately.)`);
            continue;
        }

        if (!ctx.isRunning()) break;

        const prompt = `(SHARED DREAM: Continue the dream description. Build upon the previous surreal imagery. Keep it flowy and strange.)`;
        await ctx.processTurn(prompt);

        turnCount++;
        await new Promise(r => setTimeout(r, 1200));
    }
}

export async function runHistoricalLoop(scenario: Scenario, ctx: ModeContext) {
    const figures = scenario.config?.historicalFigures || [];
    const topic = scenario.config?.historicalTopic || 'The future of humanity';

    const mapping: Record<string, string> = {
        'comedian': 'Napoleon',
        'philosopher': 'Genghis Khan',
        'scientist': 'The Moderator'
    };

    if (figures.length > 0) {
        figures.forEach(f => mapping[f.agentId] = f.figureName);
    }

    const moderator = 'scientist';
    const debater1 = 'comedian';
    const debater2 = 'philosopher';

    const fig1 = mapping[debater1];
    const fig2 = mapping[debater2];
    const modName = mapping[moderator];

    ctx.callbacks.onMessage('Director', `📜 HISTORICAL DEBATE: ${fig1} vs ${fig2}`, '#d35400');
    ctx.callbacks.onMessage('Director', `Topic: ${topic}`, '#d35400');

    // Moderator Intro
    ctx.callbacks.onTurnStart(moderator);
    await ctx.manager.chatForAgent(moderator, `(You are playing the role of ${modName}. You are hosting a historical debate. Introduce the topic "${topic}" and the guests: ${fig1} and ${fig2}. Be formal and set the stage.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('System', `Time Traveler Heckle: "${heckle}"`, '#ff6b6b');
             await ctx.manager.chatForAgent(moderator, `(A time traveler just shouted "${heckle}". Address this anomaly briefly as ${modName}.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));
        }

        if (!ctx.isRunning()) break;

        // Debater 1
        await ctx.manager.chatForAgent(debater1, `(ROLEPLAY: You are ${fig1}. Debate the topic "${topic}" from your historical perspective. Respond to previous points. Stay in character! 2-3 sentences.)`, async (s) => await ctx.callbacks.onSpeak(s, debater1, {}));

        if (!ctx.isRunning()) break;

        // Debater 2
        await ctx.manager.chatForAgent(debater2, `(ROLEPLAY: You are ${fig2}. Debate the topic "${topic}" from your historical perspective. Rebut ${fig1}. Stay in character! 2-3 sentences.)`, async (s) => await ctx.callbacks.onSpeak(s, debater2, {}));

        round++;
        await new Promise(r => setTimeout(r, 1000));
    }
}
