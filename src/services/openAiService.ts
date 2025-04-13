import OpenAI from 'openai';
import { MusicalIdea, GeneratedMusic } from '../types/music';
import { neo4jService } from './neo4jService';

class OpenAiService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    private async generateContextFromKnowledgeGraph(idea: MusicalIdea): Promise<string> {
        const context: string[] = [];

        if (idea.genre) {
            const genreInfo = await neo4jService.getGenreCharacteristics(idea.genre);
            if (genreInfo) {
                context.push(`Genre: ${idea.genre} typically uses tempos between ${genreInfo.typicalTempo.min}-${genreInfo.typicalTempo.max} BPM.`);
            }
        }

        if (idea.mood) {
            const scales = await neo4jService.findScalesByMood(idea.mood);
            if (scales.length > 0) {
                context.push(`Recommended scales for ${idea.mood.join(', ')} mood: ${scales.map(s => s.name).join(', ')}`);
            }
        }

        if (idea.scale) {
            const chords = await neo4jService.getRelatedChords(idea.scale);
            if (chords.length > 0) {
                context.push(`Common chords in this scale: ${chords.map(c => c.name).join(', ')}`);
            }
        }

        return context.join('\n');
    }

    async generateMusic(musicalIdea: MusicalIdea): Promise<GeneratedMusic> {
        const context = await this.generateContextFromKnowledgeGraph(musicalIdea);
        
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a music composition assistant that generates MIDI-compatible musical sequences based on provided musical ideas and theory context."
                },
                {
                    role: "user",
                    content: `Generate a musical piece with the following context:\n${context}\n\nRequirements:
                    - Genre: ${musicalIdea.genre || 'Any'}
                    - Mood: ${musicalIdea.mood?.join(', ') || 'Any'}
                    - Tempo: ${musicalIdea.tempo || 'Appropriate for genre'}
                    - Scale: ${musicalIdea.scale || 'Any appropriate for mood'}
                    - Complexity Level: ${musicalIdea.complexity || 5}/10`
                }
            ]
        });

        // For now, returning a mock MIDI data - in reality, this would be actual MIDI data
        // generated based on the GPT response
        return {
            midi: "base64_encoded_midi_data",
            metadata: {
                genre: musicalIdea.genre || "unspecified",
                mood: musicalIdea.mood || ["neutral"],
                tempo: musicalIdea.tempo || 120,
                key: "C",  // This would be determined based on the generated content
                timeSignature: "4/4"
            }
        };
    }
}

export const openAiService = new OpenAiService();