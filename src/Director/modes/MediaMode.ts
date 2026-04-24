import { MediaReactionManager } from '../MediaReactionManager';
import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runReactionLoop(scenario: Scenario, ctx: ModeContext) {
    if (!ctx.callbacks.videoControls) {
        ctx.callbacks.onError('Reaction mode requires video controls');
        ctx.stopScene();
        return;
    }

    const videoUrl = scenario.config?.videoUrl;
    const triggers = scenario.config?.triggers;

    if (!videoUrl || !triggers) {
        ctx.callbacks.onError('Reaction mode requires videoUrl and triggers in config');
        ctx.stopScene();
        return;
    }

    const reactionManager = new MediaReactionManager(triggers);

    ctx.callbacks.videoControls.show(true);
    ctx.callbacks.videoControls.load(videoUrl);

    try {
        await ctx.callbacks.videoControls.play();
    } catch (e) {
        console.warn('Auto-play might be blocked or failed:', e);
        ctx.callbacks.onMessage('System', 'Please click play on the video if it does not start automatically.', '#ff6b6b');
    }

    ctx.callbacks.onMessage('Director', 'Starting reaction loop...', '#888');

    while (ctx.isRunning()) {
        const time = ctx.callbacks.videoControls.getTime();
        const trigger = reactionManager.checkTriggers(time);

        if (trigger) {
            ctx.callbacks.videoControls.pause();
            ctx.callbacks.onMessage('Director', `Reaction triggered: ${trigger.prompt}`, '#888');
            await ctx.processTurn(trigger.prompt);
            if (ctx.isRunning()) {
                try {
                    await ctx.callbacks.videoControls.play();
                } catch (e) {
                    console.error('Failed to resume video:', e);
                }
            }
        }

        await new Promise(r => setTimeout(r, 200));
    }

    ctx.callbacks.videoControls.pause();
    ctx.callbacks.videoControls.show(false);
}

export async function runVisionLoop(scenario: Scenario, ctx: ModeContext) {
    const imageUrl = scenario.config?.imageUrl;
    if (!imageUrl) {
        ctx.callbacks.onError('Vision mode requires an imageUrl');
        ctx.stopScene();
        return;
    }

    ctx.callbacks.onMessage('Director', `👁️ VISION MODE: Analyzing Image...`, '#4ecdc4');

    const content: import('../../llm/LLMEngine').ContentPart[] = [
        { type: "text", text: "(VISION ANALYSIS: Look at this image. Describe what you see in detail and make a funny observation about it.)" },
        { type: "image_url", image_url: { url: imageUrl } }
    ];

    if (ctx.isRunning()) {
        const currentAgent = ctx.manager.getCurrentAgent();
        await ctx.callbacks.onTurnStart(currentAgent.id);
        await ctx.manager.chat(content, async (sentence) => {
            await ctx.callbacks.onSpeak(sentence, currentAgent.id, { steps: 20 });
        }, { maxTokens: 256 });
        await ctx.callbacks.onTurnEnd();
    }

    while (ctx.isRunning()) {
        await new Promise(r => setTimeout(r, 1000));
        if (!ctx.isRunning()) break;

        if (ctx.interruptQueue.length > 0) {
            const heckle = ctx.interruptQueue.shift()!;
            ctx.callbacks.onMessage('Director', `📢 COMMENT: "${heckle}"`, '#ff6b6b');
            await ctx.processTurn(`(SYSTEM: Someone commented on the image: "${heckle}". React to this!)`);
            continue;
        }

        await ctx.processTurn(`(Continue discussing the image. Point out another detail or make a connection to something else.)`);
    }
}
