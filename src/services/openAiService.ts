import OpenAI from 'openai';
import { APIError } from 'openai/error';
import { MusicalIdea, GeneratedMusic } from '../types/music';
import { neo4jService } from './neo4jService';
import { createMIDIFile } from '../utils/midiUtils';
import { config } from '../config/env';

interface ServiceError {
    status?: number;
    message?: string;
}

class OpenAiService {
    private openai: OpenAI;
    private maxRetries = 3;
    private retryDelay = 1000; // 1 second

    constructor() {
        const apiKey = config.openai.apiKey;
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.openai = new OpenAI({
            apiKey,
            maxRetries: this.maxRetries,
        });
    }

    private async retry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0 && this.isRetryableError(error as ServiceError | APIError)) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.retry(fn, retries - 1);
            }
            throw error;
        }
    }

    private isRetryableError(error: ServiceError | APIError): boolean {
        if (error instanceof APIError) {
            return error.status === 429 || (error.status ?? 0) >= 500;
        }
        // Ensure we have definite boolean values for each condition
        const isRateLimit = error?.status === 429;
        const isServerError = (error?.status ?? 0) >= 500;
        const isTimeout = Boolean(error?.message?.includes('timeout'));
        
        return isRateLimit || isServerError || isTimeout;
    }

    private async generateMusicalContext(idea: MusicalIdea): Promise<string> {
        try {
            const contextParts: string[] = [];

            if (idea.genre) {
                const genreInfo = await neo4jService.getGenreCharacteristics(idea.genre);
                if (genreInfo) {
                    contextParts.push(`Genre: ${idea.genre}
                    - Typical tempo range: ${genreInfo.tempoMin}-${genreInfo.tempoMax} BPM
                    - Common progressions: ${genreInfo.commonProgressions.join(', ')}
                    - Common scales: ${genreInfo.commonScales.join(', ')}`);
                }
            }

            if (idea.mood) {
                const relevantScales = await neo4jService.findScalesByMood(idea.mood);
                if (relevantScales.length > 0) {
                    contextParts.push(`Mood-appropriate scales:
                    ${relevantScales.map(scale => `- ${scale.name}: ${scale.notes.join(' ')}`).join('\n')}`);
                }
            }

            if (idea.scale) {
                const scaleChords = await neo4jService.findChordsByScale(idea.scale);
                if (scaleChords.length > 0) {
                    contextParts.push(`Available chords in scale:
                    ${scaleChords.map(chord => `- ${chord.name} (${chord.function}): ${chord.notes.join(' ')}`).join('\n')}`);
                }
            }

            return contextParts.join('\n\n') || 'No specific musical context available.';
        } catch (error) {
            console.error('Error generating musical context:', error);
            return 'Unable to fetch musical context. Using default musical theory rules.';
        }
    }

    async generateMusic(musicalIdea: MusicalIdea): Promise<GeneratedMusic> {
        const context = await this.generateMusicalContext(musicalIdea);
        
        const completion = await this.retry(async () => {
            try {
                return await this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: `You are a music composition assistant that generates MIDI-compatible musical sequences. 
                            Your output should be in the format:
                            {
                                "notes": [
                                    { "pitch": "C4", "time": 0, "duration": 0.5, "velocity": 0.8 },
                                    ...
                                ],
                                "key": "C",
                                "timeSignature": "4/4"
                            }
                            
                            Follow these rules:
                            - Use standard note names (C4, F#3, etc.)
                            - Time should be in seconds from the start
                            - Duration should be in seconds
                            - Velocity should be between 0 and 1
                            - Generate at least 8 bars of music
                            - Ensure all notes are valid MIDI notes`
                        },
                        {
                            role: "user",
                            content: `Generate a musical piece with the following context and requirements:

                            Musical Context:
                            ${context}

                            Requirements:
                            - Genre: ${musicalIdea.genre || 'Any'}
                            - Mood: ${musicalIdea.mood?.join(', ') || 'Any'}
                            - Tempo: ${musicalIdea.tempo || 'Appropriate for genre'} BPM
                            - Complexity Level: ${musicalIdea.complexity || 5}/10

                            Consider the musical theory context provided and ensure the composition follows appropriate patterns for the genre and mood.`
                        }
                    ],
                    response_format: { type: "json_object" }
                });
            } catch (error) {
                console.error('Error in OpenAI API call:', error);
                throw error;
            }
        });

        try {
            const generatedSequence = JSON.parse(completion.choices[0].message.content!);
            const midi = createMIDIFile(generatedSequence.notes, musicalIdea.tempo || 120);

            return {
                midi,
                metadata: {
                    genre: musicalIdea.genre || "unspecified",
                    mood: musicalIdea.mood || ["neutral"],
                    tempo: musicalIdea.tempo || 120,
                    key: generatedSequence.key,
                    timeSignature: generatedSequence.timeSignature
                }
            };
        } catch (error) {
            console.error('Error processing OpenAI response:', error);
            throw new Error('Failed to generate valid musical sequence');
        }
    }
}

export const openAiService = new OpenAiService();