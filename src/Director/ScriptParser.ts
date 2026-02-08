import { type Scenario, type ScriptBeat } from './Director';

export class ScriptParser {
    public parse(json: string): Scenario {
        try {
            const data = JSON.parse(json);

            if (data.type !== 'script' && data.type !== 'reaction') {
                // Allow reaction type as well for Watcher mode
                 // But for strict ScriptParser, maybe just script?
                 // The plan said "Create ScriptParser to read JSON scripts".
                 // But I also need to load Watcher mode JSON.
                 // Let's make it a generic ScenarioParser or handle both.
            }

            // Basic validation
            if (!data.title || !data.description) {
                throw new Error('Scenario must have title and description');
            }

            if (data.type === 'script') {
                if (!Array.isArray(data.script)) {
                    throw new Error('Script scenario must have a "script" array');
                }
                // Map to Director's Scenario structure
                return {
                    type: 'script',
                    title: data.title,
                    description: data.description,
                    config: {
                        generatedScript: data.script as ScriptBeat[]
                    }
                };
            } else if (data.type === 'reaction') {
                 // Pass through for reaction type, assuming config matches
                 return data as Scenario;
            }

            return data as Scenario;
        } catch (e) {
            console.error('Failed to parse scenario:', e);
            throw new Error('Failed to parse scenario JSON');
        }
    }
}
