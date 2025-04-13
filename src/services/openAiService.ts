import { MusicalIdea, GeneratedMusic } from '../types/music';
import { neo4jService } from './neo4jService';
import { createMIDIFile } from '../utils/midiUtils';

interface ServiceError {
    status?: number;
    message?: string;
}

class OpenAiService {
    private apiBaseUrl: string;
    private maxRetries = 3;
    private retryDelay = 1000; // 1 second

    constructor() {
        // Use environment variable or default to localhost in development
        this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    }

    private async retry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0 && this.isRetryableError(error as ServiceError)) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.retry(fn, retries - 1);
            }
            throw error;
        }
    }

    private isRetryableError(error: ServiceError): boolean {
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
        
        const response = await this.retry(async () => {
            try {
                const result = await fetch(`${this.apiBaseUrl}/api/generate-music`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        context,
                        musicalIdea
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error in API call:', error);
                throw error;
            }
        });

        try {
            const midi = createMIDIFile(response.notes, musicalIdea.tempo || 120);

            return {
                midi,
                metadata: {
                    genre: musicalIdea.genre || "unspecified",
                    mood: musicalIdea.mood || ["neutral"],
                    tempo: musicalIdea.tempo || 120,
                    key: response.key,
                    timeSignature: response.timeSignature
                }
            };
        } catch (error) {
            console.error('Error processing API response:', error);
            throw new Error('Failed to generate valid musical sequence');
        }
    }
}

export const openAiService = new OpenAiService();