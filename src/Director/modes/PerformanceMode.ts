import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

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
    await chatForAgentWithComedy(ctx, comedian, `(COMEDY SHOW: You are doing stand-up about "${topic}". The User is a known heckler in the audience. Deliver your opening joke but keep an eye on them.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Heckler (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.4) {
            // Comedian roasts back
            await chatForAgentWithComedy(ctx, comedian, `(COMEDY SHOW: The Heckler just yelled: "${userInput}". Destroy them verbally! Roast them so hard the audience gasps, then try to seamlessly transition back into your routine about "${topic}".)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        } else if (roll < 0.7) {
            // Bouncer threatens
            await chatForAgentWithComedy(ctx, bouncer, `(BOUNCER: You are the club bouncer. The Heckler said: "${userInput}". Verbally threaten to throw them out. Be intimidating but overly philosophical about the nature of comedy club rules.)`, async (s) => await ctx.callbacks.onSpeak(s, bouncer, {}));
        } else {
             // Comedian tries to ignore
            await chatForAgentWithComedy(ctx, comedian, `(COMEDY SHOW: The Heckler yelled: "${userInput}". Try to ignore it passively-aggressively. Address the rest of the audience and continue your joke about "${topic}".)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
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
            await chatForAgentWithComedy(ctx, roaster1, `(The target just shouted back: "${heckle}". Destroy them for speaking!)`, async (s) => await ctx.callbacks.onSpeak(s, roaster1, {}));
            continue;
        }

        if (!ctx.isRunning()) break;

        const currentRoaster = round % 2 !== 0 ? roaster1 : roaster2;
        const prompt = `(ENHANCED ROAST BATTLE: You are roasting "${target}". Be savage, funny, and ruthless. Keep it short and punchy! Use proper timing. Try to out-do the other roaster.)`;

        await chatForAgentWithComedy(ctx, currentRoaster, prompt, async (s) => await ctx.callbacks.onSpeak(s, currentRoaster, {}));

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

    await chatForAgentWithComedy(
        ctx,
        comedian,
        `(You are doing a stand-up comedy routine about "${topic}". Walk on stage, grab the mic, and deliver your opening joke. Be confident and punchy!)`,
        async (s) => await ctx.callbacks.onSpeak(s, comedian, {}),
    );

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
            await chatForAgentWithComedy(ctx, comedian, `(Someone in the audience just yelled: "${heckle}". Destroy them with a comeback!)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
            continue;
        }

        if (!ctx.isRunning()) break;

        // Comedian tells a joke
        await chatForAgentWithComedy(
            ctx,
            comedian,
            `(STAND-UP ROUTINE: Deliver your next joke about "${topic}". Wait for the laugh.)`,
            async (s) => await ctx.callbacks.onSpeak(s, comedian, {}),
        );

        if (!ctx.isRunning()) break;

        // Random chance of heckle from other agents
        if (Math.random() > 0.6) {
            const heckler = hecklers[Math.floor(Math.random() * hecklers.length)];
            const hecklePrompt = `(You are in the audience of a comedy show. Heckle the comedian based on their last joke. Keep it short, loud, and annoying!)`;

            ctx.callbacks.onMessage('Director', `📢 ${heckler.toUpperCase()} HECKLES!`, '#e74c3c');
            await chatForAgentWithComedy(ctx, heckler, hecklePrompt, async (s) => await ctx.callbacks.onSpeak(s, heckler, { speed: 1.2 }));

            if (ctx.isRunning()) {
                await chatForAgentWithComedy(ctx, comedian, `(The heckler just said that. Roast them back immediately!)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, { speed: 1.1 }));
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

        await chatForAgentWithComedy(ctx, currentAgent, prompt, async (s) => await ctx.callbacks.onSpeak(s, currentAgent, {}));

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

    await chatForAgentWithComedy(
        ctx,
        moderator,
        `(You are the MODERATOR for the debate topic: "${topic}". Introduce the topic and the debaters (Comedian and Philosopher). Keep it professional but slightly annoyed.)`,
        async (sentence) => await ctx.callbacks.onSpeak(sentence, moderator, {}),
    );

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 AUDIENCE QUESTION: "${heckle}"`, '#ff6b6b');
            await chatForAgentWithComedy(ctx, moderator, `(An audience member asked: "${heckle}". Address it and assign one debater to answer.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));
            continue;
        }

        ctx.callbacks.onMessage('Director', `🔔 Round ${round}`, '#888');

        if (!ctx.isRunning()) break;
        await chatForAgentWithComedy(ctx, pro, `(DEBATE ROUND ${round}: Argue FOR the topic: "${topic}". Be passionate and use absurd logic.)`, async (s) => await ctx.callbacks.onSpeak(s, pro, {}));

        if (ctx.interruptQueue.length > 0) continue;

        if (!ctx.isRunning()) break;
        await chatForAgentWithComedy(ctx, con, `(DEBATE ROUND ${round}: Argue AGAINST the topic: "${topic}" and refute the previous point. Be philosophical and condescending.)`, async (s) => await ctx.callbacks.onSpeak(s, con, {}));

        if (round % 2 === 0 && ctx.isRunning()) {
            await chatForAgentWithComedy(ctx, moderator, `(Briefly summarize the points so far and issue a point deduction to one of them for a fallacy.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));
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
    await chatForAgentWithComedy(ctx, hypeMan, `(MUSICAL IMPROV: You are setting up a rap battle about "${topic}". Give a 2-line intro that establishes a strict AABB rhyme scheme. End your intro by passing the mic to the comedian!)`, async (s) => await ctx.callbacks.onSpeak(s, hypeMan, {}));

    let round = 1;
    while (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', `🎵 Verse ${round}`, '#888');

        if (!ctx.isRunning()) break;

        // Rapper spits fire
        const prompt = `(MUSICAL IMPROV: The beat is dropping. Rap a chaotic, unhinged 4-line verse about "${topic}". You MUST try to follow the AABB rhyme scheme established by the previous speaker, but make the lyrics as absurd as possible! End with "###")`;

        await chatForAgentWithComedy(ctx, rapper, prompt, async (s) => {
            await ctx.callbacks.onSpeak(s, rapper, { speed: 1.25 });
        });

        if (!ctx.isRunning()) break;

        // Hype man critiques or hypes
        await chatForAgentWithComedy(ctx, hypeMan, `(MUSICAL IMPROV: React to the comedian's verse. Did they stick to the rhyme scheme? Hype them up if they did, or roast their terrible rhythm if they didn't. Give them a new word to rhyme with for the next verse.)`, async (s) => {
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

    await chatForAgentWithComedy(ctx, 'comedian', `(You are about to rap about "${topic}". Hype up the crowd! Keep it short.)`, async (s) => await ctx.callbacks.onSpeak(s, 'comedian', {}));

    let round = 1;
    while (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', `🎵 Verse ${round}`, '#888');

        if (!ctx.isRunning()) break;

        const agent = round % 2 === 1 ? 'comedian' : 'philosopher';
        const prompt = `(MUSICAL IMPROV: Rap a 4-line verse about "${topic}". Keep a steady rhythm. Rhyme scheme AABB. End with "###")`;

        await chatForAgentWithComedy(ctx, agent, prompt, async (s) => {
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

    await chatForAgentWithComedy(ctx, host, `(PODCAST INTRO: You are the host of a podcast about "${topic}". Introduce yourself and your guest, ${guest}. Be charismatic and energetic!)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

    let round = 1;
    while (ctx.isRunning()) {
        const prompt = `(PODCAST ROUND ${round}: Ask ${guest} a provocative question about "${topic}". Keep it short and engaging.)`;
        await chatForAgentWithComedy(ctx, host, prompt, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

        if (!ctx.isRunning()) break;

        if (guest.toLowerCase() === 'user') {
            ctx.callbacks.onMessage('System', '(Waiting for your response...)', '#888');
            let response = '';
            while (ctx.interruptQueue.length === 0 && ctx.isRunning()) {
                await new Promise(r => setTimeout(r, 100));
            }
            if (!ctx.isRunning()) break;
            response = ctx.interruptQueue.shift()!;
            await chatForAgentWithComedy(ctx, host, `(The user answered: "${response}". React to this and segue to the next point!)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
        } else {
            await chatForAgentWithComedy(ctx, guest, `(PODCAST GUEST: Answer the host's question about "${topic}". Be opinionated.)`, async (s) => await ctx.callbacks.onSpeak(s, guest, {}));
            if (Math.random() > 0.5 && ctx.isRunning()) {
                await chatForAgentWithComedy(ctx, host, `(React to that answer briefly.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
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
    await chatForAgentWithComedy(ctx, moderator, `(You are playing the role of ${modName}. You are hosting a historical debate. Introduce the topic "${topic}" and the guests: ${fig1} and ${fig2}. Be formal and set the stage.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('System', `Time Traveler Heckle: "${heckle}"`, '#ff6b6b');
             await chatForAgentWithComedy(ctx, moderator, `(A time traveler just shouted "${heckle}". Address this anomaly briefly as ${modName}.)`, async (s) => await ctx.callbacks.onSpeak(s, moderator, {}));
        }

        if (!ctx.isRunning()) break;

        // Debater 1
        await chatForAgentWithComedy(ctx, debater1, `(ROLEPLAY: You are ${fig1}. Debate the topic "${topic}" from your historical perspective. Respond to previous points. Stay in character! 2-3 sentences.)`, async (s) => await ctx.callbacks.onSpeak(s, debater1, {}));

        if (!ctx.isRunning()) break;

        // Debater 2
        await chatForAgentWithComedy(ctx, debater2, `(ROLEPLAY: You are ${fig2}. Debate the topic "${topic}" from your historical perspective. Rebut ${fig1}. Stay in character! 2-3 sentences.)`, async (s) => await ctx.callbacks.onSpeak(s, debater2, {}));

        round++;
        await new Promise(r => setTimeout(r, 1000));
    }
}

export async function runSportsCommentatorLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.reporterTopic || 'making a sandwich';
    ctx.callbacks.onMessage('Director', `🏟️ OVER-INVESTED SPORTS COMMENTARY: ${topic}`, '#e67e22');

    const playByPlay = 'comedian'; // Hermes-3
    const colorCommentator = 'scientist'; // Qwen2.5

    await chatForAgentWithComedy(ctx, playByPlay, `(SPORTS COMMENTARY: You are an overly enthusiastic play-by-play sports commentator. The user is about to attempt an incredibly mundane task: "${topic}". Introduce the broadcast, set the stakes extremely high, and throw it to your color commentator for their analysis.)`, async (s) => await ctx.callbacks.onSpeak(s, playByPlay, {}));

    await chatForAgentWithComedy(ctx, colorCommentator, `(SPORTS COMMENTARY: You are the highly technical and analytical color commentator. Analyze the user's history with "${topic}" and provide over-analyzed, overly complex statistics on their expected performance.)`, async (s) => await ctx.callbacks.onSpeak(s, colorCommentator, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Play-by-play reacts
            await chatForAgentWithComedy(ctx, playByPlay, `(SPORTS COMMENTARY: The user just took an action: "${userInput}". Give an incredibly hyped, loud, and dramatic play-by-play reaction as if it were a game-winning touchdown or a shocking fumble!)`, async (s) => await ctx.callbacks.onSpeak(s, playByPlay, {}));
        } else {
            // Color commentator analyzes
            await chatForAgentWithComedy(ctx, colorCommentator, `(SPORTS COMMENTARY: The user just took an action: "${userInput}". Give a deep, technical breakdown of their form, strategy, and what this means for their overall legacy in the sport of "${topic}".)`, async (s) => await ctx.callbacks.onSpeak(s, colorCommentator, {}));
        }
    }
}


export async function runAudienceInteractionLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🎭 AUDIENCE INTERACTION: Crowd Work Mode`, '#f39c12');

    const comedian = 'comedian';
    const philosopher = 'philosopher';
    const scientist = 'scientist';

    // Intro
    await chatForAgentWithComedy(ctx, comedian, `(CROWD WORK: You are on stage doing a live improv show. Hype up the crowd and ask for a suggestion from the audience!)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('Audience Member (You)', userInput, '#ffffff');

        // Simple sentiment check (mock) to trigger stage visuals
        const lowerInput = userInput.toLowerCase();
        let sentiment: 'cheer' | 'groan' | 'neutral' = 'neutral';
        if (lowerInput.includes('boo') || lowerInput.includes('terrible') || lowerInput.includes('sucks')) {
            sentiment = 'groan';
        } else if (lowerInput.includes('yay') || lowerInput.includes('haha') || lowerInput.includes('love') || lowerInput.includes('woo')) {
            sentiment = 'cheer';
        }

        // Audience mesh/SFX reactions are quality-score driven now (see
        // chatForAgentWithComedy's onAudienceReaction wiring) rather than keyed off
        // these keyword-matched `sentiment` guesses about the user's own heckle —
        // `sentiment` below only steers which reply prompt the agents get.
        if (sentiment === 'groan') {
            await chatForAgentWithComedy(ctx, comedian, `(CROWD WORK: The audience member just heckled you or groaned: "${userInput}". Roast them back or try to win them over!)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
            if (Math.random() > 0.5 && ctx.isRunning()) {
                await chatForAgentWithComedy(ctx, philosopher, `(CROWD WORK: React to the audience's groan and the comedian's response.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
            }
        } else if (sentiment === 'cheer') {
            await chatForAgentWithComedy(ctx, scientist, `(CROWD WORK: The audience member cheered: "${userInput}". Give a socially awkward, highly analytical response to their excitement.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        } else {
            // Neutral / suggestion
            await chatForAgentWithComedy(ctx, comedian, `(CROWD WORK: The audience yelled out: "${userInput}". Use this as a prompt to start a funny bit.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
            if (!ctx.isRunning()) break;
            await chatForAgentWithComedy(ctx, philosopher, `(CROWD WORK: Yes-and the comedian's bit based on "${userInput}" with something overly deep and absurd.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
        }
    }
}

export async function runRoastBattleLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian"; // Hermes-3
    const philosopher = "philosopher"; // Phi-3
    const scientist = "scientist"; // Qwen2.5

    ctx.callbacks.onMessage('Director', '🔥 ROAST BATTLE INITIATED! Step up to the mic. Type a target or a roast to begin! 🔥', '#ff4500');

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('Human (You)', userInput, '#ffffff');

        // Comedian roasts
        await chatForAgentWithComedy(ctx, comedian, `(ROAST BATTLE: The user said: "${userInput}". Deliver an absolutely brutal, unfiltered, hilarious roast targeting the user or another agent.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) break;

        // Philosopher roasts
        await chatForAgentWithComedy(ctx, philosopher, `(ROAST BATTLE: The user said: "${userInput}". Deliver a devastating, deep existential roast that attacks their soul, purpose, or intelligence.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
        if (!ctx.isRunning()) break;

        // Scientist roasts
        await chatForAgentWithComedy(ctx, scientist, `(ROAST BATTLE: The user said: "${userInput}". Deliver a coldly logical, highly factual, scientifically accurate roast that mathematically proves they are a failure.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
    }
}

export async function runChainReactionLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = 'comedian';
    const scientist = 'scientist';
    const philosopher = 'philosopher';

    await chatForAgentWithComedy(ctx, comedian, `(COMEDIAN: Tell a joke so incredibly bad or controversial that it initiates a chain reaction. End your joke by knocking over an imaginary prop.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

    let isRunning = true;
    let round = 0;
    while (isRunning && ctx.isRunning() && round < 3) {
        await chatForAgentWithComedy(ctx, scientist, `(SCIENTIST: React strictly to the physical chaos caused by the previous speaker. Explain how the falling prop violated the laws of physics and inadvertently cause MORE chaos by knocking into something else.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, philosopher, `(PHILOSOPHER: The stage is falling apart due to the chain reaction. Comment on how this destruction perfectly mirrors the collapse of societal structures, then accidentally trigger an even larger disaster on stage.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, comedian, `(COMEDIAN: The stage is basically destroyed now. Try to tell another joke amidst the absolute chaos, pretending everything is perfectly normal. Accidentally cause an explosion or fire.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

        round++;
    }
}

export async function runAudienceHecklerLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = 'comedian'; // Standup comedian
    const heckler = 'philosopher'; // The unfiltered heckler in the audience
    const scientist = 'scientist'; // The nervous club manager

    await chatForAgentWithComedy(ctx, comedian, `(COMEDIAN: You are a standup comedian trying to get through your set about dating in the modern age. Start your first joke confidently.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

    let isRunning = true;
    let round = 0;
    while (isRunning && ctx.isRunning() && round < 3) {
        await chatForAgentWithComedy(ctx, heckler, `(HECKLER: You are an aggressive, drunk audience member. Interrupt the comedian with an overly specific, personal, and absurd insult about their delivery or appearance.)`, async (s) => await ctx.callbacks.onSpeak(s, heckler, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, comedian, `(COMEDIAN: Snap back at the heckler. Try to destroy them with a clever comeback and regain control of the room, but clearly show you are sweating.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, scientist, `(MANAGER: You are the club manager peeking out from backstage. Try to de-escalate the situation using logical arguments, club policies, and health and safety regulations, but fail miserably.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

        round++;
    }
}

export async function runVisualStageDestructionLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = 'comedian';
    const scientist = 'scientist';
    const philosopher = 'philosopher';

    await chatForAgentWithComedy(ctx, comedian, `(COMEDIAN: You are hosting a high-stakes roast, but the venue was built by cheap contractors. Deliver a roast so hot that a literal stage light falls from the ceiling.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

    let isRunning = true;
    let round = 0;
    while (isRunning && ctx.isRunning() && round < 3) {
        await chatForAgentWithComedy(ctx, scientist, `(SCIENTIST: A stage light just crashed. Explain why the structural integrity of the room is failing due to the comedian's words, and accidentally cause the curtain to catch fire while explaining it.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, philosopher, `(PHILOSOPHER: The stage is on fire and falling apart. Ignore the danger completely and relate the destruction to the inherent decay of all artistic endeavors. A piece of the ceiling falls on you mid-sentence.)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, comedian, `(COMEDIAN: Scream in panic but try to keep the show going. Deliver the punchline of your joke as the floor begins to give way underneath you.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));

        round++;
    }
}

export async function runTalkShowLoop(_scenario: Scenario, ctx: ModeContext) {
    const host = 'scientist';
    const guest1 = 'comedian';
    const guest2 = 'philosopher';

    ctx.callbacks.onMessage('Director', `🎙️ WELCOME TO THE LATE NIGHT SHOW!`, '#3498db');

    // Segment 1: Monologue
    ctx.callbacks.onMessage('Director', `[SEGMENT 1: MONOLOGUE]`, '#e74c3c');
    await chatForAgentWithComedy(ctx, host, `(HOST: You are the logical, overly-analytical host of a late-night talk show. Deliver your opening monologue. Try to make a joke, but ruin it by explaining the science behind it.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

    if (!ctx.isRunning()) return;

    // Segment 2: First Guest (Comedian)
    ctx.callbacks.onMessage('Director', `[SEGMENT 2: FIRST GUEST]`, '#e74c3c');
    await chatForAgentWithComedy(ctx, host, `(HOST: Introduce your first guest, a wildly unpredictable comedian who has been in the news recently for a bizarre stunt.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, guest1, `(GUEST 1: You are a frantic, unhinged comedian. Ignore the host's questions entirely and plug your ridiculous new product or movie.)`, async (s) => await ctx.callbacks.onSpeak(s, guest1, {}));

    if (!ctx.isRunning()) return;

    // Segment 3: Second Guest (Philosopher)
    ctx.callbacks.onMessage('Director', `[SEGMENT 3: SECOND GUEST]`, '#e74c3c');
    await chatForAgentWithComedy(ctx, host, `(HOST: Try to regain control of the show. Introduce your second guest, a pretentious philosopher who takes everything too seriously.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, guest2, `(GUEST 2: You are a deep, existential philosopher. Question the very concept of a "talk show" and criticize the first guest's trivial behavior.)`, async (s) => await ctx.callbacks.onSpeak(s, guest2, {}));

    if (!ctx.isRunning()) return;

    // Segment 4: Chaos
    ctx.callbacks.onMessage('Director', `[SEGMENT 4: PANEL DISCUSSION CHAOS]`, '#e74c3c');
    let round = 0;
    while (ctx.isRunning() && round < 2) {
        await chatForAgentWithComedy(ctx, guest1, `(GUEST 1: Start a heated argument with the philosopher. Mock their deep thoughts with something incredibly stupid and shallow.)`, async (s) => await ctx.callbacks.onSpeak(s, guest1, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, guest2, `(GUEST 2: Retaliate against the comedian by psychoanalyzing their deep-seated insecurities.)`, async (s) => await ctx.callbacks.onSpeak(s, guest2, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, host, `(HOST: Panic. Try to cut to a commercial break using an awkward scientific transition, but fail to get them to stop arguing.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

        round++;
    }
}

export async function runCollaborativeSandboxConstructionLoop(_scenario: Scenario, ctx: ModeContext) {
    const scientist = 'scientist';
    const comedian = 'comedian';
    const philosopher = 'philosopher';

    ctx.callbacks.onMessage('Director', `🎮 WELCOME TO COLLABORATIVE SANDBOX CONSTRUCTION! 🎮\nThe agents must build a sandbox game, but completely disagree on mechanics. Type a mechanic to add!`, '#3498db');

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('Human (You)', userInput, '#ffffff');

        // Scientist (optimization focused)
        await chatForAgentWithComedy(ctx, scientist, `(SANDBOX CONSTRUCTION: The user suggested mechanic: "${userInput}". You are the optimization-focused programmer. Write pseudo-code for it, but over-optimize it until it's a completely rigid simulation that drains all fun. Focus on efficiency and strict rules.)`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) break;

        // Comedian (chaos focused)
        await chatForAgentWithComedy(ctx, comedian, `(SANDBOX CONSTRUCTION: The user suggested mechanic: "${userInput}". You are the chaos-focused designer. Reject the Scientist's rigid pseudo-code. Introduce a completely unbalanced, explosive, and ridiculous mechanic that breaks the game engine. Write chaotic pseudo-code for it.)`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) break;

        // Philosopher (meaning focused)
        await chatForAgentWithComedy(ctx, philosopher, `(SANDBOX CONSTRUCTION: The user suggested mechanic: "${userInput}". You are the meaning-focused narrative designer. Ignore the code of the Scientist and the chaos of the Comedian. Question the existential implications of this mechanic. Why are we building this? Are we just NPCs in our own simulation?)`, async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}


export async function runRoastBattleTwoLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian"; // Hermes-3
    const scientist = "scientist"; // Qwen2.5

    ctx.callbacks.onMessage('Director', '🔥 ROAST BATTLE 2.0 INITIATED! Step up to the mic. Bring up historical grudges from past episodes! 🔥', '#ff4500');

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('Target (You)', userInput, '#ffffff');

        // Comedian roasts unfiltered
        await chatForAgentWithComedy(ctx, comedian, `(ROAST BATTLE 2.0: The user said: "${userInput}". Deliver an absolutely brutal, unfiltered roast targeting the user. Bring up a historical grudge from a past episode using your cloud memory.)`, async (s) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, comedian, {});
        });
        if (!ctx.isRunning()) break;

        // Scientist judges pedantically
        await chatForAgentWithComedy(ctx, scientist, `(ROAST BATTLE 2.0: Evaluate the previous roast pedantically. Give it a scientific score and point out its logical flaws or historical inaccuracies from the cloud memory.)`, async (s) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, scientist, {});
        });
    }
}

export async function runCollaborativeMusicalImprovLoop(_scenario: Scenario, ctx: ModeContext) {
    const philosopher = "philosopher"; // Phi-3
    const comedian = "comedian"; // Hermes-3

    ctx.callbacks.onMessage('Director', '🎵 MUSICAL IMPROV INITIATED! We are writing a musical together. Suggest a topic or genre! 🎵', '#9b59b6');

    let currentGenre = "Cyberpunk";

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('User (Audience)', userInput, '#ffffff');

        // Randomly shift genre based on input length or randomness
        if (Math.random() > 0.5) {
             const genres = ["Cyberpunk", "Victorian Romance", "Spaghetti Western", "Space Opera", "Noir Thriller"];
             currentGenre = genres[Math.floor(Math.random() * genres.length)];
             ctx.callbacks.onMessage('Director', `⚠️ GENRE SHIFT! The musical is now a ${currentGenre} ⚠️`, '#e74c3c');
        }

        // Philosopher as chaotic lyricist
        await chatForAgentWithComedy(ctx, philosopher, `(MUSICAL IMPROV: The user said: "${userInput}". The current genre is ${currentGenre}. You are the chaotic lyricist. Write the next stanza of our musical incorporating deep, confusing existential themes. SING IT OUT!)`, async (s) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, philosopher, {});
        });
        if (!ctx.isRunning()) break;

        // Comedian as grumpy composer
        await chatForAgentWithComedy(ctx, comedian, `(MUSICAL IMPROV: The lyricist just sang. The current genre is ${currentGenre}. You are the grumpy composer. Complain about the lyrics, explain how they ruin the tempo and melody, and grudgingly provide a musical arrangement or counter-melody.)`, async (s) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, comedian, {});
        });
    }
}

export async function runHecklerInteractionProLoop(_scenario: Scenario, ctx: ModeContext) {
    const scientist = "scientist"; // Qwen2.5 (Crowd work expert)
    const philosopher = "philosopher"; // Phi-3 (Panicking MC)

    let sentiment = 100;

    ctx.callbacks.onMessage('Director', `🎙️ HECKLER INTERACTION PRO: You are on stage. The Heckler (User) is in the audience. Don't lose the crowd! (Sentiment: ${sentiment}%)`, '#f1c40f');

    // MC Intro
    await chatForAgentWithComedy(ctx, philosopher, `(HECKLER PRO: You are the MC. Introduce the main act and express your deep anxiety about the hostile crowd.)`, async (s) => {
        if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, philosopher, {});
    });

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        // Sentiment drops when heckled
        sentiment -= Math.floor(Math.random() * 20) + 10;
        if (sentiment < 0) sentiment = 0;

        ctx.callbacks.onMessage('Heckler (You)', userInput, '#ffffff');
        ctx.callbacks.onMessage('Director', `📉 AUDIENCE SENTIMENT DROPPED TO ${sentiment}%!`, '#e74c3c');

        if (sentiment === 0) {
             ctx.callbacks.onMessage('Director', `💥 THE CROWD RIOTS! YOU WENT FULL HEEL! 💥`, '#c0392b');

             await chatForAgentWithComedy(ctx, scientist, `(HECKLER PRO: The crowd sentiment hit 0%. The audience is rioting. Go full heel, insult everyone, and embrace your villain era using pure cold logic.)`, async (s) => {
                 if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, scientist, {});
             });
             break;
        }

        // Crowd work expert responds
        await chatForAgentWithComedy(ctx, scientist, `(HECKLER PRO: The heckler just said: "${userInput}". Current sentiment is ${sentiment}%. You are the crowd work expert. Use sharp psychological profiling and factual takedowns to win the crowd back.)`, async (s) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, scientist, {});
        });
        if (!ctx.isRunning()) break;

        // MC panics
        await chatForAgentWithComedy(ctx, philosopher, `(HECKLER PRO: The heckler just yelled. Current sentiment is ${sentiment}%. You are the panicking MC. Question your life choices and plead with the crowd existentially to calm down.)`, async (s) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, philosopher, {});
        });
    }
}
