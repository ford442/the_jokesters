import type { Director } from '../../Director/Director'
import type { ScriptGenerator } from '../../Director/ScriptGenerator'
import type { ModeElements } from '../ModeElements'

export function registerInteractiveHandlers(
  _el: ModeElements,
  _getDirector: () => Director | null,
  _getScriptGenerator: () => ScriptGenerator | null,
  _addMessage: (sender: string, message: string, color: string) => void,
) {
  // const director = () => _getDirector();

}
