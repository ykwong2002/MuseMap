import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { resolve } from 'path';
import neo4j from 'neo4j-driver';

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
    let mode = 'major';
    
    if (moods.some(m => ['Sad', 'Dark', 'Mysterious'].includes(m))) {
        // Minor scale
        scale = [0, 2, 3, 5, 7, 8, 10]; // C minor
        mode = 'minor';
    } else if (moods.some(m => ['Happy', 'Bright', 'Energetic'].includes(m))) {
        // Major scale
        scale = [0, 2, 4, 5, 7, 9, 11]; // C major
        mode = 'major';
    } else if (moods.some(m => ['Soulful', 'Expressive'].includes(m))) {
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
    
    // Adjust by genre
    if (genre === 'Jazz') {
        noteCount = 24;
        baseVelocity = 70;
        noteDuration = 0.25; // quarter notes for more rhythm
    } else if (genre === 'Rock') {
        noteCount = 16;
        baseVelocity = 90; // louder
        noteDuration = 0.5;
    } else if (genre === 'Blues') {
        noteCount = 12;
        baseVelocity = 75;
        noteDuration = 0.33; // triplet feel
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
        // Choose a note from the scale
        const chordRoot = chordPattern[i % patternLength];
        
        // Select note from chord or scale
        let pitchIndex;
        if (i % 4 === 0) {
            // Chord tones on strong beats
            pitchIndex = chordRoot;
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
        
        // Calculate timing
        const startTime = i * noteDuration;
        
        // Calculate velocity (volume)
        let velocity = baseVelocity;
        if (i % 4 === 0) {
            velocity += 15; // Accent on downbeats
        } else if (i % 2 === 0) {
            velocity += 5; // Slight accent on beats 2 and 4
        }
        
        // Some slight randomization for more natural feel
        velocity = Math.max(40, Math.min(100, velocity + (Math.random() * 10 - 5)));
        
        notes.push({
            pitch,
            startTime,
            duration: noteDuration * 0.9, // Slightly shorter than the full duration
            velocity: Math.round(velocity)
        });
    }
    
    return {
        notes,
        key,
        timeSignature: "4/4",
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