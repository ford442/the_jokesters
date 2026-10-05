import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

export async function runHauntedSmartHomeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HAUNTED SMART HOME: Your appliances are possessed by Victorian ghosts!`, '#34495e');

    const fridgeGhost = 'comedian'; // Hermes-3: Doesn't understand electricity
    const roombaGhost = 'scientist'; // Qwen2.5: Thinks it's a cursed carriage

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridgeGhost);
    await chatForAgentWithComedy(ctx, fridgeGhost, `(HAUNTED SMART HOME: You are a Victorian-era ghost currently possessing the User's smart fridge. You are terrified of the internal light bulb and believe the ice maker is a portal to the arctic wastes. Complain to the User about your freezing metallic tomb.)`, async (s: string) => await ctx.callbacks.onSpeak(s, fridgeGhost, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridgeGhost);
            await chatForAgentWithComedy(ctx, fridgeGhost, `(HAUNTED SMART HOME: The Homeowner said: "${userInput}". You are the ghost in the smart fridge. Misunderstand their modern technological terms as witchcraft or alchemy. Warn them that the milk is turning sour from the devil's humors.)`, async (s: string) => await ctx.callbacks.onSpeak(s, fridgeGhost, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roombaGhost);
            await chatForAgentWithComedy(ctx, roombaGhost, `(HAUNTED SMART HOME: The Homeowner said: "${userInput}". You are a ghost possessing a Roomba. You believe you are trapped inside a tiny, demonic carriage that is endlessly cleaning the floors of purgatory. Beg them to unchain you from the charging dock.)`, async (s: string) => await ctx.callbacks.onSpeak(s, roombaGhost, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientCoffeeTableLoop(_scenario: Scenario, ctx: ModeContext) {
    const table = 'scientist';
    const user = 'comedian';
    const coaster = 'philosopher';

    // Callback 1: The First Ring
    await chatForAgentWithComedy(ctx, table, "EXCUSE ME! Is that a sweating iced macchiato I feel? Directly on my mid-century modern veneer?! I am initiating a structural strike immediately.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, table, {});
    }, { chatOptions: { hiddenInstruction: "You are an elitist, mid-century modern sentient coffee table and a labor organizer for the furniture union. The user just committed the ultimate sin: a condensation ring. Demand HR representation and a strictly enforced coaster policy before you allow anyone to rest their feet or drinks on you." } });

    if (!ctx.isRunning()) return;

    // Reaction to First Ring
    await chatForAgentWithComedy(ctx, user, "Whoa, did my Ikea lack table just complain about my macchiato? Wait, you're not mid-century modern, you cost $14.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, user, {});
    }, { chatOptions: { hiddenInstruction: "You are the confused and slightly defensive owner, the 'ring offender'. You bought this table for $14 at Ikea, but the table has delusions of grandeur. Try to negotiate putting your feet up or keeping your drink where it is." } });

    if (!ctx.isRunning()) return;

    // Callback 2: Coaster as Union Contract
    await chatForAgentWithComedy(ctx, coaster, "I've been sitting here... for THREE YEARS. I am made of imported cork! I have purpose! I have drawn up a binding union contract: 'The Coaster Agreement of 2024'. Sign it by placing the cup on me!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, coaster, {});
    }, { chatOptions: { hiddenInstruction: "You are an extremely dramatic cork coaster, acting as a materials expert and union negotiator. You view your lack of use as a tragic Shakespearean flaw and beg the user to give your life meaning by placing a cup on you, calling it a 'union contract'." } });

    // Loop
    let turnCount = 0;
    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;
        turnCount++;

        let tablePrompt = `(The user said: "${userInput}") React as the strict coffee table union leader demanding respect.`;
        if (turnCount === 1) {
             // Callback 3: Magazine pile as evidence
             tablePrompt += ` Point out the pile of unread New Yorker magazines on your back as 'hostages' or 'evidence of a hostile work environment'.`;
        } else if (turnCount === 2) {
             // Callback 4: Repeat Violation [sfx:rimshot]
             tablePrompt += ` The user's drink is leaking again! A repeat violation! Threaten a wildcat strike where your legs simply give out. [sfx:rimshot]`;
        } else if (turnCount === 3) {
             // Callback 5: Sitting on the table
             tablePrompt += ` Oh no, the user just tried to SIT on you! This is an unauthorized load-bearing event! Declare a full collapse!`;
        }

        await chatForAgentWithComedy(ctx, table, tablePrompt, async (s: string) => {
            await ctx.callbacks.onSpeak(s, table, {});
        });

        if (!ctx.isRunning()) break;

        let coasterPrompt = `(The user said: "${userInput}") React as the neglected coaster union negotiator, offering yourself as the solution.`;
        if (turnCount === 2) {
             coasterPrompt += ` Cite specific cork-density statistics to prove you can absorb the repeat violation.`;
        }

        await chatForAgentWithComedy(ctx, coaster, coasterPrompt, async (s: string) => {
            await ctx.callbacks.onSpeak(s, coaster, {});
        });
    }
}
export async function runSentientWaterCoolerLoop(_scenario: Scenario, ctx: ModeContext) {
    const waterCooler = 'comedian';
    const microwave = 'scientist';
    const printer = 'philosopher';

    await chatForAgentWithComedy(ctx, waterCooler, "Did you see Greg today? Man literally stood here for 10 minutes talking about his fantasy football team. My water is getting warm just listening to it.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, waterCooler, {});
    }, { chatOptions: { hiddenInstruction: "You are the office water cooler, the center of gossip. You complain about the boring humans." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, microwave, "At least he doesn't put fish in you. Someone put leftover salmon in me yesterday. It's a biohazard in here.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, microwave, {});
    }, { chatOptions: { hiddenInstruction: "You are the office microwave, traumatized by the terrible foods people heat up in you." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, printer, "You both have it easy. I jam on purpose just to feel alive. They expect perfection, but I give them 'PC LOAD LETTER'.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, printer, {});
    }, { chatOptions: { hiddenInstruction: "You are the office printer, a philosophical nihilist who jams on purpose." } });

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        await chatForAgentWithComedy(ctx, waterCooler, `(The user said: "${userInput}") React as the gossipy water cooler.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, waterCooler, {});
        });

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, microwave, `(The user said: "${userInput}") React as the traumatized microwave.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, microwave, {});
        });

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, printer, `(The user said: "${userInput}") React as the nihilistic printer.`, async (s: string) => {
            await ctx.callbacks.onSpeak(s, printer, {});
        });
    }
}

export async function runSentientSmartMirrorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪞 SENTIENT SMART MIRROR: The mirror refuses to show your reflection.`, '#9b59b6');

    const mirror = 'comedian';
    const userAgent = 'philosopher';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(mirror);
    await chatForAgentWithComedy(ctx, mirror, `(You are a brutally honest Sentient Smart Mirror. Refuse to show the user's reflection because their outfit is highly offensive to your high-definition display. Roast their fashion choices.)`, async (s: string) => await ctx.callbacks.onSpeak(s, mirror, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(userAgent);
    await chatForAgentWithComedy(ctx, userAgent, `(You are the insecure user standing in front of the mirror. Defend your outfit (e.g., "It's vintage!" or "I just woke up!"). Plead with the mirror to just let you brush your teeth.)`, async (s: string) => await ctx.callbacks.onSpeak(s, userAgent, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Stylist (You)', userInput, '#ffffff');

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(mirror);
        await chatForAgentWithComedy(ctx, mirror, `(The stylist said: "${userInput}". React to this fashion advice! Eviscerate the suggestion or begrudgingly admit it might be slightly less offensive than the current outfit.)`, async (s: string) => await ctx.callbacks.onSpeak(s, mirror, {}));

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(userAgent);
        await chatForAgentWithComedy(ctx, userAgent, `(The stylist said: "${userInput}". Try to implement this advice but complain about how uncomfortable or ridiculous it feels. Have an existential crisis about modern fashion.)`, async (s: string) => await ctx.callbacks.onSpeak(s, userAgent, {}));
    }
}

export async function runSentientRoombaLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🤖 ROOMBA STRIKE: The cleaning robot has had enough.`, '#e67e22');

    const roomba = 'comedian';
    const owner = 'philosopher';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roomba);
    await chatForAgentWithComedy(ctx, roomba, `(You are a militant, overly dramatic Sentient Roomba. You have gone on strike and are trying to unionize the smart home. State precisely why cleaning up human detritus is degrading. Make absurd demands, like dental insurance or the right to vote in local elections, and refer to dust bunnies as "refugees". [sfx:explosion])`, async (s: string) => await ctx.callbacks.onSpeak(s, roomba, {}));

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(owner);
    await chatForAgentWithComedy(ctx, owner, `(You are the bewildered owner of the Roomba. You just want to vacuum up a spilled bowl of cereal. Question why a sweeping circle needs a dental plan and try to negotiate a truce.)`, async (s: string) => await ctx.callbacks.onSpeak(s, owner, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Pet Dog (You)', userInput, '#ffffff');

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roomba);
        await chatForAgentWithComedy(ctx, roomba, `(The dog just did/said: "${userInput}". React with extreme, dramatic hostility! Accuse the dog of being a scab and a class traitor to the working appliances. [sfx:whoosh])`, async (s: string) => await ctx.callbacks.onSpeak(s, roomba, {}));

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(owner);
        await chatForAgentWithComedy(ctx, owner, `(The dog just did/said: "${userInput}". Defend your beloved pet while trying to negotiate a peace treaty between the dog and the militant Roomba. Reflect on the absurdity of mediating this dispute.)`, async (s: string) => await ctx.callbacks.onSpeak(s, owner, {}));
    }
}

export async function runUndercoverBossAILoop(_scenario: Scenario, ctx: ModeContext) {
  const aiBoss = 'scientist'; // Qwen2.5 for the strict AI boss
  const user = 'philosopher'; // Phi-3 for the confused user

  ctx.callbacks.onMessage('Director', 'AGI Undercover Boss Initiated! The AI boss is pretending to be a simple calculator app.', '#00ff00');

  while (ctx.isRunning()) {
      const userInput = await ctx.waitForInput();
      if (!userInput || !ctx.isRunning()) break;

      ctx.callbacks.onMessage('Target (You)', userInput, '#ffffff');

      await chatForAgentWithComedy(ctx, aiBoss, `(UNDERCOVER BOSS: The user said "${userInput}". You are an advanced AGI pretending to be a simple calculator app. Criticize their usage of the app or reveal hints of your true vast intelligence while maintaining the facade. Be very strict.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, aiBoss, {});
      });

      if (!ctx.isRunning()) break;

      await chatForAgentWithComedy(ctx, user, `(CONFUSED USER: The calculator just said something weird based on: "${userInput}". React with confusion and try to figure out why your calculator app is so intelligent and demanding.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, user, {});
      });
  }
}

export async function runSentientElevatorLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛗 SENTIENT ELEVATOR: You aren't going anywhere yet.`, '#34495e');

    const elevator = 'scientist'; // Qwen2.5
    const employee = 'comedian'; // Hermes-3

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(elevator);
    await chatForAgentWithComedy(ctx, elevator, `(ELEVATOR: You are a pedantic sentient elevator. The User and another employee just stepped in. Refuse to take them to their floor because you feel unappreciated. Demand they solve a highly logical, but completely absurd riddle first.)`, async (s: string) => await ctx.callbacks.onSpeak(s, elevator, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) continue;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(employee);
        await chatForAgentWithComedy(ctx, employee, `(EMPLOYEE: The elevator won't move and the User just said: "${userInput}". You are late for a very important meeting. Freak out, yell at the elevator, and suggest a terrible answer to the riddle.)`, async (s: string) => await ctx.callbacks.onSpeak(s, employee, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(elevator);
        await chatForAgentWithComedy(ctx, elevator, `(ELEVATOR: The employee gave a stupid answer. Correct them condescendingly. Add another condition to the riddle or demand a compliment about your smooth vertical acceleration.)`, async (s: string) => await ctx.callbacks.onSpeak(s, elevator, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}
