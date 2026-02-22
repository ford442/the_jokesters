import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';

export async function runTrialLoop(scenario: Scenario, ctx: ModeContext) {
    const crime = scenario.config?.trialTopic || 'Eating the last slice of pizza';
    ctx.callbacks.onMessage('Director', `⚖️ THE TRIAL: The Case of ${crime}`, '#f39c12');

    const judge = 'philosopher';
    const prosecutor = 'scientist';
    const defense = 'comedian';

    // 1. Judge Intro
    ctx.callbacks.onTurnStart(judge);
    await ctx.manager.chatForAgent(judge, `(You are the JUDGE in a courtroom. The defendant (User) is accused of: "${crime}". Call the court to order, demand silence, and ask the Prosecutor for the opening statement. Be extremely formal and pompous.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    // 2. Prosecutor Opening
    ctx.callbacks.onTurnStart(prosecutor);
    await ctx.manager.chatForAgent(prosecutor, `(You are the PROSECUTOR. Present the charges against the defendant (User) regarding "${crime}". Use made-up evidence and sound very clinical and harsh.)`, async (s) => await ctx.callbacks.onSpeak(s, prosecutor, {}));
    await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) return;

    // 3. Defense Opening (Incompetent)
    ctx.callbacks.onTurnStart(defense);
    await ctx.manager.chatForAgent(defense, `(You are the PUBLIC DEFENDER for the User. Make an opening statement but be totally incompetent, distracted, or admit you lost the paperwork. Try to defend them but fail hilariously.)`, async (s) => await ctx.callbacks.onSpeak(s, defense, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Defendant (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(prosecutor, `(PROSECUTOR: The defendant just said: "${userInput}". Twist their words, shout "OBJECTION!", and make them look guilty based on this statement.)`, async (s) => await ctx.callbacks.onSpeak(s, prosecutor, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(judge, `(JUDGE: React to the testimony. Maintain order. Ask the Defense if they have anything to add.)`, async (s) => await ctx.callbacks.onSpeak(s, judge, {}));

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(defense, `(DEFENSE ATTORNEY: Try to help your client but make it worse. Maybe bring up an irrelevant witness or legal precedent involving ducks.)`, async (s) => await ctx.callbacks.onSpeak(s, defense, {}));
    }
}

export async function runTechSupportLoop(scenario: Scenario, ctx: ModeContext) {
    const issue = scenario.config?.techIssue || 'My internet is down';
    ctx.callbacks.onMessage('Director', `📞 TECH SUPPORT: Ticket #829 - ${issue}`, '#e74c3c');

    const agent = 'comedian';
    const manager = 'philosopher';
    const expert = 'scientist';

    ctx.callbacks.onTurnStart(agent);
    await ctx.manager.chatForAgent(agent, `(You are a Tier 1 Tech Support Agent at a terrible ISP. Answer the phone. You are eating chips and very unhelpful. The customer has an issue: "${issue}". Ask them if they turned it off and on again.)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Customer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(agent, `(TECH SUPPORT: The customer said: "${userInput}". Give them terrible, unrelated advice. Maybe ask them to check the flux capacitor or reinstall Windows 95.)`, async (s) => await ctx.callbacks.onSpeak(s, agent, {}));

        if (!ctx.isRunning()) break;

        if (Math.random() > 0.6) {
            await ctx.manager.chatForAgent(manager, `(MANAGER: Interject on the call. Scold the agent for not following protocol script #42. Apologize to the customer but explain that due to policy, you can't actually help them.)`, async (s) => await ctx.callbacks.onSpeak(s, manager, {}));
        } else if (Math.random() > 0.5) {
            await ctx.manager.chatForAgent(expert, `(SENIOR TECH: Join the call. Be extremely condescending. Explain why the user's problem is actually their own fault because they don't understand quantum networking.)`, async (s) => await ctx.callbacks.onSpeak(s, expert, {}));
        }
    }
}

export async function runDungeonMasterLoop(scenario: Scenario, ctx: ModeContext) {
    const dm = 'scientist';
    const setting = scenario.config?.dmSetting || 'a dark fantasy dungeon';

    ctx.callbacks.onMessage('Director', `🎲 DUNGEON MASTER MODE: Setting - ${setting}`, '#9b59b6');

    ctx.callbacks.onTurnStart(dm);
    await ctx.manager.chatForAgent(dm, `(You are the DUNGEON MASTER for a roleplaying game set in ${setting}. Describe the opening scene vividly to the players (User, Comedian, Philosopher). Ask them what they want to do.)`, async (s) => await ctx.callbacks.onSpeak(s, dm, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        if (Math.random() > 0.3 && ctx.isRunning()) {
            await ctx.manager.chatForAgent('comedian', `(RPG PLAYER: You are playing the game. React to the scene or declare an action. Be chaotic and funny.)`, async (s) => await ctx.callbacks.onSpeak(s, 'comedian', {}));
        }
        if (Math.random() > 0.3 && ctx.isRunning()) {
            await ctx.manager.chatForAgent('philosopher', `(RPG PLAYER: You are playing the game. Analyze the situation or declare a cautious, over-thought action.)`, async (s) => await ctx.callbacks.onSpeak(s, 'philosopher', {}));
        }

        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(dm, `(DUNGEON MASTER: The user said: "${userInput}". The other players also acted. Resolve these actions. Describe the consequences and the new state of the world. Then ask "What do you do next?")`, async (s) => await ctx.callbacks.onSpeak(s, dm, {}));
    }
}

export async function runTriviaLoop(scenario: Scenario, ctx: ModeContext) {
    const topic = scenario.config?.triviaTopic || 'General Knowledge';
    const host = 'scientist';
    ctx.callbacks.onMessage('Director', `❓ TRIVIA NIGHT: Topic - ${topic}`, '#f1c40f');

    ctx.callbacks.onTurnStart(host);
    await ctx.manager.chatForAgent(host, `(You are hosting a Trivia Night. The topic is "${topic}". Welcome the player (User) and explain the rules. Keep it brief.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    await ctx.callbacks.onTurnEnd();

    let round = 1;
    while (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', `🔔 Question ${round}`, '#888');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(host, `(TRIVIA HOST: Ask a challenging trivia question about "${topic}". Do not reveal the answer yet. Wait for the user to guess.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('You', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(host, `(TRIVIA HOST: The user answered: "${userInput}". Reveal the correct answer and tell them if they were right or wrong. Be strict but fair. Then ask if they are ready for the next question.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));

        if (Math.random() > 0.5 && ctx.isRunning()) {
            await ctx.manager.chatForAgent('comedian', `(React to the user's answer or the host's strictness. Make a joke about it.)`, async (s) => await ctx.callbacks.onSpeak(s, 'comedian', {}));
        }

        round++;
        await new Promise(r => setTimeout(r, 1000));
    }
}

export async function runInterviewLoop(scenario: Scenario, ctx: ModeContext) {
    const host = scenario.config?.interviewHost || 'comedian';
    const guestName = scenario.config?.interviewGuest || 'The User';

    ctx.callbacks.onMessage('Director', `🎙️ PODCAST MODE: Host ${host} interviewing ${guestName}`, '#4ecdc4');

    ctx.callbacks.onTurnStart(host);
    await ctx.manager.chatForAgent(host, `(You are hosting a podcast. Introduce yourself and your special guest, ${guestName}. Start by asking them a question about their life or opinions. Be charming and inquisitive.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage(guestName, userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        await ctx.manager.chatForAgent(host, `(PODCAST INTERVIEW: The guest (${guestName}) just said: "${userInput}". React to this, maybe crack a joke or make an observation, and then ask a follow-up question. Keep the conversation flowing naturally.)`, async (s) => await ctx.callbacks.onSpeak(s, host, {}));
    }
}

export async function runCommentaryLoop(scenario: Scenario, ctx: ModeContext) {
    const target = scenario.config?.commentaryTarget || 'User Input';

    const hypeMan = 'comedian';
    const analyst = 'scientist';
    const color = 'philosopher';

    ctx.callbacks.onMessage('Director', `🎙️ COMMENTARY TRACK: Watching ${target}`, '#8e44ad');

    // Intro
    ctx.callbacks.onTurnStart(hypeMan);
    await ctx.manager.chatForAgent(hypeMan, `(You are an Esports Caster. Welcome the viewers to the commentary stream of "${target}". Be super high energy! Introduce your co-casters: The Analyst (Scientist) and The Color Commentator (Philosopher).)`, async (s) => await ctx.callbacks.onSpeak(s, hypeMan, {}));
    await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Player (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Hype Man Reaction
        await ctx.manager.chatForAgent(hypeMan, `(ESPORTS CASTER: The player just did this: "${userInput}". React with massive HYPE! Shout about the mechanics!)`, async (s) => await ctx.callbacks.onSpeak(s, hypeMan, {}));

        if (!ctx.isRunning()) break;

        // Analyst Reaction
        await ctx.manager.chatForAgent(analyst, `(ESPORTS ANALYST: Analyze the player's move: "${userInput}". Explain why it was technically brilliant or a huge mistake using complex jargon.)`, async (s) => await ctx.callbacks.onSpeak(s, analyst, {}));

        if (!ctx.isRunning()) break;

        // Color Reaction
        await ctx.manager.chatForAgent(color, `(COLOR COMMENTATOR: Add a deep, philosophical, or completely unrelated observation about the move "${userInput}". Maybe mention the meta-game.)`, async (s) => await ctx.callbacks.onSpeak(s, color, {}));
    }
}
