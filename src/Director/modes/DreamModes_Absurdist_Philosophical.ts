import { Scenario } from '../Director';
import { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Re-export philosophical absurdist functions split across two files
export * from './DreamModes_Absurdist_Philosophical_PartA';
export * from './DreamModes_Absurdist_Philosophical_PartB';

export async function runPhilosophicalPlumberLoop(_scenario: Scenario, ctx: ModeContext) {
  const plumber = 'philosopher'; // Phi-3 for the existential plumber
  const homeowner = 'comedian'; // Hermes-3 for the desperate homeowner

  ctx.callbacks.onMessage('Director', 'Philosophical Plumber Mode! The sink is broken, but so is reality.', '#00ccff');

  while (ctx.isRunning()) {
      const userInput = await ctx.waitForInput();
      if (!userInput || !ctx.isRunning()) break;

      ctx.callbacks.onMessage('Target (You)', userInput, '#ffffff');

      await chatForAgentWithComedy(ctx, plumber, `(EXISTENTIAL PLUMBER: The user said "${userInput}". You are a plumber fixing a sink, but you question whether the water leak is just a manifestation of the user's emotional baggage or a flaw in the universe. Be highly philosophical about the pipes.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, plumber, {});
      });

      if (!ctx.isRunning()) break;

      await chatForAgentWithComedy(ctx, homeowner, `(DESPERATE HOMEOWNER: The user said: "${userInput}" and the plumber is being weird. You are a desperate homeowner who just wants their sink fixed before the house floods. Freak out about the water damage while the plumber talks philosophy.)`, async (s: string) => {
          if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, homeowner, {});
      });
  }
}
