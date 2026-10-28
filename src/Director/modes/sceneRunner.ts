import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

/**
 * Declarative scene scripts for modes that are "an opener, then react to each user line".
 *
 * A script is data plus short prompts; `runSceneScript` owns the loop. Comedy sampling, the
 * production-card hiddenInstruction, scene-arc beats and audience scoring all live in
 * `chatForAgentWithComedy`, so a script never talks to `manager.chatForAgent` itself.
 * Modes that need real rules (scoring, trial phases, bar counts) keep a hand-written loop.
 */

export interface SceneBeat {
    /** Role name from `SceneScript.roles` (an unknown name is used as a raw agent id). */
    speaker: string;
    /**
     * The parenthetical prompt. `{{input}}` is the user's latest line; any other `{{name}}` comes
     * from the `vars` passed to `runSceneScript`. Substitution is one pass, so a value that itself
     * contains `{{...}}` or `$&` is inserted verbatim.
     */
    prompt: string;
    /** `open` plays once before the first user line; `user` (default) plays every round after it. */
    when?: 'open' | 'user';
    /** `user` beats only: probability in [0, 1) that the beat is skipped this round (rolled as `Math.random() > skipChance`). */
    skipChance?: number;
}

/** Exactly one of `oneOf` plays each round, chosen uniformly. */
export interface SceneChoice {
    oneOf: SceneBeat[];
}

export interface SceneScript {
    banner: string;
    bannerColor: string;
    /** Sender label for the echoed user line, e.g. `'Roommate (You)'`. */
    userLabel: string;
    /** Role name → agent id. */
    roles: Record<string, string>;
    /** `open` beats first (in order), then the per-round `user` beats / choices (in order). */
    beats: Array<SceneBeat | SceneChoice>;
}

const USER_COLOR = '#ffffff';

function isChoice(step: SceneBeat | SceneChoice): step is SceneChoice {
    return 'oneOf' in step;
}

function fill(template: string, input: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
        name === 'input' ? input : (Object.hasOwn(vars, name) ? vars[name] : match));
}

async function playBeat(
    ctx: ModeContext,
    script: SceneScript,
    beat: SceneBeat,
    input: string,
    vars: Record<string, string>,
): Promise<void> {
    const agent = script.roles[beat.speaker] ?? beat.speaker;
    await chatForAgentWithComedy(
        ctx,
        agent,
        fill(beat.prompt, input, vars),
        async (s) => await ctx.callbacks.onSpeak(s, agent, {}),
    );
}

export async function runSceneScript(
    script: SceneScript,
    ctx: ModeContext,
    vars: Record<string, string> = {},
): Promise<void> {
    ctx.callbacks.onMessage('Director', fill(script.banner, '', vars), script.bannerColor);

    const open: SceneBeat[] = [];
    const perRound: Array<SceneBeat | SceneChoice> = [];
    for (const step of script.beats) {
        if (!isChoice(step) && step.when === 'open') open.push(step);
        else perRound.push(step);
    }

    for (const beat of open) await playBeat(ctx, script, beat, '', vars);

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(script.userLabel, userInput, USER_COLOR);

        for (const step of perRound) {
            if (!ctx.isRunning()) break;

            let beat: SceneBeat;
            if (isChoice(step)) {
                beat = step.oneOf[Math.min(step.oneOf.length - 1, Math.floor(Math.random() * step.oneOf.length))];
            } else {
                if (step.skipChance !== undefined && !(Math.random() > step.skipChance)) continue;
                beat = step;
            }
            await playBeat(ctx, script, beat, userInput, vars);
        }
    }
}

/** Authoring mistakes a script can make; empty when the script is sound. Used by tests, not at runtime. */
export function validateSceneScript(script: SceneScript): string[] {
    const problems: string[] = [];
    const flat = script.beats.flatMap((s) => (isChoice(s) ? s.oneOf : [s]));
    if (script.beats.some((s) => isChoice(s) && s.oneOf.length === 0)) problems.push('empty oneOf');
    if (!script.beats.some((s) => isChoice(s) || s.when !== 'open')) problems.push('no per-round beats');
    for (const b of flat) {
        if (!(b.speaker in script.roles)) problems.push(`unknown speaker "${b.speaker}"`);
        if (b.when === 'open' && b.prompt.includes('{{input}}')) problems.push(`open beat uses {{input}}: "${b.prompt.slice(0, 40)}"`);
        if (b.skipChance !== undefined && !(b.skipChance >= 0 && b.skipChance < 1)) problems.push(`skipChance out of range for ${b.speaker}`);
    }
    for (const s of script.beats) {
        if (isChoice(s) && s.oneOf.some((b) => b.when === 'open' || b.skipChance !== undefined)) {
            problems.push('oneOf members must be plain per-round beats');
        }
    }
    return problems;
}
