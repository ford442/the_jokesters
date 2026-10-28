import type { GroupChatManager } from '../GroupChatManager';
import type { ScriptBeat } from './Director';
import { BeatOutlineSchema } from '../llm/structured/schemas';

/**
 * Scripted-scene generator on top of schema-constrained output (#400 C): the beat outline is
 * grammar-constrained on MLC / llama.cpp and validated (with one retry) everywhere else.
 */
export class ScriptGenerator {
    private manager: GroupChatManager;

    constructor(manager: GroupChatManager) {
        this.manager = manager;
    }

    public async generate(topic: string): Promise<ScriptBeat[]> {
        const agents = this.manager.getAgents();
        const cast = agents.map((a) => `- "${a.id}": ${a.name}`).join('\n');
        const systemPrompt =
            `You are an expert scriptwriter for a comedy show. The cast (speaker ids):\n${cast}\n\n` +
            `Write a short script (10-15 lines) about the topic. Each beat has "speaker" ` +
            `(one of the ids above) and "line" (the dialogue).`;

        const result = await this.manager.completeStructured(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Write a script about: ${topic}` },
            ],
            BeatOutlineSchema,
            { max_tokens: 1024, temperature: 0.8, stream: false },
        );
        if (!result.ok) {
            console.error('Script generation failed:', result.error);
            throw new Error('Failed to generate script. Please try again.');
        }

        const idByLower = new Map(agents.map((a) => [a.id.toLowerCase(), a.id]));
        return result.data.beats
            .map((beat) => ({ speaker: idByLower.get(beat.speaker.trim().toLowerCase()) ?? '', line: beat.line.trim() }))
            .filter((beat) => beat.speaker && beat.line.length > 0);
    }
}
