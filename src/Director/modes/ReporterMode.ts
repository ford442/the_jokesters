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
