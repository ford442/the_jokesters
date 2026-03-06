import { GroupChatManager, type Message } from '../GroupChatManager';
import type { ScriptBeat } from './Director';

export class ScriptGenerator {
    private manager: GroupChatManager;

    constructor(manager: GroupChatManager) {
        this.manager = manager;
    }

    public async generate(topic: string): Promise<ScriptBeat[]> {
        const systemPrompt = `You are an expert scriptwriter for a comedy show involving three characters:
1. The Comedian (Female, frantic, high energy)
2. The Philosopher (Cynical, pretentious, slow)
3. The Scientist (Literal, dry, unintentionally funny)

Your task is to write a short script (approx 10-15 lines) about the following topic: "${topic}".

Format your response as a strict JSON array of objects, where each object has "speaker" (one of the IDs: "comedian", "philosopher", "scientist") and "line" (the dialogue).

Example format:
[
  { "speaker": "comedian", "line": "Why did the chicken cross the road?" },
  { "speaker": "scientist", "line": "To maximize its displacement vector." }
]

Do not include any markdown formatting or explanation. Just the JSON array.`;

        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Write a script about: ${topic}` }
        ];

        try {
            const response = await (this.manager.completion as any)(messages, {
                maxTokens: 1024,
                temperature: 0.8,
                jsonMode: true
            });

            // Clean response (sometimes models add markdown backticks despite instructions)
            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
            }

            const script = JSON.parse(cleaned) as ScriptBeat[];

            // Validate script
            if (!Array.isArray(script)) {
                throw new Error("Generated script is not an array");
            }

            return script.map(beat => ({
                speaker: beat.speaker.toLowerCase(),
                line: beat.line
            }));

        } catch (error) {
            console.error('Script generation failed:', error);
            throw new Error('Failed to generate script. Please try again.');
        }
    }
}
