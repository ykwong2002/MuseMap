import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Define types for musical notes
interface MIDINote {
    pitch: string;
    time: number;
    duration: number;
    velocity: number;
}

interface ParsedResponse {
    notes: MIDINote[];
    key: string;
    timeSignature: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Parse a text response into MIDI notes
function parseNotes(content: string): ParsedResponse {
    try {
        // Default to using JSON format if present
        const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
                          content.match(/```\s*(\{[\s\S]*?\})\s*```/);
        
        if (jsonMatch && jsonMatch[1]) {
            const parsedData = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsedData.notes)) {
                return parsedData;
            }
        }
        
        // Fallback: Extract notes manually
        const notes = [];
        const notePattern = /([A-G][#b]?[0-9])\s*:\s*time\s*=\s*([0-9.]+)\s*,\s*duration\s*=\s*([0-9.]+)\s*(?:,\s*velocity\s*=\s*([0-9.]+))?/gi;
        let match;
        
        while ((match = notePattern.exec(content)) !== null) {
            notes.push({
                pitch: match[1],
                time: parseFloat(match[2]),
                duration: parseFloat(match[3]),
                velocity: match[4] ? parseFloat(match[4]) : 0.7
            });
        }
        
        return {
            notes,
            key: content.match(/key\s*:\s*([A-G][#b]?\s*(?:major|minor))/i)?.[1] || "C major",
            timeSignature: content.match(/time\s*signature\s*:\s*([0-9]+\/[0-9]+)/i)?.[1] || "4/4"
        };
    } catch (error) {
        console.error("Error parsing notes:", error);
        return { notes: [], key: "C major", timeSignature: "4/4" };
    }
}

// Routes
app.post('/api/generate-music', async (req, res) => {
    try {
        const { context, musicalIdea } = req.body;
        
        console.log("Generating music with context:", context);
        console.log("Musical idea:", musicalIdea);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a music composition assistant that generates musical sequences. 
                    Return a JSON array of notes with the following structure:
                    {
                        "notes": [
                            { 
                                "pitch": "C4", 
                                "time": 0, 
                                "duration": 0.5,
                                "velocity": 0.7 
                            },
                            ...more notes
                        ],
                        "key": "C major",
                        "timeSignature": "4/4"
                    }
                    
                    Each note must have a valid pitch (e.g., C4, F#3), time in seconds, duration in seconds, and velocity between 0-1.`
                },
                {
                    role: "user",
                    content: `Musical Context:\n${context}\n\nGenerate a musical sequence for:\n${JSON.stringify(musicalIdea, null, 2)}`
                }
            ],
            temperature: 0.7,
        });

        if (!completion.choices[0]?.message?.content) {
            throw new Error('No content received from OpenAI');
        }
        
        // Extract and parse the notes from the completion content
        const parsedResponse = parseNotes(completion.choices[0].message.content);
        
        // Use fallback values from the musical idea if needed
        const response = {
            notes: parsedResponse.notes,
            key: parsedResponse.key || musicalIdea.key || "C major",
            timeSignature: parsedResponse.timeSignature || musicalIdea.timeSignature || "4/4"
        };
        
        console.log(`Generated ${response.notes.length} notes in ${response.key}`);
        res.json(response);
    } catch (error: unknown) {
        console.error('Error generating music:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to generate music', details: errorMessage });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});