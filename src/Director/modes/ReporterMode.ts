import type { Scenario, ReporterSegment } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runReporterLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.reporterTopic || scenario.title;
    let context = scenario.config?.reporterContext || '';
    const segments = scenario.config?.reporterSegments || getDefaultReporterSegments();
    const enableBreakingNews = scenario.config?.enableBreakingNews ?? true;

    if (!context) {
        ctx.callbacks.onError('Reporter mode requires context data in config.reporterContext');
        ctx.stopScene();
        return;
    }

    const recall = await ctx.searchAndRecall(topic);
    if (recall) {
        ctx.callbacks.onMessage('System', '🧠 Memory Recall Active', '#4ecdc4');
        context += '\n' + recall;
    }

    ctx.callbacks.onMessage('Director', `📰 Now Reporting: ${topic}`, '#888');
    if (scenario.config?.sources && scenario.config.sources.length > 0) {
        ctx.callbacks.onMessage('Director', `📡 Sources: ${scenario.config.sources.join(', ')}`, '#666');
    }

    for (const segment of segments) {
        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTicker) {
            const headline = generateTickerHeadline(topic);
            ctx.callbacks.onTicker(headline);
        }

        await executeReporterSegment(segment, context, topic, enableBreakingNews, ctx);
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', '📰 End of broadcast', '#888');
    }
}

export function getDefaultReporterSegments(): ReporterSegment[] {
    return [
        {
            type: 'intro',
            speakerRole: 'host',
            promptInjection: '(You are the HOST introducing today\'s topic. Welcome viewers and set the stage with a mix of professionalism and wit.)',
            maxTurns: 1
        },
        {
            type: 'headlines',
            speakerRole: 'anchor',
            promptInjection: '(You are the ANCHOR presenting the headline story. Be serious and informative, like a professional newsreader.)',
            maxTurns: 1
        },
        {
            type: 'main_story',
            speakerRole: 'expert',
            promptInjection: '(You are the EXPERT analyst. Present the key facts and provide analysis. Reference specific details from the context.)',
            maxTurns: 2
        },
        {
            type: 'panel_discussion',
            speakerRole: 'analyst',
            promptInjection: '(Join the PANEL DISCUSSION. React to what others have said, offer your perspective, and engage in friendly debate.)',
            maxTurns: 4
        },
        {
            type: 'closing',
            speakerRole: 'host',
            promptInjection: '(You are the HOST wrapping up the segment. Summarize key takeaways and sign off with style.)',
            maxTurns: 1
        }
    ];
}

async function executeReporterSegment(
    segment: ReporterSegment,
    context: string,
    _topic: string,
    enableBreakingNews: boolean,
    ctx: ModeContext,
): Promise<void> {
    const segmentEmojis: Record<string, string> = {
        intro: '🎬', headlines: '📰', main_story: '📊', panel_discussion: '💬',
        fact_check: '✅', breaking: '🚨', closing: '👋', weather: '☀️',
        commercial: '📺', interview: '🎙️'
    };

    const segmentNames: Record<string, string> = {
        intro: 'Show Intro', headlines: 'Headlines', main_story: 'Main Story',
        panel_discussion: 'Panel Discussion', fact_check: 'Fact Check', breaking: 'Breaking News',
        closing: 'Closing', weather: 'Weather Report', commercial: 'Commercial Break',
        interview: 'Exclusive Interview'
    };

    if (enableBreakingNews && segment.type !== 'breaking' && Math.random() * 100 < ctx.chaosLevel / 3) {
        ctx.callbacks.onMessage('Director', `${segmentEmojis['breaking']} BREAKING NEWS interruption!`, '#ff6b6b');
        const breakingPrompt = `(BREAKING NEWS INTERRUPTION! A surprising development just came in. React with appropriate urgency and surprise!)`;
        await ctx.processTurn(context + ' ' + breakingPrompt);
    }

    for (let turn = 0; turn < segment.maxTurns && ctx.isRunning(); turn++) {
        if (turn === 0) {
            ctx.callbacks.onMessage('Director',
                `${segmentEmojis[segment.type] || '📰'} ${segmentNames[segment.type] || segment.type}`,
                '#4ecdc4'
            );
        }

        let prompt = segment.promptInjection;

        if (turn === 0 && (segment.type === 'headlines' || segment.type === 'main_story')) {
            prompt = context + ' ' + prompt;
        }

        if (segment.type === 'panel_discussion') {
            const panelPrompts = [
                '(Agree with the previous speaker but add a twist.)',
                '(Play devil\'s advocate and challenge the previous point.)',
                '(Share a surprising fact or connection others missed.)',
                '(Make a bold prediction about where this is heading.)'
            ];
            if (turn > 0) {
                prompt = segment.promptInjection + ' ' + panelPrompts[turn % panelPrompts.length];
            }
        }

        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift();
            prompt = `(SYSTEM: BREAKING INTERRUPTION! Someone yells: "${heckle}". React to this live on air!)`;
            ctx.callbacks.onMessage('Audience', `"${heckle}"`, '#ff6b6b');
        }

        await ctx.processTurn(prompt);

        if (turn < segment.maxTurns - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    await new Promise(r => setTimeout(r, 800));
}

function generateTickerHeadline(topic: string): string {
    const templates = [
        `BREAKING: ${topic} causes minor confusion`,
        `UPDATE: Experts say ${topic} is "mostly harmless"`,
        `LIVE: People still talking about ${topic}`,
        `NEWS: ${topic} - What does it mean for your lunch?`,
        `ALERT: ${topic} confirmed to be a thing`,
        `SCANDAL: ${topic} involved in controversy`,
        `DEVELOPING: ${topic} rumored to be part of simulation`,
        `TRENDING: ${topic} goes viral for wrong reasons`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

export async function runNewsroomLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.newsroomTopic || 'A very slow news day';
    const anchor = 'comedian';
    const fieldReporter = 'philosopher';
    const expert = 'scientist';

    ctx.callbacks.onMessage('Director', `📺 LIVE NEWSROOM: ${topic}`, '#4ecdc4');
    ctx.callbacks.onMessage('Ticker', `BREAKING: ${topic} dominates the headlines...`, '#ff0000');

    // Intro from Anchor
    ctx.callbacks.onTurnStart(anchor);
    await ctx.manager.chatForAgent(anchor, `(You are a highly professional news anchor presenting a developing story about "${topic}". Welcome the viewers, state the main headline, and toss it over to the field reporter.)`, async (s) => await ctx.callbacks.onSpeak(s, anchor, {}));
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!ctx.isRunning()) break;

        // User represents "Control Room / Producer" giving an update
        ctx.callbacks.onMessage('Producer (You)', userInput, '#ffffff');

        if (round % 3 === 1) {
            // Field Reporter reacts
            ctx.callbacks.onTurnStart(fieldReporter);
            await ctx.manager.chatForAgent(fieldReporter, `(You are a stressed field reporter live on the scene. The producer just reported: "${userInput}". Describe the chaos around you related to "${topic}" and this new update.)`, async (s) => await ctx.callbacks.onSpeak(s, fieldReporter, {}));
            await ctx.callbacks.onTurnEnd();

            ctx.callbacks.onMessage('Ticker', `UPDATE: Field reporter struggling with "${userInput}"...`, '#ff0000');
        } else if (round % 3 === 2) {
            // Expert analyzes
            ctx.callbacks.onTurnStart(expert);
            await ctx.manager.chatForAgent(expert, `(You are a weirdly specific studio expert. The producer reported: "${userInput}". Analyze this development using overly complex, mostly fabricated jargon and statistics.)`, async (s) => await ctx.callbacks.onSpeak(s, expert, {}));
            await ctx.callbacks.onTurnEnd();

            ctx.callbacks.onMessage('Ticker', `ANALYSIS: Experts remain confused about "${userInput}"...`, '#ff0000');
        } else {
            // Anchor brings it back
            ctx.callbacks.onTurnStart(anchor);
            await ctx.manager.chatForAgent(anchor, `(You are the main anchor. The producer said: "${userInput}". Summarize the absurdity of what the field reporter and expert just said, and transition smoothly as if this is normal news.)`, async (s) => await ctx.callbacks.onSpeak(s, anchor, {}));
            await ctx.callbacks.onTurnEnd();

            ctx.callbacks.onMessage('Ticker', `LIVE: Anchor continues despite "${userInput}"...`, '#ff0000');
        }

        round++;
    }
}

export async function runMeltdownLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.meltdownTopic || 'local weather patterns';
    const anchor = 'comedian';
    const coAnchor = 'philosopher';
    const expert = 'scientist';

    ctx.callbacks.onMessage('Director', `📺 LIVE NEWS: ${topic}`, '#4ecdc4');

    // Normal intro
    ctx.callbacks.onTurnStart(anchor);
    await ctx.manager.chatForAgent(anchor, `(You are a highly professional news anchor presenting a story about "${topic}". Be serious and confident.)`, async (s) => await ctx.callbacks.onSpeak(s, anchor, {}));
    await ctx.callbacks.onTurnEnd();

    // The breakdown
    ctx.callbacks.onMessage('Director', `🚨 ERROR: TELEPROMPTER BROKE! 🚨`, '#ff0000');

    let round = 1;
    while (ctx.isRunning()) {
        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Producer', `"${heckle}"`, '#ff6b6b');
            await ctx.manager.chatForAgent(anchor, `(The producer yelled in your earpiece: "${heckle}". React live on air!)`, async (s) => await ctx.callbacks.onSpeak(s, anchor, {}));
            continue;
        }

        if (!ctx.isRunning()) break;

        // Anchor spirals
        await ctx.manager.chatForAgent(anchor, `(The teleprompter is completely broken. You are live on air discussing "${topic}". Panic and start making up the most ridiculous, unhinged conspiracy theories to fill time!)`, async (s) => await ctx.callbacks.onSpeak(s, anchor, { speed: 1.2 }));

        if (!ctx.isRunning()) break;

        // Co-anchor tries to save it
        if (round % 2 === 0) {
            await ctx.manager.chatForAgent(coAnchor, `(You are the co-anchor. The main anchor is having a live meltdown. Try to salvage the segment and bring it back to logical facts.)`, async (s) => await ctx.callbacks.onSpeak(s, coAnchor, {}));
        } else {
            // Expert makes it worse
            await ctx.manager.chatForAgent(expert, `(You are the live field expert. Validate the anchor's insane conspiracy theory using fake science jargon.)`, async (s) => await ctx.callbacks.onSpeak(s, expert, {}));
        }

        if (ctx.callbacks.onTicker) {
            const panicHeadlines = [
                `BREAKING: WE DON'T KNOW WHAT'S HAPPENING`,
                `UPDATE: EVERYTHING IS A LIE`,
                `LIVE: ANCHOR SWEATING PROFUSELY`,
                `NEWS: IS THE MOON REAL?`,
                `ALERT: PLEASE SEND HELP`
            ];
            ctx.callbacks.onTicker(panicHeadlines[Math.floor(Math.random() * panicHeadlines.length)]);
        }

        round++;
        await new Promise(r => setTimeout(r, 1200));
    }
}

export async function runNewsDeskLoop(scenario: Scenario, ctx: ModeContext) {
    const breakingNews = scenario.config?.breakingNews || 'a pigeon elected as mayor';
    ctx.callbacks.onMessage('Director', `📰 BREAKING NEWS: ${breakingNews}`, '#c0392b');

    const anchor = 'scientist';
    const fieldReporter = 'comedian';
    const analyst = 'philosopher';

    // 1. Anchor Intro
    ctx.callbacks.onTurnStart(anchor);
    await ctx.manager.chatForAgent(anchor, `(ANCHOR: You are a serious news anchor reporting on the breaking story: "${breakingNews}". Deliver the headlines with absolute gravity, using statistics that don't make sense. Throw to your field reporter (the User) for a live update.)`, async (s) => await ctx.callbacks.onSpeak(s, anchor, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Live Witness (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Field Reporter interjects
        ctx.callbacks.onTurnStart(fieldReporter);
        await ctx.manager.chatForAgent(fieldReporter, `(FIELD REPORTER: You are at the chaotic scene of "${breakingNews}". The witness just said: "${userInput}". Sensationalize their statement! Describe something incredibly dangerous happening right behind you!)`, async (s) => await ctx.callbacks.onSpeak(s, fieldReporter, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Analyst comments
        ctx.callbacks.onTurnStart(analyst);
        await ctx.manager.chatForAgent(analyst, `(ANALYST: You are in the studio. Analyze the field report and the witness statement: "${userInput}". Connect this event to the inevitable collapse of society and human hubris.)`, async (s) => await ctx.callbacks.onSpeak(s, analyst, {}));
        await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        // Anchor wraps up
        ctx.callbacks.onTurnStart(anchor);
        await ctx.manager.chatForAgent(anchor, `(ANCHOR: Thank the analyst and the witness. Transition smoothly from the existential dread to a completely inappropriate, trivial local news story or sponsor read. Ask the witness another question.)`, async (s) => await ctx.callbacks.onSpeak(s, anchor, {}));
        await ctx.callbacks.onTurnEnd();
    }
}
