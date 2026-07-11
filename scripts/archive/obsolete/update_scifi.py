import os

filepath = "src/Director/modes/DreamModes_Scifi.ts"

with open(filepath, "r") as f:
    content = f.read()

new_loops = """

export async function runAlienAbductionSupportGroupLoop(_scenario: Scenario, ctx: ModeContext) {
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "being probed on a Tuesday";

  await ctx.manager.chatForAgent(scientist, "According to my calculations, the tractor beam utilized a localized gravimetric distortion. Fascinating tech.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'You are a logical alien disguised as a human in the support group.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(philosopher, "But why did they choose us? Are we cosmic chosen ones, or merely space dust in their galactic wind?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'You are an abductee seeking deep cosmic meaning.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(comedian, `I don't care why they took us! I had to miss my dentist appointment for ${topic}! Do you know how hard it is to reschedule?`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'You are an abductee who is just annoyed about the inconvenience.' });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(scientist, "The probing is actually a standard biometric calibration. Nothing to be alarmed about.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'Defend the aliens.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(philosopher, "Perhaps the probe is a metaphor for the intrusive nature of modern society.", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'Find deep meaning in the probing.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(comedian, "They validated my parking but didn't even give me a snack on the ship. Zero stars on Yelp.", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'Complain about the customer service of the aliens.' });
  }
}

"""

with open(filepath, "a") as f:
    f.write(new_loops)
