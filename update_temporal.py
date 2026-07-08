import os

filepath = "src/Director/modes/DreamModes_Temporal.ts"

with open(filepath, "r") as f:
    content = f.read()

new_loops = """

export async function runTimeTravelingHOAPresidentLoop(_scenario: Scenario, ctx: ModeContext) {
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "parking a TARDIS on the lawn";

  await ctx.manager.chatForAgent(scientist, "According to section 4, paragraph B, temporal displacement vehicles must be parked in the driveway, NOT on the grass.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'You are a strict, rules-lawyer HOA president.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(philosopher, "But what is grass? Is it not just a temporary collection of atoms? And what is time but a construct?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'You are a time traveler trying to philosophize your way out of a fine.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(comedian, `I don't care about ${topic}! Your house is from 1842, it violates the modern color palette guidelines!`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'You are a chaotic neighbor who hates the time traveler and the HOA.' });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(scientist, "I am issuing a citation for creating a paradox in a residential zone. That's a $50 fine.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'Issue absurd fines for time travel.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(philosopher, "I will simply go back in time and prevent this HOA from being formed.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'Threaten to erase the HOA from history.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(comedian, "Do it! Erase Brenda! She stole my tupperware in 2004!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'Encourage the time traveler to cause chaos.' });
  }
}

"""

with open(filepath, "a") as f:
    f.write(new_loops)
