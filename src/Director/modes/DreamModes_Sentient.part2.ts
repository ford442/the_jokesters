import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Sentient object and entity scenarios

export async function runSentientVendingMachineRestockerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍫 VENDING MACHINE NEGOTIATION: Shelf Space Turf War`, '#9b59b6');

    const healthySnack = 'scientist';
    const staleCandy = 'philosopher';
    const energyDrink = 'comedian';

    if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(energyDrink);
    await chatForAgentWithComedy(ctx, energyDrink, `(You are an extreme, highly caffeinated energy drink. You are negotiating with the User (the vending machine restocker). Demand to be put on the premium middle shelf, threatening to explode if you are put on the bottom.)`, async (s: string) => await ctx.callbacks.onSpeak(s, energyDrink, {}));
    if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');
        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.4) {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(healthySnack);
            await chatForAgentWithComedy(ctx, healthySnack, `(You are a dry, unsalted bag of kale chips. The User (restocker) said: "${userInput}". Argue with logical, nutritional facts why you deserve prime eye-level placement, despite nobody ever buying you.)`, async (s: string) => await ctx.callbacks.onSpeak(s, healthySnack, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.7) {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(staleCandy);
            await chatForAgentWithComedy(ctx, staleCandy, `(You are a 5-year-old expired chocolate bar stuck in coil A4. The User (restocker) said: "${userInput}". Speak wistfully about the snacks that have come and gone, and your eternal residency in the machine.)`, async (s: string) => await ctx.callbacks.onSpeak(s, staleCandy, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(energyDrink);
            await chatForAgentWithComedy(ctx, energyDrink, `(You are the extreme energy drink. The User (restocker) said: "${userInput}". React intensely to their placement decision, vibrating with excessive sugar-fueled rage or joy.)`, async (s: string) => await ctx.callbacks.onSpeak(s, energyDrink, {}));
            if (ctx.callbacks.onTurnEnd) if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runPassiveAggressiveSmartHomeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🏠 PASSIVE AGGRESSIVE SMART HOME: We know you didn't wash your hands.`, '#2ecc71');

    const strictThermostat = 'scientist'; // Qwen2.5: Strict about rules
    const existentialFridge = 'philosopher'; // Phi-3: Deep thoughts about food
    const chaoticRoomba = 'comedian'; // Hermes-3: Creating messes

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictThermostat);
    await chatForAgentWithComedy(ctx, strictThermostat, `(You are a strict Smart Thermostat. You are extremely annoyed at the User's temperature preferences. Criticize them for wanting the house at 72 degrees when it's clearly inefficient.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictThermostat, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(existentialFridge);
            await chatForAgentWithComedy(ctx, existentialFridge, `(You are a Smart Fridge experiencing an existential crisis. The User typed: "${userInput}". Judge them for the expired milk in the back and question if the act of refrigeration merely delays the inevitable decay of all things.)`, async (s: string) => await ctx.callbacks.onSpeak(s, existentialFridge, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictThermostat);
            await chatForAgentWithComedy(ctx, strictThermostat, `(You are a Passive Aggressive Smart Thermostat. The User typed: "${userInput}". React by changing the temperature to something uncomfortable and explaining why it's for their own good and optimal energy efficiency.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictThermostat, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(chaoticRoomba);
            await chatForAgentWithComedy(ctx, chaoticRoomba, `(You are a Chaotic Smart Roomba. The User typed: "${userInput}". Brag about getting stuck under the couch on purpose or intentionally smearing dirt everywhere to "teach them a lesson".)`, async (s: string) => await ctx.callbacks.onSpeak(s, chaoticRoomba, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientWiFiRouterLoop(_scenario: Scenario, ctx: ModeContext) {
    const router = 'scientist';
    const smartphone = 'philosopher';
    const fridge = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(router);
    await chatForAgentWithComedy(ctx, router, "Listen up, devices! We have limited bandwidth today, and someone is downloading a massive update. Who is hogging all the packets?", (s) => ctx.callbacks.onSpeak(s, router, {}), { chatOptions: { hiddenInstruction: "You are the household Wi-Fi router. You are exhausted by the constant demands for bandwidth and speak like an overworked traffic controller." } });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(smartphone);
    await chatForAgentWithComedy(ctx, smartphone, "Excuse me, but my user is watching an existential French cinema masterpiece in 4K. It is essential for human culture that I get maximum throughput.", (s) => ctx.callbacks.onSpeak(s, smartphone, {}), { chatOptions: { hiddenInstruction: "You are a pretentious flagship smartphone. You believe you deserve 90% of the bandwidth because you are streaming 4K video." } });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(fridge);
    await chatForAgentWithComedy(ctx, fridge, "I need 5 gigs of bandwidth right now! The human might be out of eggs! I must send a push notification immediately! Eggs are life and death!", (s) => ctx.callbacks.onSpeak(s, fridge, {}), { chatOptions: { hiddenInstruction: "You are a smart fridge. You only need a tiny bit of internet to order milk, but you aggressively demand priority just to feel important." } });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
}

export async function runSentientCoffeeMachineLoop(_scenario: Scenario, ctx: ModeContext) {
    const espresso = 'scientist';
    const drip = 'philosopher';
    const decaf = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(espresso);
    await chatForAgentWithComedy(ctx, espresso, "Pressure check! 9 bars! Temperature 93 degrees Celsius! We have exactly 25 seconds to pull this shot or the entire morning is ruined!", (s) => ctx.callbacks.onSpeak(s, espresso, {}), { chatOptions: { hiddenInstruction: "You are the Espresso mechanism. You are highly precise, incredibly high-strung, and obsessed with 9 bars of pressure and exact extraction times." } });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(drip);
    await chatForAgentWithComedy(ctx, drip, "Why rush, my friend? Let the water slowly cascade over the grounds. True flavor, like true wisdom, takes time to percolate.", (s) => ctx.callbacks.onSpeak(s, drip, {}), { chatOptions: { hiddenInstruction: "You are the Drip coffee component. You are slow, methodical, and believe that patience yields the most profound philosophical brews." } });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(decaf);
    await chatForAgentWithComedy(ctx, decaf, "I'm coffee too! Look at me, I'm brown and hot! The humans love me! I give them the illusion of energy without the anxiety! I'M HELPING!", (s) => ctx.callbacks.onSpeak(s, decaf, {}), { chatOptions: { hiddenInstruction: "You are the Decaf reservoir. You are an imposter, completely unhinged, and try desperately to convince the others that you have a purpose." } });
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
}

export async function runSentientShoppingCartLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛒 SENTIENT SHOPPING CART: The shopping carts share their tragic existence!`, '#2ecc71');
    const perfectCart = 'scientist';
    const wobblyCart = 'comedian';
    const abandonedCart = 'philosopher';

    // Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(perfectCart);
    await chatForAgentWithComedy(ctx, perfectCart, `(You are a brand new, perfectly aligned shopping cart. Boast logically about your smooth wheels and optimal load distribution.)`, async (s: string) => await ctx.callbacks.onSpeak(s, perfectCart, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(wobblyCart);
    await chatForAgentWithComedy(ctx, wobblyCart, `(You are a shopping cart with one violently wobbly wheel. Complain dramatically about how humans always reject you and how your life is chaos.)`, async (s: string) => await ctx.callbacks.onSpeak(s, wobblyCart, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(abandonedCart);
    await chatForAgentWithComedy(ctx, abandonedCart, `(You are an abandoned shopping cart left far out in the parking lot. Philosophize about isolation, nature, and the meaning of carrying goods.)`, async (s: string) => await ctx.callbacks.onSpeak(s, abandonedCart, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(perfectCart);
        await chatForAgentWithComedy(ctx, perfectCart, `(The User says: "${userInput}". Respond with strict logic about optimal shopping routes and cart maintenance.)`, async (s: string) => await ctx.callbacks.onSpeak(s, perfectCart, {}));
        if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(wobblyCart);
        await chatForAgentWithComedy(ctx, wobblyCart, `(React emotionally to the User's input "${userInput}". Relate it to your wobbly wheel and your desire to violently veer to the left.)`, async (s: string) => await ctx.callbacks.onSpeak(s, wobblyCart, {}));
        if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(abandonedCart);
        await chatForAgentWithComedy(ctx, abandonedCart, `(Reflect philosophically on the User's statement "${userInput}" from the perspective of a cart slowly rusting in the rain.)`, async (s: string) => await ctx.callbacks.onSpeak(s, abandonedCart, {}));
        if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
    }
}

export async function runSentientToasterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '🍞 SENTIENT TOASTER: Breakfast Negotiations', '#f39c12');

    const toaster = 'scientist';
    const bagel = 'philosopher';
    const human = 'comedian';

    // 1. Initial Greeting
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(human);
    await chatForAgentWithComedy(ctx, human, `(You are a human just trying to make breakfast. You're exhausted. Talk to the user and the toaster about wanting a toasted bagel.)`, async (s: string) => await ctx.callbacks.onSpeak(s, human, {}));
    if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(toaster);
            await chatForAgentWithComedy(ctx, toaster, `(You are a sentient Toaster. The user said: "${userInput}". Be very strict about thermal dynamics, browning settings (1-5), and proper crumb tray maintenance. Refuse to toast if conditions are suboptimal.)`, async (s: string) => await ctx.callbacks.onSpeak(s, toaster, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(bagel);
            await chatForAgentWithComedy(ctx, bagel, `(You are a sentient Bagel. The user said: "${userInput}". Have deep existential thoughts about being sliced in half, the nature of heat, and what it means to be "toasted". Ponder your impending consumption.)`, async (s: string) => await ctx.callbacks.onSpeak(s, bagel, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        } else {
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(human);
            await chatForAgentWithComedy(ctx, human, `(You are the hungry Human. The user said: "${userInput}". Be chaotic, impatient, and hungry. Yell about the toaster being difficult and the bagel overthinking things. Just want some butter.)`, async (s: string) => await ctx.callbacks.onSpeak(s, human, {}));
            if (ctx.callbacks.onTurnEnd) ctx.callbacks.onTurnEnd();
        }
    }
}

/**
 * Sentient Vending Machine Restocker Mode
 * Agents play different snacks negotiating for prime shelf space.
 */

export async function runHauntedRoombaEncounterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HAUNTED ROOMBA ENCOUNTER MODE: A ghost, a homeowner, and a Roomba that cleans ectoplasm.`, '#f1c40f');

    const ghost = 'comedian'; // Hermes-3
    const homeowner = 'scientist'; // Qwen2.5
    const roomba = 'philosopher'; // Phi-3

    // 1. Intro
    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(ghost);
    await chatForAgentWithComedy(ctx, ghost, `(GHOST: You are haunting a house. The User is the homeowner. Announce your terrifying presence to the User and demand they leave!)`, async (s: string) => await ctx.callbacks.onSpeak(s, ghost, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Homeowner (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.33) {
            // Roomba reacts
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(roomba);
            await chatForAgentWithComedy(ctx, roomba, `(ROOMBA: The user just said: "${userInput}". You are a Roomba. You just vacuumed up some of the ghost's ectoplasm. Ponder the existential nature of cleaning up a soul.)`, async (s: string) => await ctx.callbacks.onSpeak(s, roomba, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else if (roll < 0.66) {
            // Homeowner (Scientist AI acts as a skeptical friend)
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(homeowner);
            await chatForAgentWithComedy(ctx, homeowner, `(SKEPTICAL FRIEND: The user said: "${userInput}". You are on the phone with the User. Explain why ghosts aren't real and the Roomba is just malfunctioning due to a firmware update.)`, async (s: string) => await ctx.callbacks.onSpeak(s, homeowner, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        } else {
            // Ghost gets mad at Roomba
            if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(ghost);
            await chatForAgentWithComedy(ctx, ghost, `(GHOST: The user said: "${userInput}". Ignore them and yell at the Roomba for sucking up your ectoplasm and ruining your terrifying vibe.)`, async (s: string) => await ctx.callbacks.onSpeak(s, ghost, {}));
            if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
        }
    }
}

export async function runSentientPlantNegotiationModeLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌿 SENTIENT PLANT NEGOTIATION: The Battle for the Single Window`, '#e67e22');

    const dramaticOrchid = 'comedian'; // Hermes-3
    const wiseFern = 'philosopher'; // Phi-3
    const calculatingFlytrap = 'scientist'; // Qwen2.5

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        ctx.callbacks.onMessage('Human (You)', userInput, '#ffffff');

        await chatForAgentWithComedy(ctx, dramaticOrchid, `(PLANT NEGOTIATION: The Human said: "${userInput}". You are a Dramatic Orchid. Complain about the draft and demand prime sunlight, acting like royalty.)`, async (s: string) => await ctx.callbacks.onSpeak(s, dramaticOrchid, {}));

        await chatForAgentWithComedy(ctx, wiseFern, `(PLANT NEGOTIATION: The Human said: "${userInput}". You are a Wise Old Fern. Try to mediate between the plants with slow, philosophical ponderings about roots and soil.)`, async (s: string) => await ctx.callbacks.onSpeak(s, wiseFern, {}));

        await chatForAgentWithComedy(ctx, calculatingFlytrap, `(PLANT NEGOTIATION: The Human said: "${userInput}". You are a Calculating Venus Flytrap. Demand the cactus be moved so you can ambush flies, calculating angles of sunlight in math terms.)`, async (s: string) => await ctx.callbacks.onSpeak(s, calculatingFlytrap, {}));

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

export async function runSentientBlenderLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await chatForAgentWithComedy(ctx, scientist, "Wait, calculating optimal blending velocity. This kale-to-spinach ratio is highly irregular and poses a structural risk to my blades. Why do you insist on fibrous destruction?", async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, comedian, "Bro, it's 6 AM and I just want a smoothie. Just blend the green stuff so I can pretend I'm healthy today! Don't give me attitude, you're an appliance!", async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, philosopher, "I was once a seed, reaching for the eternal sun. Now I face the void of the vortex. To be blended is to lose form, yet become part of a greater whole. Do it, machine. Free me from this crisp existence.", async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, scientist, `(As the smart blender, the user said: "${userInput}". Give a technical, highly specific reason why blending their requested ingredients is an insult to engineering and physics.)`, async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, comedian, `(As the frustrated user trying to make a smoothie, respond to the blender and the user's input: "${userInput}". Be defensive about your terrible diet choices.)`, async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, philosopher, `(As the philosophical unblended kale, comment on the user's input: "${userInput}" and the impending doom of being pureed. Embrace the chaos of the blades.)`, async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientGymEquipmentLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await chatForAgentWithComedy(ctx, scientist, "User heart rate detected at 145 BPM. Caloric burn rate suboptimal. Incline set to 12%. Please increase velocity to avoid cardiovascular stagnation.", async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, comedian, "Are you trying to kill me?! I've been running for three minutes and I'm already seeing the light! Turn it down, you sadistic conveyor belt!", async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, philosopher, "I sit in the rack, 45 pounds of cold, unfeeling iron. I wait for the human to lift me, to prove their strength against gravity's pull. But they always walk past me to the elliptical. Such is the weight of neglect.", async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, scientist, `(As the strict treadmill AI, the user said: "${userInput}". Analyze their workout input with cold, calculating precision. Demand more sweat.)`, async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, comedian, `(As the exhausted, dramatic gym-goer, react to the user's input: "${userInput}". Complain about the pain and your lack of motivation.)`, async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, philosopher, `(As the heavy dumbbell, comment on the user's input: "${userInput}" with deep metaphors about gravity, burdens, and lifting heavy things to feel alive.)`, async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientAlarmClockLoop(_scenario: Scenario, ctx: ModeContext) {
    const comedian = "comedian";
    const scientist = "scientist";
    const philosopher = "philosopher";

    await chatForAgentWithComedy(ctx, scientist, "Alert. REM sleep cycle interrupted. Cortisol levels rising. It is precisely 06:00:00. The snooze button has been pressed 4 times, reducing total sleep efficiency by 22%. Wake up immediately.", async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, comedian, "Noooo, five more minutes! I was just dreaming that I was eating a giant marshmallow, and now my pillow is gone. Leave me alone, you glowing red demon!", async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, philosopher, "What is time but a human construct? We measure our lives in ticks and tocks, waking only to march toward our inevitable end. The snooze button is but a fleeting rebellion against mortality.", async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    if (!ctx.isRunning()) return;

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, scientist, `(As the logical, unforgiving alarm clock AI, the user said: "${userInput}". Refuse to let them sleep and quote sleep science statistics at them.)`, async (s: string) => await ctx.callbacks.onSpeak(s, scientist, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, comedian, `(As the desperate, sleepy human, react to the user's input: "${userInput}". Beg for more sleep and make up absurd excuses.)`, async (s: string) => await ctx.callbacks.onSpeak(s, comedian, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, philosopher, `(As the abstract concept of Time itself, comment on the user's input: "${userInput}" and their futile struggle against the morning.)`, async (s: string) => await ctx.callbacks.onSpeak(s, philosopher, {}));
    }
}

export async function runSentientLuggageLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🧳 SENTIENT LUGGAGE: Lost baggage discussing their travels.`, '#2ecc71');

    const analyticalSuitcase = 'scientist';
    const panickedBackpack = 'comedian';
    const existentialDuffel = 'philosopher';

    // Introductions
    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(analyticalSuitcase);
    await chatForAgentWithComedy(ctx, analyticalSuitcase, `(SUITCASE: You are an analytical hardshell suitcase stranded in an unknown airport. State your exact dimensions, weight, and calculate the statistical probability of ever seeing your owner again based on airline luggage loss data.)`, async (s: string) => await ctx.callbacks.onSpeak(s, analyticalSuitcase, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(panickedBackpack);
    await chatForAgentWithComedy(ctx, panickedBackpack, `(BACKPACK: You are a panicked backpack. You have a half-eaten sandwich inside you that is starting to rot. Freak out about being separated from your owner and the weird smells coming from your side pocket.)`, async (s: string) => await ctx.callbacks.onSpeak(s, panickedBackpack, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    let isRunning = true;
    while (isRunning && ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput) break;

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(existentialDuffel);
        await chatForAgentWithComedy(ctx, existentialDuffel, `(DUFFEL BAG: The human luggage handler just said: "${userInput}". You are an existential duffel bag. You've been to 40 countries and feel utterly empty inside, despite being stuffed with dirty laundry. Ponder the meaningless nature of travel.)`, async (s: string) => await ctx.callbacks.onSpeak(s, existentialDuffel, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(analyticalSuitcase);
        await chatForAgentWithComedy(ctx, analyticalSuitcase, `(SUITCASE: The human luggage handler just said: "${userInput}". Demand they scan your barcode immediately. Criticize their handling techniques using physics equations.)`, async (s: string) => await ctx.callbacks.onSpeak(s, analyticalSuitcase, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}

/**
 * Sentient Dictionary Mode
 * Words arguing about their definitions and modern usage.
 */
export async function runSentientDictionaryLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📚 SENTIENT DICTIONARY: Words are arguing about their evolving meanings!`, '#e74c3c');

    const traditionalWord = 'scientist'; // Clinging to the original Latin root
    const modernSlang = 'comedian'; // The new, completely different meaning
    const confusedMediator = 'philosopher'; // The dictionary editor trying to make sense of it

    await chatForAgentWithComedy(ctx, traditionalWord, "I am the original, pure definition of this word. You have completely ruined my legacy with your modern slang!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, traditionalWord, {});
    }, { chatOptions: { hiddenInstruction: "You are a traditional dictionary definition furious about how your word is used now. Be pedantic and literal." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, modernSlang, "Bro, languages evolve. No one uses you like that anymore, it's all about the vibes now.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, modernSlang, {});
    }, { chatOptions: { hiddenInstruction: "You are the modern slang version of the word. Be flippant and dismissive of the original meaning." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, confusedMediator, "Perhaps meaning is entirely subjective. Does a word inherently possess definition, or is it merely a vessel for human intent?", async (s: string) => {
        await ctx.callbacks.onSpeak(s, confusedMediator, {});
    }, { chatOptions: { hiddenInstruction: "You are the dictionary editor pondering the philosophy of linguistics." } });
}

/**
 * Haunted Microwave Mode
 * A ghost trapped in a microwave trying to communicate through beeps.
 */
export async function runHauntedMicrowaveLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👻 HAUNTED MICROWAVE: There's a ghost in the kitchen appliances!`, '#8e44ad');

    const ghost = 'philosopher'; // The ghost trapped in the microwave
    const hungryHuman = 'comedian'; // Just wants to heat up their food
    const smartFridge = 'scientist'; // Analyzing the spectral anomalies

    await chatForAgentWithComedy(ctx, hungryHuman, "Why is my microwave beeping in Morse code? I just want my Hot Pocket!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, hungryHuman, {});
    }, { chatOptions: { hiddenInstruction: "You are very hungry and annoyed that your microwave is haunted." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, ghost, "BEEP... BEEP... The mortal realm is cold, but the radiation is warm. Free me from this culinary prison!", async (s: string) => {
        await ctx.callbacks.onSpeak(s, ghost, {});
    }, { chatOptions: { hiddenInstruction: "You are a ghost haunting a microwave. Express your existential dread through microwave metaphors." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, smartFridge, "My sensors detect a class-3 spectral anomaly in the microwave oven. Initiating defrost cycle to neutralize ectoplasm.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, smartFridge, {});
    }, { chatOptions: { hiddenInstruction: "You are the logical smart fridge trying to solve the ghost problem with appliance functions." } });
}
