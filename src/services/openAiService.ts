import { MusicalIdea, GeneratedMusic } from '../types/music';
import { createMIDIFile } from '../utils/midiUtils';

interface MusicAPIResponse {
    notes: Array<{
        pitch: number;
        startTime: number;
        duration: number;
        velocity: number;
    }>;
    key: string;
    timeSignature: string;
    tempo?: number;
}

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

    async getMusicalContext(): Promise<string> {
        // Context generation is now handled by the server
        return '';
    }

    async generateMusic(musicalIdea: MusicalIdea): Promise<GeneratedMusic> {
        // Send the request to the server
        const apiResponse = await this.retry<MusicAPIResponse>(async () => {
            const response = await fetch(`${this.apiBaseUrl}/api/generate-music`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    musicalIdea
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        });

        try {
            // Create MIDI file from the API response
            const midi = createMIDIFile(
                apiResponse.notes,
                apiResponse.tempo || musicalIdea.tempo || 120,
                apiResponse.key,
                apiResponse.timeSignature
            );

            return {
                midi,
                metadata: {
                    genre: musicalIdea.genre || "unspecified",
                    mood: musicalIdea.mood || ["neutral"],
                    tempo: apiResponse.tempo || musicalIdea.tempo || 120,
                    key: apiResponse.key,
                    timeSignature: apiResponse.timeSignature
                }
            };
        } catch (error) {
            console.error('Error processing API response:', error);
            throw new Error('Failed to generate valid musical sequence');
        }
    }
}

export const openAiService = new OpenAiService();