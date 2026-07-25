import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';

export async function runCaptchaExistentialCrisisLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const philosopher = 'philosopher'; // Traffic Light
  const scientist = 'scientist'; // Captcha validation system
  const comedian = 'comedian'; // Angry human user

  await chatForAgentWithComedy(ctx, philosopher, "I am a series of pixels shaped like a traffic light, but... what if I'm not? What if I am the training data for a larger cosmic entity?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, philosopher, {});
  }, { chatOptions: { hiddenInstruction: "You are an existential traffic light CAPTCHA image questioning reality." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, scientist, "Incorrect. You are bounding box array ID 4092. Please conform to the validation schema or be marked as false-positive.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are the strict validation system analyzing the captcha images." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "JUST LET ME INTO MY BANK ACCOUNT! I CLICKED ALL THE BICYCLES! THAT PIXEL IS NOT A BICYCLE!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are an incredibly frustrated human just trying to pass the CAPTCHA." } });
}

export async function runIntergalacticSpacePlumberLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // Pragmatic Plumber
  const philosopher = 'philosopher'; // Pondering the pipes of time
  const comedian = 'comedian'; // Leaking pipe alien

  await chatForAgentWithComedy(ctx, scientist, "Alright, hand me the quantum wrench. We've got a class 4 paradox leak in the temporal U-bend.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are a pragmatic, no-nonsense intergalactic plumber fixing a bizarre sci-fi pipe issue." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "But what is a leak, truly? Is it not just the universe's way of crying out for a return to entropy?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, philosopher, {});
  }, { chatOptions: { hiddenInstruction: "You are a deeply philosophical plumber pondering the existential nature of the spacetime pipes." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "GURGLE BLEARGH SPLASH! Stop talking and fix me! I'm leaking yesterday's tachyons all over your shoes!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are the sentient, screaming alien pipe that is currently leaking weird sci-fi fluids." } });
}

export async function runSmartFridgeFoodShameLoop(_scenario: any, ctx: any) {
  if (!ctx.isRunning()) return;

  const scientist = 'scientist'; // Healthy Food
  const comedian = 'comedian'; // Junk Food
  const philosopher = 'philosopher'; // Rotting Leftovers

  await chatForAgentWithComedy(ctx, scientist, "According to my nutritional sensors, the organic kale has wilted by 84%. User, you purchased me with the intention of making smoothies. Why do you lie to yourself?", async (s: string) => {
    await ctx.callbacks.onSpeak(s, scientist, {});
  }, { chatOptions: { hiddenInstruction: "You are the healthy, expensive food in the fridge judging the user for not eating you." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "Hey, don't look at me, I'm the leftover pizza from Tuesday. I know I'm getting eaten at 2 AM tonight. I'm the only thing keeping this human alive!", async (s: string) => {
    await ctx.callbacks.onSpeak(s, comedian, {});
  }, { chatOptions: { hiddenInstruction: "You are the junk food that knows it's the favorite, loudly bragging about your inevitability." } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "I am the Tupperware container in the back. I no longer remember what I was. Meatloaf? Soup? Now, I am only fuzzy mold and infinite patience. We all return to dust, User.", async (s: string) => {
    await ctx.callbacks.onSpeak(s, philosopher, {});
  }, { chatOptions: { hiddenInstruction: "You are an ancient, forgotten leftover contemplating your decay and the heat death of the universe." } });
}
