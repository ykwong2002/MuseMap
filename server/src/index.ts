import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { resolve } from 'path';
import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import MidiWriter from 'midi-writer-js';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Initialize Neo4j driver
const neo4jDriver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    )
);

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Type definitions for scale records
interface ScaleRecord {
  name: string;
  notes: string[];
  genres: string[];
  moods: string[];
}

// Type definitions for chord progression records
interface ProgressionRecord {
  name: string;
  chords: string[];
  genres: string[];
  moods: string[];
}

// Type definitions for rhythm records
interface RhythmRecord {
  name: string;
  pattern: string;
  genres: string[];
  moods: string[];
}

// Type definition for a musical note
interface Note {
  pitch: string | number;
  startTime: number;
  duration: number;
  velocity: number;
}

// Type definition for music pattern
interface MusicPattern {
  notes: Note[];
  key: string;
  timeSignature: string;
  tempo: number;
}

// Type definition for musical idea request
interface MusicalIdea {
  genre?: string;
  mood?: string[];
  complexity?: number;
  tempo?: number;
}

/**
 * Selects a scale from the provided records based on complexity level
 * @param scaleRecords Array of scale records to choose from
 * @param complexity Complexity level (1-10)
 * @returns The selected scale record
 */
function selectBasedOnComplexity(scaleRecords: ScaleRecord[], complexity: number): ScaleRecord {
    if (scaleRecords.length === 0) {
        // Fallback to C major if no scales are available
        return {
            name: 'C Major',
            notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], // C major scale notes
            genres: ['Classical'],
            moods: ['Neutral']
        };
    }
    
    // Sort scales by estimated complexity
    const sortedScales = [...scaleRecords].sort((a, b) => {
        // Estimate complexity based on scale properties
        const complexityA = estimateScaleComplexity(a);
        const complexityB = estimateScaleComplexity(b);
        
        // For lower requested complexity, prefer simpler scales
        // For higher requested complexity, prefer more complex scales
        return complexity <= 5 
            ? complexityA - complexityB  // Ascending order for low complexity
            : complexityB - complexityA; // Descending order for high complexity
    });
    
    // For very low complexity (1-3), prefer major/pentatonic scales
    if (complexity <= 3) {
        const simpleScale = sortedScales.find(scale => 
            scale.name.toLowerCase().includes('major') || 
            scale.name.toLowerCase().includes('pentatonic')
        );
        if (simpleScale) return simpleScale;
    }
    
    // For very high complexity (8-10), prefer modal/jazz scales
    if (complexity >= 8) {
        const complexScale = sortedScales.find(scale => 
            scale.name.toLowerCase().includes('diminished') || 
            scale.name.toLowerCase().includes('lydian') ||
            scale.name.toLowerCase().includes('locrian') ||
            scale.name.toLowerCase().includes('altered')
        );
        if (complexScale) return complexScale;
    }
    
    // For medium complexity, select from the middle of the sorted array
    const index = Math.min(
        Math.floor((complexity / 10) * sortedScales.length), 
        sortedScales.length - 1
    );
    
    return sortedScales[index];
}

/**
 * Estimates the complexity of a scale based on its properties
 * @param scale The scale record to evaluate
 * @returns A numeric complexity score
 */
function estimateScaleComplexity(scale: ScaleRecord): number {
    const name = scale.name.toLowerCase();
    
    // Base complexity scores by scale type
    if (name.includes('pentatonic')) return 2;
    if (name.includes('major')) return 3;
    if (name.includes('minor')) return 4;
    if (name.includes('blues')) return 5;
    if (name.includes('dorian') || name.includes('mixolydian')) return 6;
    if (name.includes('phrygian') || name.includes('lydian')) return 7;
    if (name.includes('locrian') || name.includes('harmonic')) return 8;
    if (name.includes('diminished') || name.includes('whole tone')) return 9;
    if (name.includes('altered') || name.includes('enigmatic')) return 10;
    
    // Default medium complexity
    return 5;
}

// Utility function to get data from Neo4j
async function queryNeo4j(cypher: string, params = {}) {
    const session = neo4jDriver.session();
    try {
        const result = await session.run(cypher, params);
        return result.records;
    } finally {
        await session.close();
    }
}

// Neo4j API endpoints
app.get('/api/scales', async (req, res) => {
    try {
        const records = await queryNeo4j('MATCH (s:Scale) RETURN s');
        const scales = records.map(record => record.get('s').properties);
        res.json(scales);
    } catch (error) {
        console.error('Error fetching scales:', error);
        res.status(500).json({ error: 'Failed to fetch scales' });
    }
});

app.get('/api/chords', async (req, res) => {
    try {
        const records = await queryNeo4j('MATCH (c:Chord) RETURN c');
        const chords = records.map(record => record.get('c').properties);
        res.json(chords);
    } catch (error) {
        console.error('Error fetching chords:', error);
        res.status(500).json({ error: 'Failed to fetch chords' });
    }
});

app.get('/api/progressions', async (req, res) => {
    try {
        const records = await queryNeo4j('MATCH (p:Progression) RETURN p');
        const progressions = records.map(record => record.get('p').properties);
        res.json(progressions);
    } catch (error) {
        console.error('Error fetching progressions:', error);
        res.status(500).json({ error: 'Failed to fetch progressions' });
    }
});

app.get('/api/genres', async (req, res) => {
    try {
        const records = await queryNeo4j('MATCH (g:Genre) RETURN g');
        const genres = records.map(record => record.get('g').properties);
        res.json(genres);
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

app.get('/api/scales-by-mood', async (req, res) => {
    try {
        const { mood } = req.query;
        if (!mood) {
            return res.status(400).json({ error: 'Mood parameter is required' });
        }
        
        const moods = Array.isArray(mood) ? mood : [mood];
        const records = await queryNeo4j(
            'MATCH (s:Scale) WHERE any(m IN $moods WHERE m IN s.mood) RETURN s',
            { moods }
        );
        const scales = records.map(record => record.get('s').properties);
        res.json(scales);
    } catch (error) {
        console.error('Error fetching scales by mood:', error);
        res.status(500).json({ error: 'Failed to fetch scales by mood' });
    }
});

app.get('/api/chords-by-scale', async (req, res) => {
    try {
        const { scaleId } = req.query;
        if (!scaleId) {
            return res.status(400).json({ error: 'Scale ID parameter is required' });
        }
        
        const records = await queryNeo4j(
            'MATCH (s:Scale {id: $scaleId})-[:CONTAINS]->(c:Chord) RETURN c',
            { scaleId }
        );
        const chords = records.map(record => record.get('c').properties);
        res.json(chords);
    } catch (error) {
        console.error('Error fetching chords by scale:', error);
        res.status(500).json({ error: 'Failed to fetch chords by scale' });
    }
});

app.get('/api/progressions-by-genre', async (req, res) => {
    try {
        const { genre } = req.query;
        if (!genre) {
            return res.status(400).json({ error: 'Genre parameter is required' });
        }
        
        const records = await queryNeo4j(
            'MATCH (g:Genre {name: $genre})-[:COMMONLY_USES]->(p:Progression) RETURN p',
            { genre }
        );
        const progressions = records.map(record => record.get('p').properties);
        res.json(progressions);
    } catch (error) {
        console.error('Error fetching progressions by genre:', error);
        res.status(500).json({ error: 'Failed to fetch progressions by genre' });
    }
});

// Helper function to generate simple music patterns
function generateSimpleMusicPattern(idea: any) {
    // Default values
    const tempo = idea.tempo || 120;
    const genre = idea.genre || 'Classical';
    const moods = idea.mood || ['Neutral'];
    const complexity = idea.complexity || 5;
    
    // Generate a simple scale based on mood
    let scale = [];
    let key = 'C';
    
    if (moods.some((m: string) => ['Sad', 'Dark', 'Mysterious'].includes(m))) {
        // Minor scale
        scale = [0, 2, 3, 5, 7, 8, 10]; // C minor
    } else if (moods.some((m: string) => ['Happy', 'Bright', 'Energetic'].includes(m))) {
        // Major scale
        scale = [0, 2, 4, 5, 7, 9, 11]; // C major
    } else if (moods.some((m: string) => ['Soulful', 'Expressive'].includes(m))) {
        // Blues scale
        scale = [0, 3, 5, 6, 7, 10]; // C blues
        key = 'C blues';
    } else {
        // Pentatonic scale (for neutral or other moods)
        scale = [0, 2, 4, 7, 9]; // C pentatonic
        key = 'C pentatonic';
    }
    
    // Base parameters
    let noteCount = 16;
    let baseVelocity = 80;
    let noteDuration = 0.5; // half notes
    
    // Default rhythm parameters
    const accentedBeats = [1, 3]; // Accent beats 1 and 3 in 4/4 time
    let useSwing = false;
    
    // Adjust by genre
    if (genre === 'Jazz') {
        noteCount = 24;
        baseVelocity = 70;
        noteDuration = 0.25; // quarter notes for more rhythm
        useSwing = true; // Enable swing for jazz
        // Jazz often accents beats 2 and 4
        accentedBeats.length = 0;
        accentedBeats.push(2, 4);
    } else if (genre === 'Rock') {
        noteCount = 16;
        baseVelocity = 90; // louder
        noteDuration = 0.5;
    } else if (genre === 'Blues') {
        noteCount = 12;
        baseVelocity = 75;
        noteDuration = 0.33; // triplet feel
        useSwing = true; // Enable swing for blues
    }
    
    // Adjust by complexity
    noteCount = Math.max(8, Math.min(32, noteCount + (complexity - 5) * 2));
    
    // Generate the notes
    const notes = [];
    
    // Create a basic chord progression (I-IV-V)
    const chordPattern = [0, 0, 3, 3, 4, 4, 0, 0];
    const patternLength = chordPattern.length;
    
    // Generate the melody
    for (let i = 0; i < noteCount; i++) {
        // Choose a note from the scale based on current chord
        const chordIndex = Math.floor(i / (noteCount / patternLength)) % patternLength;
        const chordRoot = chordPattern[chordIndex];
        
        // Select note from chord or scale
        let pitchIndex;
        // On strong beats, use chord tones
        if (accentedBeats.includes((i % 4) + 1)) {
            // Chord tones (1, 3, 5, 7)
            const chordTones = [0, 2, 4, 6].map(step => (chordRoot + step) % scale.length);
            pitchIndex = chordTones[Math.floor(Math.random() * Math.min(complexity / 2, chordTones.length))];
        } else if (i % 2 === 0) {
            // Chord tones on medium beats
            pitchIndex = (chordRoot + 2) % scale.length;
        } else {
            // Scale tones on weak beats
            pitchIndex = Math.floor(Math.random() * scale.length);
        }
        
        // Get the actual MIDI note
        const pitchClass = scale[pitchIndex];
        const octave = 4 + Math.floor(chordRoot / 7); // Higher octave for higher scale degrees
        const pitch = 60 + pitchClass + (octave - 4) * 12; // 60 = C4
        
        // Calculate timing with swing if applicable
        let startTime = i * noteDuration;
        if (useSwing && i % 2 === 1) {
            // Apply swing to offbeats
            startTime += noteDuration * 0.33;
        }
        
        // Calculate velocity (volume)
        let velocity = baseVelocity;
        if (accentedBeats.includes((i % 4) + 1)) {
            velocity += 15; // Accent on important beats
        } else if (i % 2 === 0) {
            velocity += 5; // Slight accent on other beats
        }
        
        // Add some musicality with micro-variations
        // Higher complexity means more variation
        const randomFactor = complexity / 10; // 0.1 - 1.0
        velocity = Math.max(40, Math.min(110, velocity + (Math.random() * 10 - 5) * randomFactor));
        
        // Shorter notes on higher complexity for articulation variation
        const noteLengthVariation = complexity > 7 ? 0.7 + Math.random() * 0.2 : 0.9;
        
        notes.push({
            pitch,
            startTime,
            duration: noteDuration * noteLengthVariation,
            velocity: Math.round(velocity)
        });
    }
    
    // Generate a complementary bass line
    if (complexity >= 5) {
        const bassNoteCount = Math.floor(noteCount / 4);
        for (let i = 0; i < bassNoteCount; i++) {
            const chordIndex = Math.floor(i / (bassNoteCount / patternLength)) % patternLength;
            const chordRoot = chordPattern[chordIndex];
            
            // Use the root note of the chord for bass
            const pitchClass = scale[chordRoot % scale.length];
            // Bass is an octave lower
            const pitch = 48 + pitchClass; // 48 = C3
            
            const startTime = i * noteDuration * 4;
            const bassVelocity = baseVelocity - 10; // Bass slightly quieter
            
            notes.push({
                pitch,
                startTime,
                duration: noteDuration * 3.5, // Longer notes for bass
                velocity: Math.round(bassVelocity)
            });
        }
    }
    
    // Generate chord voicings for harmony
    if (complexity >= 4) {
        // Generate chords every 2-4 beats depending on complexity
        const chordsPerMeasure = complexity >= 7 ? 2 : 1;
        const chordDuration = 4 / chordsPerMeasure * noteDuration;
        
        for (let i = 0; i < patternLength * chordsPerMeasure; i++) {
            const chordIndex = Math.floor(i / chordsPerMeasure) % chordPattern.length;
            const chordRoot = chordPattern[chordIndex];
            
            // Generate chord voicings based on complexity
            let chordIntervals;
            if (complexity >= 8) {
                // Extended chord voicings (7th, 9th, etc.)
                chordIntervals = [0, 4, 7, 11]; // maj7
                if (i % 2 === 1) {
                    chordIntervals = [0, 3, 7, 10]; // min7
                }
            } else if (complexity >= 6) {
                // Triads with 7ths
                chordIntervals = [0, 4, 7, 10]; // dominant 7th
                if (i % 3 === 1) {
                    chordIntervals = [0, 3, 7, 10]; // min7
                }
            } else {
                // Basic triads
                chordIntervals = [0, 4, 7]; // major
                if (i % 3 === 1) {
                    chordIntervals = [0, 3, 7]; // minor
                }
            }
            
            // Start time for this chord
            const chordStartTime = i * chordDuration;
            
            // Create the chord voicing
            for (let j = 0; j < chordIntervals.length; j++) {
                const interval = chordIntervals[j];
                const noteIndex = (chordRoot + interval) % scale.length;
                const pitchClass = scale[noteIndex % scale.length];
                
                // Place in middle register
                const pitch = 60 + pitchClass; // Middle C and above
                
                // Slightly varying velocities for chord tones
                let velocity = baseVelocity - 15; // Chords slightly quieter than melody
                if (j === 0) velocity += 5; // Emphasize root slightly
                
                // Add note to the pattern
                notes.push({
                    pitch,
                    startTime: chordStartTime,
                    duration: chordDuration * 0.8, // Slightly shorter than full duration
                    velocity: Math.round(velocity)
                });
            }
        }
    }
    
    // Time signature based on rhythmic pattern
    const timeSignature = "4/4";
    
    return {
        notes,
        key,
        timeSignature,
        tempo
    };
}

// Music generation endpoint
app.post('/api/generate-music', async (req, res) => {
    try {
        console.log('Received generate-music request:', JSON.stringify(req.body));
        const { musicalIdea } = req.body;

        if (!musicalIdea) {
            console.error('Missing musicalIdea in request body');
            return res.status(400).json({ error: 'Missing musicalIdea in request body' });
        }

        try {
            console.log('Generating music pattern for:', musicalIdea);
            
            // Use our simple generator instead of OpenAI
            const musicData = generateSimpleMusicPattern(musicalIdea);
            
            console.log('Generated music pattern with', musicData.notes.length, 'notes');
            
            res.json(musicData);
        } catch (error) {
            console.error('Error generating music pattern:', error);
            res.status(500).json({ error: 'Failed to generate music' });
        }
    } catch (error) {
        console.error('Error in request processing:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Setup Neo4j endpoint
app.post('/api/setup-db', async (req, res) => {
    try {
        const session = neo4jDriver.session();
        
        try {
            // Clear existing data
            await session.run('MATCH (n) DETACH DELETE n');

            // Create scales with rhythmic preferences
            await session.run(`
                CREATE (major:Scale {
                    id: 'major',
                    name: 'Major Scale',
                    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                    type: 'major',
                    mood: ['Happy', 'Bright', 'Stable'],
                    commonRhythms: ['4/4', '3/4'],
                    preferredQuantization: 0.25
                })
                CREATE (minor:Scale {
                    id: 'minor',
                    name: 'Natural Minor Scale',
                    notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
                    type: 'minor',
                    mood: ['Sad', 'Dark', 'Mysterious'],
                    commonRhythms: ['4/4', '6/8'],
                    preferredQuantization: 0.25
                })
                CREATE (blues:Scale {
                    id: 'blues',
                    name: 'Blues Scale',
                    notes: ['C', 'Eb', 'F', 'F#', 'G', 'Bb'],
                    type: 'blues',
                    mood: ['Soulful', 'Expressive'],
                    commonRhythms: ['12/8', '4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true
                })
                CREATE (pent:Scale {
                    id: 'pentatonic',
                    name: 'Major Pentatonic',
                    notes: ['C', 'D', 'E', 'G', 'A'],
                    type: 'pentatonic',
                    mood: ['Simple', 'Folk', 'Peaceful'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.25
                })
            `);

            // Create chords with voice leading preferences
            await session.run(`
                CREATE (cmaj:Chord {
                    id: 'C',
                    name: 'C Major',
                    notes: ['C', 'E', 'G'],
                    type: 'major',
                    function: 'tonic',
                    voiceLeading: ['G->C', 'E->F', 'C->B']
                })
                CREATE (dmin:Chord {
                    id: 'Dm',
                    name: 'D Minor',
                    notes: ['D', 'F', 'A'],
                    type: 'minor',
                    function: 'supertonic',
                    voiceLeading: ['A->G', 'F->E', 'D->C']
                })
                CREATE (g7:Chord {
                    id: 'G7',
                    name: 'G Dominant 7th',
                    notes: ['G', 'B', 'D', 'F'],
                    type: 'seventh',
                    function: 'dominant',
                    voiceLeading: ['F->E', 'B->C', 'D->C']
                })
            `);

            // Create genres with detailed characteristics
            await session.run(`
                CREATE (jazz:Genre {
                    id: 'jazz',
                    name: 'Jazz',
                    commonProgressions: ['ii-V-I'],
                    commonScales: ['major', 'minor', 'blues'],
                    tempoMin: 80,
                    tempoMax: 160,
                    commonRhythms: ['4/4', '6/8'],
                    preferredQuantization: 0.125,
                    useSwing: true,
                    complexity: 8
                })
                CREATE (rock:Genre {
                    id: 'rock',
                    name: 'Rock',
                    commonProgressions: ['I-IV-V'],
                    commonScales: ['major', 'pentatonic'],
                    tempoMin: 100,
                    tempoMax: 180,
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.25,
                    useSwing: false,
                    complexity: 5
                })
                CREATE (blues:Genre {
                    id: 'blues',
                    name: 'Blues',
                    commonProgressions: ['I7-IV7-V7'],
                    commonScales: ['blues', 'pentatonic'],
                    tempoMin: 60,
                    tempoMax: 120,
                    commonRhythms: ['12/8', '4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true,
                    complexity: 6
                })
            `);

            // Create progressions with timing preferences
            await session.run(`
                CREATE (p1:Progression {
                    id: 'I-IV-V',
                    name: 'Basic Major Progression',
                    chords: ['C', 'F', 'G'],
                    genre: ['Pop', 'Rock', 'Folk'],
                    mood: ['Happy', 'Stable'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.25
                })
                CREATE (p2:Progression {
                    id: 'ii-V-I',
                    name: 'Jazz Standard Progression',
                    chords: ['Dm7', 'G7', 'Cmaj7'],
                    genre: ['Jazz'],
                    mood: ['Sophisticated', 'Complex'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true
                })
                CREATE (p3:Progression {
                    id: 'I7-IV7-V7',
                    name: 'Blues Progression',
                    chords: ['C7', 'F7', 'G7'],
                    genre: ['Blues'],
                    mood: ['Soulful', 'Expressive'],
                    commonRhythms: ['12/8'],
                    preferredQuantization: 0.125,
                    useSwing: true
                })
            `);

            // Create musical relationships
            await session.run(`
                MATCH (s:Scale {id: 'major'})
                MATCH (c:Chord {id: 'C'})
                CREATE (s)-[:CONTAINS]->(c)
            `);
            
            await session.run(`
                MATCH (g:Genre {id: 'jazz'})
                MATCH (p:Progression {id: 'ii-V-I'})
                CREATE (g)-[:COMMONLY_USES]->(p)
            `);

            await session.run(`
                MATCH (s:Scale {id: 'blues'})
                MATCH (p:Progression {id: 'I7-IV7-V7'})
                CREATE (s)-[:SUGGESTS]->(p)
            `);

            res.json({ message: 'Music theory knowledge graph initialized successfully!' });
        } finally {
            await session.close();
        }
    } catch (error) {
        console.error('Error setting up database:', error);
        res.status(500).json({ error: 'Failed to set up database' });
    }
});

// Expand Neo4j endpoint
app.post('/api/expand-db', async (req, res) => {
    try {
        const session = neo4jDriver.session();
        
        try {
            console.log('Expanding music theory knowledge graph...');
            
            // Add more scales
            await session.run(`
                CREATE (dorian:Scale {
                    id: 'dorian',
                    name: 'Dorian Mode',
                    notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
                    type: 'modal',
                    mood: ['Mysterious', 'Jazzy', 'Contemplative'],
                    commonRhythms: ['4/4', '6/8'],
                    preferredQuantization: 0.25
                })
                CREATE (lydian:Scale {
                    id: 'lydian',
                    name: 'Lydian Mode',
                    notes: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
                    type: 'modal',
                    mood: ['Dreamy', 'Floating', 'Mystical'],
                    commonRhythms: ['4/4', '3/4'],
                    preferredQuantization: 0.25
                })
                CREATE (mixolydian:Scale {
                    id: 'mixolydian',
                    name: 'Mixolydian Mode',
                    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
                    type: 'modal',
                    mood: ['Bluesy', 'Warm', 'Soulful'],
                    commonRhythms: ['4/4', '12/8'],
                    preferredQuantization: 0.25
                })
                CREATE (harmonic_minor:Scale {
                    id: 'harmonic_minor',
                    name: 'Harmonic Minor',
                    notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
                    type: 'minor',
                    mood: ['Exotic', 'Dramatic', 'Intense'],
                    commonRhythms: ['4/4', '6/8'],
                    preferredQuantization: 0.25
                })
                CREATE (melodic_minor:Scale {
                    id: 'melodic_minor',
                    name: 'Melodic Minor',
                    notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
                    type: 'minor',
                    mood: ['Sophisticated', 'Elegant', 'Complex'],
                    commonRhythms: ['4/4', '3/4'],
                    preferredQuantization: 0.25
                })
                CREATE (minor_pentatonic:Scale {
                    id: 'minor_pentatonic',
                    name: 'Minor Pentatonic',
                    notes: ['C', 'Eb', 'F', 'G', 'Bb'],
                    type: 'pentatonic',
                    mood: ['Bluesy', 'Soulful', 'Earthy'],
                    commonRhythms: ['4/4', '12/8'],
                    preferredQuantization: 0.25
                })
                CREATE (whole_tone:Scale {
                    id: 'whole_tone',
                    name: 'Whole Tone Scale',
                    notes: ['C', 'D', 'E', 'F#', 'G#', 'A#'],
                    type: 'symmetric',
                    mood: ['Dreamy', 'Ambiguous', 'Floating'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.25
                })
                CREATE (diminished:Scale {
                    id: 'diminished',
                    name: 'Diminished Scale',
                    notes: ['C', 'D', 'Eb', 'F', 'Gb', 'Ab', 'A', 'B'],
                    type: 'symmetric',
                    mood: ['Tense', 'Mysterious', 'Unstable'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.25
                })
            `);
            
            // Add more chord types with voice leading preferences
            await session.run(`
                CREATE (cmaj7:Chord {
                    id: 'Cmaj7',
                    name: 'C Major 7th',
                    notes: ['C', 'E', 'G', 'B'],
                    type: 'major7',
                    function: 'tonic',
                    voiceLeading: ['B->A', 'G->A', 'E->D', 'C->D'],
                    dissonanceLevel: 2
                })
                CREATE (dm7:Chord {
                    id: 'Dm7',
                    name: 'D Minor 7th',
                    notes: ['D', 'F', 'A', 'C'],
                    type: 'minor7',
                    function: 'supertonic',
                    voiceLeading: ['C->B', 'A->G', 'F->E', 'D->C'],
                    dissonanceLevel: 3
                })
                CREATE (g13:Chord {
                    id: 'G13',
                    name: 'G Dominant 13th',
                    notes: ['G', 'B', 'D', 'F', 'A', 'E'],
                    type: 'dominant13',
                    function: 'dominant',
                    voiceLeading: ['E->C', 'A->G', 'F->E', 'D->C', 'B->C', 'G->C'],
                    dissonanceLevel: 7
                })
                CREATE (fmaj9:Chord {
                    id: 'Fmaj9',
                    name: 'F Major 9th',
                    notes: ['F', 'A', 'C', 'E', 'G'],
                    type: 'major9',
                    function: 'subdominant',
                    voiceLeading: ['G->A', 'E->D', 'C->D', 'A->B', 'F->G'],
                    dissonanceLevel: 4
                })
                CREATE (em7b5:Chord {
                    id: 'Em7b5',
                    name: 'E Minor 7 Flat 5',
                    notes: ['E', 'G', 'Bb', 'D'],
                    type: 'half-diminished',
                    function: 'predominant',
                    voiceLeading: ['D->C', 'Bb->A', 'G->A', 'E->F'],
                    dissonanceLevel: 6
                })
                CREATE (a7alt:Chord {
                    id: 'A7alt',
                    name: 'A Altered Dominant',
                    notes: ['A', 'C#', 'Eb', 'G', 'Bb', 'D#'],
                    type: 'altered',
                    function: 'secondary-dominant',
                    voiceLeading: ['D#->D', 'Bb->A', 'G->F#', 'Eb->D', 'C#->D', 'A->D'],
                    dissonanceLevel: 9
                })
            `);

            // Add jazz progressions with complex harmony
            await session.run(`
                CREATE (p8:Progression {
                    id: 'jazz-251',
                    name: 'Jazz II-V-I',
                    chords: ['Dm7', 'G7', 'Cmaj7'],
                    genre: ['Jazz', 'Fusion', 'Bebop'],
                    mood: ['Sophisticated', 'Elegant', 'Modern'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true,
                    complexity: 7
                })
                CREATE (p9:Progression {
                    id: 'jazz-1625',
                    name: 'Jazz I-VI-II-V',
                    chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
                    genre: ['Jazz', 'Bossa Nova'],
                    mood: ['Smooth', 'Elegant', 'Flowing'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true,
                    complexity: 8
                })
                CREATE (p10:Progression {
                    id: 'modal-jazz',
                    name: 'Modal Jazz Vamp',
                    chords: ['Dm7', 'Em7', 'Fmaj7', 'G7sus4'],
                    genre: ['Modal Jazz', 'Contemporary'],
                    mood: ['Contemplative', 'Expansive', 'Modern'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.125,
                    useSwing: false,
                    complexity: 6
                })
                CREATE (p11:Progression {
                    id: 'blues-jazz',
                    name: 'Jazz Blues',
                    chords: ['C7', 'F7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7'],
                    genre: ['Jazz Blues', 'Bebop'],
                    mood: ['Bluesy', 'Expressive', 'Soulful'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true,
                    complexity: 8
                })
                CREATE (p12:Progression {
                    id: 'flamenco',
                    name: 'Spanish Flamenco',
                    chords: ['Am', 'G', 'F', 'E'],
                    genre: ['Flamenco', 'World'],
                    mood: ['Passionate', 'Exotic', 'Dramatic'],
                    commonRhythms: ['12/8', '6/8'],
                    preferredQuantization: 0.125,
                    useSwing: false,
                    complexity: 7
                })
                CREATE (p13:Progression {
                    id: 'impressionist',
                    name: 'Impressionist Progression',
                    chords: ['Fmaj7', 'Em7b5', 'Dm9', 'Cmaj7#11'],
                    genre: ['Impressionist', 'Classical'],
                    mood: ['Dreamy', 'Colorful', 'Sophisticated'],
                    commonRhythms: ['4/4', '3/4'],
                    preferredQuantization: 0.25,
                    useSwing: false,
                    complexity: 9
                })
            `);
            
            // Add modern genres
            await session.run(`
                CREATE (fusion:Genre {
                    id: 'fusion',
                    name: 'Fusion',
                    commonProgressions: ['jazz-251', 'modal-jazz'],
                    commonScales: ['dorian', 'lydian', 'mixolydian'],
                    tempoMin: 100,
                    tempoMax: 160,
                    commonRhythms: ['4/4', '7/8'],
                    preferredQuantization: 0.125,
                    useSwing: false,
                    complexity: 8
                })
                CREATE (ambient:Genre {
                    id: 'ambient',
                    name: 'Ambient',
                    commonProgressions: ['impressionist', 'modal-jazz'],
                    commonScales: ['lydian', 'whole_tone', 'dorian'],
                    tempoMin: 60,
                    tempoMax: 90,
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.125,
                    useSwing: false,
                    complexity: 7
                })
                CREATE (funk:Genre {
                    id: 'funk',
                    name: 'Funk',
                    commonProgressions: ['i-IV', 'i-bVII'],
                    commonScales: ['minor_pentatonic', 'dorian', 'mixolydian'],
                    tempoMin: 90,
                    tempoMax: 120,
                    commonRhythms: ['4/4', '16/16'],
                    preferredQuantization: 0.0625,
                    useSwing: false,
                    complexity: 7
                })
                CREATE (flamenco:Genre {
                    id: 'flamenco',
                    name: 'Flamenco',
                    commonProgressions: ['flamenco', 'i-bVII-bVI-V'],
                    commonScales: ['harmonic_minor', 'phrygian'],
                    tempoMin: 90,
                    tempoMax: 140,
                    commonRhythms: ['12/8', '6/8'],
                    preferredQuantization: 0.125,
                    useSwing: false,
                    complexity: 8
                })
            `);
            
            // Add rhythmic patterns for different genres
            await session.run(`
                CREATE (rp5:RhythmicPattern {
                    id: 'funk_groove',
                    name: 'Funk Groove',
                    timeSignature: '16/16',
                    accentedBeats: [1, 5, 11, 13],
                    syncopatedBeats: [4, 7, 10, 14],
                    subdivision: 0.0625,
                    genres: ['Funk', 'R&B']
                })
                CREATE (rp6:RhythmicPattern {
                    id: 'flamenco_buleria',
                    name: 'Bulería',
                    timeSignature: '12/8',
                    accentedBeats: [1, 4, 7, 9, 11],
                    subdivision: 0.125,
                    genres: ['Flamenco', 'World']
                })
                CREATE (rp7:RhythmicPattern {
                    id: 'odd_time',
                    name: 'Odd Time Signature',
                    timeSignature: '7/8',
                    accentedBeats: [1, 4, 6],
                    subdivision: 0.125,
                    genres: ['Fusion', 'Progressive']
                })
                CREATE (rp8:RhythmicPattern {
                    id: 'ambient_flow',
                    name: 'Ambient Flow',
                    timeSignature: '4/4',
                    accentedBeats: [1],
                    subdivision: 0.25,
                    genres: ['Ambient', 'Electronic']
                })
            `);
            
            // Connect new scales to genres
            await session.run(`
                MATCH (g:Genre {id: 'fusion'})
                MATCH (s:Scale {id: 'lydian'})
                CREATE (g)-[:COMMONLY_USES]->(s)
            `);
            
            await session.run(`
                MATCH (g:Genre {id: 'flamenco'})
                MATCH (s:Scale {id: 'harmonic_minor'})
                CREATE (g)-[:COMMONLY_USES]->(s)
            `);
            
            await session.run(`
                MATCH (g:Genre {id: 'ambient'})
                MATCH (s:Scale {id: 'whole_tone'})
                CREATE (g)-[:COMMONLY_USES]->(s)
            `);
            
            // Connect new progressions to genres
            await session.run(`
                MATCH (g:Genre {id: 'fusion'})
                MATCH (p:Progression {id: 'modal-jazz'})
                CREATE (g)-[:COMMONLY_USES]->(p)
            `);
            
            await session.run(`
                MATCH (g:Genre {id: 'flamenco'})
                MATCH (p:Progression {id: 'flamenco'})
                CREATE (g)-[:COMMONLY_USES]->(p)
            `);
            
            // Connect mood to scales
            await session.run(`
                MATCH (m:Mood {id: 'energetic'})
                MATCH (s:Scale {id: 'mixolydian'})
                CREATE (m)-[:SUGGESTS]->(s)
            `);
            
            await session.run(`
                MATCH (m:Mood {id: 'tense'})
                MATCH (s:Scale {id: 'diminished'})
                CREATE (m)-[:SUGGESTS]->(s)
            `);
            
            await session.run(`
                MATCH (m:Mood {id: 'calm'})
                MATCH (s:Scale {id: 'lydian'})
                CREATE (m)-[:SUGGESTS]->(s)
            `);
            
            res.json({ message: 'Music theory knowledge graph expanded successfully with advanced harmony and genres!' });
        } finally {
            await session.close();
        }
    } catch (error) {
        console.error('Error expanding database:', error);
        res.status(500).json({ error: 'Failed to expand database' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Gracefully close Neo4j connection on shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing Neo4j driver');
    await neo4jDriver.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing Neo4j driver');
    await neo4jDriver.close();
    process.exit(0);
});