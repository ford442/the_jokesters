import type { Director } from '../Director/Director'
import type { ScriptGenerator } from '../Director/ScriptGenerator'
import type { ModeElements } from "./ModeElements";
import { resetModeUI } from './ModeElements'
import { registerImprovHandlers } from './handlers/ImprovHandlers'
import { registerInteractiveHandlers } from './handlers/InteractiveHandlers'
import { registerScriptHandlers } from './handlers/ScriptHandlers'
import { registerMiscHandlers } from './handlers/MiscHandlers'
import { registerDreamHandlers } from './handlers/DreamHandlers'

// Helper for simple mode switching
export function switchMode(btnId: string, controlsId: string, el: ModeElements, director: () => Director | null) {
  const btn = document.getElementById(btnId) as HTMLButtonElement;
  const controls = document.getElementById(controlsId) as HTMLDivElement;
  if (btn && controls) {
    btn.addEventListener('click', () => {
      resetModeUI(el);
      btn.classList.add('active');
      controls.style.display = 'block';
      const d = director();
      if (d && d.isSceneRunning()) d.stopScene();
    });
  }
}

export function registerModeHandlers(
  el: ModeElements,
  getDirector: () => Director | null,
  getScriptGenerator: () => ScriptGenerator | null,
  addMessage: (sender: string, message: string, color: string) => void,
) {
  registerImprovHandlers(el, getDirector, getScriptGenerator, addMessage);
  registerInteractiveHandlers(el, getDirector, getScriptGenerator, addMessage);
  registerScriptHandlers(el, getDirector, getScriptGenerator, addMessage);
  registerMiscHandlers(el, getDirector, getScriptGenerator, addMessage);
  registerDreamHandlers(el, getDirector, getScriptGenerator, addMessage);
}
