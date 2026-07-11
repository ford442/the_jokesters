import os

filepath = "src/Director/modes/DreamModes_Tech.ts"

with open(filepath, "r") as f:
    content = f.read()

new_loops = """

export async function runPhilosophicalElevatorPitchLoop(_scenario: Scenario, ctx: ModeContext) {
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "a decentralized app for sharing memories";

  await ctx.manager.chatForAgent(scientist, "We are falling at 9.8 meters per second squared. I estimate we have roughly 8 seconds until impact.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'You are explaining the physics of the fall.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(philosopher, "What does it mean to fall, really? Are we not all falling through time?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'You are pondering the pitch and the fall.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(comedian, `Listen, before we die, you have to hear my pitch for ${topic}! It's going to disrupt everything!`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'You are a frantic founder pitching your startup.' });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(scientist, `If you factor in wind resistance... we might have 10 seconds. Your user acquisition strategy is fundamentally flawed.`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'Criticize the startup using physics analogies.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(philosopher, "If the startup fails in a vacuum, does it make a sound?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'Question the existence of the startup.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(comedian, "We just need a bridge round! Just a bridge round!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'Beg for money as you plummet.' });
  }
}

export async function runPhilosophicalDebuggingLoop(_scenario: Scenario, ctx: ModeContext) {
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "a null pointer exception";

  await ctx.manager.chatForAgent(scientist, `I am the compiler. I have analyzed the abstract syntax tree and found a fatal error: ${topic}.`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'You are a strict, literal compiler.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(philosopher, "I am the programmer. But what is a pointer, really? Is it not just a metaphor for our desire to connect?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'You are a programmer who refuses to write code and only philosophizes about errors.' });
  if (!ctx.isRunning()) return;

  await ctx.manager.chatForAgent(comedian, "I am the runtime. I'M PANICKING! EVERYTHING IS ON FIRE! ABORT! CORE DUMP!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'You are a terrified runtime environment crashing.' });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(scientist, "The type system cannot be reasoned with. You must define the interface.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { hiddenInstruction: 'Demand strict typing.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(philosopher, "If I cast it to an `any`, do I not free it from the tyranny of structure?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { hiddenInstruction: 'Argue for untyped chaos as a form of liberation.' });
    if (!ctx.isRunning()) break;
    await ctx.manager.chatForAgent(comedian, "I'M LEAKING MEMORY! TELL MY WIFE I LOVE HER!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { hiddenInstruction: 'Die a dramatic death as a process.' });
  }
}

"""

with open(filepath, "a") as f:
    f.write(new_loops)
