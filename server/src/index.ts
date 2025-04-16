import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resolve } from 'path';
import neo4j, { Session } from 'neo4j-driver';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Define types for in-memory storage
interface KeyRoot {
  id: string;
  name: string;
  pitch: number;
}

interface KeyNode {
  id: string;
  name: string;
  rootPitch: number;
  scaleType: string;
  notes: string[];
  mood: string[];
}

interface ScaleNode {
  id: string;
  name: string;
  notes: string[];
  type: string;
  mood: string[];
  commonRhythms: string[];
  preferredQuantization: number;
  useSwing?: boolean;
}

interface ChordNode {
  id: string;
  name: string;
  notes: string[];
  type: string;
  function: string;
  voiceLeading: string[];
  dissonanceLevel?: number;
}

interface GenreNode {
  id: string;
  name: string;
  commonProgressions: string[];
  commonScales: string[];
  tempoMin: number;
  tempoMax: number;
  commonRhythms: string[];
  preferredQuantization: number;
  useSwing: boolean;
  complexity: number;
}

interface ProgressionNode {
  id: string;
  name: string;
  chords: string[];
  genre: string[];
  mood: string[];
  commonRhythms: string[];
  preferredQuantization: number;
  useSwing?: boolean;
}

// In-memory data storage for when Neo4j is not available
// This will allow us to store and retrieve keys without an actual database
const inMemoryDb: {
  keys: KeyNode[];
  scales: ScaleNode[];
  chords: ChordNode[];
  progressions: ProgressionNode[];
  genres: GenreNode[];
  relationships: any[];
} = {
  keys: [],
  scales: [],
  chords: [],
  progressions: [],
  genres: [],
  relationships: []
};

// Flag to determine if we're using in-memory storage
const useInMemory = false; // Set to true to bypass Neo4j and use in-memory storage

// Initialize Neo4j driver (but only if not using in-memory)
const neo4jDriver = useInMemory ? null : neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    )
);

// Middleware
app.use(cors());
app.use(express.json());

// Type definition for a musical note
interface Note {
  pitch: string | number;
  startTime: number;
  duration: number;
  velocity: number;
  instrument?: string; // Instrument that plays this note
}

// Instrument types for different genres
interface Instrument {
  id: string;
  name: string;
  midiProgram: number; // MIDI program number (0-127)
  role: 'melody' | 'harmony' | 'bass' | 'percussion' | 'pad';
  isPercussion?: boolean;
}

// Type definition for musical idea request
interface MusicalIdea {
  genre?: string;
  mood?: string[];
  complexity?: number;
  tempo?: number;
  key?: string; // User-selected key
}

// Type definition for music generator result
interface MusicResult {
  notes: Note[];
  key: string;
  timeSignature: string;
  tempo: number;
  instruments: string[]; // Replace any with string[]
}

// Define instruments for different genres
const instrumentsByGenre: {[genre: string]: Instrument[]} = {
  Jazz: [
    { id: 'piano', name: 'Piano', midiProgram: 0, role: 'harmony' },
    { id: 'upright_bass', name: 'Upright Bass', midiProgram: 32, role: 'bass' },
    { id: 'saxophone', name: 'Alto Saxophone', midiProgram: 65, role: 'melody' },
    { id: 'jazz_drums', name: 'Jazz Drums', midiProgram: 0, role: 'percussion', isPercussion: true },
    { id: 'vibraphone', name: 'Vibraphone', midiProgram: 11, role: 'harmony' }
  ],
  Rock: [
    { id: 'electric_guitar', name: 'Electric Guitar', midiProgram: 27, role: 'melody' },
    { id: 'distortion_guitar', name: 'Distortion Guitar', midiProgram: 30, role: 'harmony' },
    { id: 'electric_bass', name: 'Electric Bass', midiProgram: 33, role: 'bass' },
    { id: 'rock_drums', name: 'Rock Drums', midiProgram: 0, role: 'percussion', isPercussion: true },
    { id: 'synth_pad', name: 'Synth Pad', midiProgram: 89, role: 'pad' }
  ],
  Blues: [
    { id: 'blues_guitar', name: 'Blues Guitar', midiProgram: 25, role: 'melody' },
    { id: 'hammond_organ', name: 'Hammond Organ', midiProgram: 16, role: 'harmony' },
    { id: 'blues_bass', name: 'Blues Bass', midiProgram: 33, role: 'bass' },
    { id: 'blues_drums', name: 'Blues Drums', midiProgram: 0, role: 'percussion', isPercussion: true },
    { id: 'harmonica', name: 'Harmonica', midiProgram: 22, role: 'melody' }
  ],
  Classical: [
    { id: 'violin', name: 'Violin', midiProgram: 40, role: 'melody' },
    { id: 'cello', name: 'Cello', midiProgram: 42, role: 'bass' },
    { id: 'orchestral_harp', name: 'Orchestral Harp', midiProgram: 46, role: 'harmony' },
    { id: 'string_ensemble', name: 'String Ensemble', midiProgram: 48, role: 'pad' },
    { id: 'french_horn', name: 'French Horn', midiProgram: 60, role: 'harmony' }
  ],
  Electronic: [
    { id: 'synth_lead', name: 'Synth Lead', midiProgram: 80, role: 'melody' },
    { id: 'synth_bass', name: 'Synth Bass', midiProgram: 38, role: 'bass' },
    { id: 'synth_pad', name: 'Synth Pad', midiProgram: 89, role: 'pad' },
    { id: 'electronic_drums', name: 'Electronic Drums', midiProgram: 0, role: 'percussion', isPercussion: true },
    { id: 'synth_fx', name: 'Synth FX', midiProgram: 102, role: 'harmony' }
  ],
  Pop: [
    { id: 'pop_piano', name: 'Pop Piano', midiProgram: 0, role: 'harmony' },
    { id: 'clean_guitar', name: 'Clean Guitar', midiProgram: 27, role: 'melody' },
    { id: 'pop_bass', name: 'Pop Bass', midiProgram: 33, role: 'bass' },
    { id: 'pop_drums', name: 'Pop Drums', midiProgram: 0, role: 'percussion', isPercussion: true },
    { id: 'synth_strings', name: 'Synth Strings', midiProgram: 50, role: 'pad' }
  ]
};

// Utility function to get data from Neo4j or in-memory storage
async function queryNeo4j(cypher: string, params = {}) {
    if (useInMemory) {
        // Parse the cypher query and return data from in-memory storage
        console.log(`In-memory query: ${cypher}`);
        
        // Simple query handling based on patterns
        if (cypher.includes('MATCH (k:Key)')) {
            return inMemoryDb.keys.map(key => ({ get: (prop: string) => ({ properties: key }) }));
        } 
        else if (cypher.includes('MATCH (s:Scale)')) {
            return inMemoryDb.scales.map(scale => ({ get: (prop: string) => ({ properties: scale }) }));
        }
        else if (cypher.includes('MATCH (g:Genre)')) {
            return inMemoryDb.genres.map(genre => ({ get: (prop: string) => ({ properties: genre }) }));
        }
        else if (cypher.includes('MATCH (c:Chord)')) {
            return inMemoryDb.chords.map(chord => ({ get: (prop: string) => ({ properties: chord }) }));
        }
        else if (cypher.includes('MATCH (p:Progression)')) {
            return inMemoryDb.progressions.map(progression => ({ get: (prop: string) => ({ properties: progression }) }));
        }
        
        // Default empty result
        return [];
    } else {
        if (!neo4jDriver) {
            throw new Error('Neo4j driver not initialized');
        }
        const session = neo4jDriver.session();
        try {
            const result = await session.run(cypher, params);
            return result.records;
        } finally {
            await session.close();
        }
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

// Classical pattern generator
function generateClassicalPattern(idea: MusicalIdea): MusicResult {
    // Default values
    const tempo = idea.tempo || 120;
    const complexity = idea.complexity || 5;
    const userKey = idea.key; // User-selected key
    
    // Get instruments for this genre
    const instruments = instrumentsByGenre['Classical'] || [];
    
    // Generate a simple scale based on mood or use user-selected key
    let scale: number[] = [];
    let key = 'C';
    // Base MIDI note - defaults to 60 (C4) and will be adjusted based on key
    let baseMidiNote = 60;
    
    // Parse the key if provided
    if (userKey) {
        const keyParts = userKey.split('_');
        if (keyParts.length === 2) {
            const rootNote = keyParts[0];
            const scaleType = keyParts[1];
            
            // Set key name based on user selection
            key = userKey;
            
            // Set scale intervals based on scale type
            if (scaleType === 'major') {
                scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale
            } else if (scaleType === 'natural_minor') {
                scale = [0, 2, 3, 5, 7, 8, 10]; // Natural minor scale
            } else if (scaleType === 'harmonic_minor') {
                scale = [0, 2, 3, 5, 7, 8, 11]; // Harmonic minor scale
            } else if (scaleType === 'blues') {
                scale = [0, 3, 5, 6, 7, 10]; // Blues scale
            } else {
                // Default to major if unknown scale type
                scale = [0, 2, 4, 5, 7, 9, 11];
            }
            
            // Transpose based on root note pitch
            const rootPitchMap: {[key: string]: number} = {
                'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
                'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
            };
            
            const rootPitch = rootPitchMap[rootNote] || 0;
            
            // Update base MIDI note for transposition
            baseMidiNote = 60 + rootPitch; // C4 (60) + root pitch offset
        }
    } else {
        // Default to C major
        scale = [0, 2, 4, 5, 7, 9, 11]; // C major
        key = 'C_major';
    }
    
    // Classical settings
    const noteCount = Math.max(16, Math.min(48, 16 + (complexity - 5) * 4));
    const baseVelocity = 75;
    const noteDuration = 0.25; // quarter notes
    
    // Find instruments by role
    const violinInstrument = instruments.find((i: Instrument) => i.id === 'violin') || 
                             { id: 'violin', name: 'Violin', midiProgram: 40, role: 'melody' };
    const celloInstrument = instruments.find((i: Instrument) => i.id === 'cello') || 
                            { id: 'cello', name: 'Cello', midiProgram: 42, role: 'bass' };
    const harpInstrument = instruments.find((i: Instrument) => i.id === 'orchestral_harp') || 
                           { id: 'orchestral_harp', name: 'Orchestral Harp', midiProgram: 46, role: 'harmony' };
    const stringsInstrument = instruments.find((i: Instrument) => i.id === 'string_ensemble') || 
                              { id: 'string_ensemble', name: 'String Ensemble', midiProgram: 48, role: 'pad' };
    
    // Common classical progression (I-IV-V-I)
    const chordProgression = [0, 3, 4, 0, 5, 3, 0, 0];
    const patternLength = chordProgression.length;
    
    // Generate the notes
    const notes: Note[] = [];
    
    // Generate a classical melody with the violin
    // Create a motif for classical development
    const motif = [
        scale[0], // root
        scale[2], // third
        scale[4], // fifth
        scale[5]  // sixth
    ];
    
    // Generate the melody with the motif
    for (let i = 0; i < noteCount; i++) {
        const chordIndex = Math.floor(i / (noteCount / patternLength)) % patternLength;
        const chordRoot = chordProgression[chordIndex];
        
        // Structured melody based on motif and variations
        let pitchClass;
        if (i % 8 < 4) {
            // Use the motif directly
            pitchClass = motif[i % 4];
        } else {
            // Use chord tones
            const chordTones = [0, 2, 4].map(step => scale[(chordRoot + step) % scale.length]);
            pitchClass = chordTones[Math.floor(Math.random() * chordTones.length)];
        }
        
        // Arched phrasing (higher in the middle of the phrase)
        const phrasePosition = (i % 16) / 16;
        const archShape = Math.sin(phrasePosition * Math.PI);
        const octave = 4 + Math.floor(archShape * complexity / 10);
        const pitch = baseMidiNote + pitchClass + (octave - 4) * 12;
        
        // Calculate timing
        const startTime = i * noteDuration;
        
        // Classical dynamics (crescendo/diminuendo)
        const dynamicShape = Math.sin((i / (noteCount / 2)) * Math.PI);
        const velocity = baseVelocity + Math.floor(dynamicShape * 20);
        
        notes.push({
            pitch,
            startTime,
            duration: noteDuration * 0.9,
            velocity: Math.round(velocity),
            instrument: violinInstrument.id
        });
    }
    
    // Add cello bass line
    const bassNoteCount = noteCount / 2;
    for (let i = 0; i < bassNoteCount; i++) {
        const chordIndex = Math.floor(i / (bassNoteCount / patternLength)) % patternLength;
        const chordRoot = chordProgression[chordIndex];
        
        // Bass plays the root note
        const pitchClass = scale[chordRoot % scale.length];
        const pitch = baseMidiNote - 24 + pitchClass; // Two octaves below
        
        const startTime = i * noteDuration * 2;
        
        notes.push({
            pitch,
            startTime,
            duration: noteDuration * 1.9,
            velocity: baseVelocity - 10,
            instrument: celloInstrument.id
        });
    }
    
    // Add harp arpeggios if complexity is high enough
    if (complexity >= 5) {
        // Use alberti bass pattern
        for (let i = 0; i < noteCount; i++) {
            const chordIndex = Math.floor(i / (noteCount / patternLength)) % patternLength;
            const chordRoot = chordProgression[chordIndex];
            
            // Alberti bass pattern: root, fifth, third, fifth
            const pattern = [0, 4, 2, 4];
            const interval = pattern[i % 4];
            
            const noteIndex = (chordRoot + interval) % scale.length;
            const pitchClass = scale[noteIndex];
            const pitch = baseMidiNote - 12 + pitchClass;
            
            const startTime = i * noteDuration;
            
            notes.push({
                pitch,
                startTime,
                duration: noteDuration * 0.8,
                velocity: baseVelocity - 15,
                instrument: harpInstrument.id
            });
        }
    }
    
    // Add string ensemble pads if complexity is high enough
    if (complexity >= 6) {
        for (let i = 0; i < patternLength; i++) {
            const chordRoot = chordProgression[i];
            const chordIntervals = [0, 2, 4]; // Triad
            
            const chordStartTime = i * noteDuration * 4;
            
            chordIntervals.forEach((interval, j) => {
                const noteIndex = (chordRoot + interval) % scale.length;
                const pitchClass = scale[noteIndex];
                const octaveOffset = j - 1;
                const pitch = baseMidiNote + pitchClass + octaveOffset * 12;
                
                notes.push({
                    pitch,
                    startTime: chordStartTime,
                    duration: noteDuration * 3.9,
                    velocity: baseVelocity - 20,
                    instrument: stringsInstrument.id
                });
            });
        }
    }
    
    return {
        notes,
        key,
        timeSignature: "4/4",
        tempo,
        instruments: [violinInstrument.id, celloInstrument.id, harpInstrument.id, stringsInstrument.id]
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
            
            // Use our generator with appropriate instruments based on genre
            const musicData = generateClassicalPattern(musicalIdea);
            
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

// Modified setupMusicalKeys function to work with in-memory storage
async function setupMusicalKeys(session: Session | null) {
    // Define all 12 musical keys with their root notes
    const keyRoots = [
        { id: 'C', name: 'C', pitch: 0 },
        { id: 'C#', name: 'C♯/D♭', pitch: 1 },
        { id: 'D', name: 'D', pitch: 2 },
        { id: 'D#', name: 'D♯/E♭', pitch: 3 },
        { id: 'E', name: 'E', pitch: 4 },
        { id: 'F', name: 'F', pitch: 5 },
        { id: 'F#', name: 'F♯/G♭', pitch: 6 },
        { id: 'G', name: 'G', pitch: 7 },
        { id: 'G#', name: 'G♯/A♭', pitch: 8 },
        { id: 'A', name: 'A', pitch: 9 },
        { id: 'A#', name: 'A♯/B♭', pitch: 10 },
        { id: 'B', name: 'B', pitch: 11 }
    ];

    // Define scale types with their interval patterns
    const scaleTypes = [
        { 
            id: 'major', 
            name: 'Major', 
            intervals: [0, 2, 4, 5, 7, 9, 11],
            mood: ['Happy', 'Bright', 'Stable']
        },
        { 
            id: 'natural_minor', 
            name: 'Natural Minor', 
            intervals: [0, 2, 3, 5, 7, 8, 10],
            mood: ['Sad', 'Dark', 'Mysterious'] 
        },
        { 
            id: 'harmonic_minor', 
            name: 'Harmonic Minor', 
            intervals: [0, 2, 3, 5, 7, 8, 11],
            mood: ['Exotic', 'Dramatic', 'Intense'] 
        },
        { 
            id: 'melodic_minor', 
            name: 'Melodic Minor', 
            intervals: [0, 2, 3, 5, 7, 9, 11],
            mood: ['Sophisticated', 'Complex', 'Jazzy'] 
        },
        { 
            id: 'dorian', 
            name: 'Dorian Mode', 
            intervals: [0, 2, 3, 5, 7, 9, 10],
            mood: ['Mysterious', 'Jazzy', 'Contemplative'] 
        },
        { 
            id: 'phrygian', 
            name: 'Phrygian Mode', 
            intervals: [0, 1, 3, 5, 7, 8, 10],
            mood: ['Exotic', 'Tense', 'Spanish'] 
        },
        { 
            id: 'lydian', 
            name: 'Lydian Mode', 
            intervals: [0, 2, 4, 6, 7, 9, 11],
            mood: ['Dreamy', 'Floating', 'Mystical'] 
        },
        { 
            id: 'mixolydian', 
            name: 'Mixolydian Mode', 
            intervals: [0, 2, 4, 5, 7, 9, 10],
            mood: ['Bluesy', 'Warm', 'Soulful'] 
        },
        { 
            id: 'locrian', 
            name: 'Locrian Mode', 
            intervals: [0, 1, 3, 5, 6, 8, 10],
            mood: ['Dissonant', 'Unstable', 'Tense'] 
        },
        { 
            id: 'pentatonic_major', 
            name: 'Major Pentatonic', 
            intervals: [0, 2, 4, 7, 9],
            mood: ['Simple', 'Folk', 'Peaceful'] 
        },
        { 
            id: 'pentatonic_minor', 
            name: 'Minor Pentatonic', 
            intervals: [0, 3, 5, 7, 10],
            mood: ['Bluesy', 'Rock', 'Soulful'] 
        },
        { 
            id: 'blues', 
            name: 'Blues Scale', 
            intervals: [0, 3, 5, 6, 7, 10],
            mood: ['Soulful', 'Expressive', 'Bluesy'] 
        }
    ];

    if (useInMemory) {
        // Clear existing data
        inMemoryDb.keys = [];
        
        // For each key root and scale type, create a complete key node
        for (const keyRoot of keyRoots) {
            for (const scaleType of scaleTypes) {
                const keyId = `${keyRoot.id}_${scaleType.id}`;
                const keyName = `${keyRoot.name} ${scaleType.name}`;
                
                // Calculate actual notes for this key/scale
                const notes = scaleType.intervals.map(interval => {
                    const adjustedPitch = (keyRoot.pitch + interval) % 12;
                    return keyRoots.find(kr => kr.pitch === adjustedPitch)?.id || '';
                });

                // Create key node
                inMemoryDb.keys.push({
                    id: keyId,
                    name: keyName,
                    rootPitch: keyRoot.pitch,
                    scaleType: scaleType.id,
                    notes: notes,
                    mood: scaleType.mood
                });
            }
        }
        
        console.log(`In-memory DB: Created ${inMemoryDb.keys.length} key nodes`);
    } else if (session) {
        // Create nodes for all key roots
        for (const keyRoot of keyRoots) {
            await session.run(`
                CREATE (key:KeyRoot {
                    id: $id,
                    name: $name,
                    pitch: $pitch
                })
            `, { id: keyRoot.id, name: keyRoot.name, pitch: keyRoot.pitch });
        }

        // For each key root and scale type, create a complete key node
        for (const keyRoot of keyRoots) {
            for (const scaleType of scaleTypes) {
                const keyId = `${keyRoot.id}_${scaleType.id}`;
                const keyName = `${keyRoot.name} ${scaleType.name}`;
                
                // Calculate actual notes for this key/scale
                const notes = scaleType.intervals.map(interval => {
                    const adjustedPitch = (keyRoot.pitch + interval) % 12;
                    return keyRoots.find(kr => kr.pitch === adjustedPitch)?.id || '';
                });

                // Create the key node
                await session.run(`
                    CREATE (key:Key {
                        id: $id,
                        name: $name,
                        rootPitch: $rootPitch,
                        scaleType: $scaleType,
                        notes: $notes,
                        mood: $mood
                    })
                `, { 
                    id: keyId, 
                    name: keyName, 
                    rootPitch: keyRoot.pitch,
                    scaleType: scaleType.id,
                    notes: notes,
                    mood: scaleType.mood
                });

                // Create relationship from key root to this key
                await session.run(`
                    MATCH (root:KeyRoot {id: $rootId})
                    MATCH (key:Key {id: $keyId})
                    CREATE (root)-[:HAS_SCALE]->(key)
                `, { rootId: keyRoot.id, keyId: keyId });
            }
        }
    } else {
        console.error('Neither in-memory mode nor a valid session was provided');
    }

    console.log('Musical keys setup complete');
}

// Create a new endpoint to get all available keys
app.get('/api/keys', async (req, res) => {
    try {
        const records = await queryNeo4j('MATCH (k:Key) RETURN k ORDER BY k.rootPitch, k.scaleType');
        const keys = records.map(record => record.get('k').properties);
        res.json(keys);
    } catch (error) {
        console.error('Error fetching keys:', error);
        res.status(500).json({ error: 'Failed to fetch keys' });
    }
});

// Create a new endpoint to get keys by mood
app.get('/api/keys-by-mood', async (req, res) => {
    try {
        const { mood } = req.query;
        if (!mood) {
            return res.status(400).json({ error: 'Mood parameter is required' });
        }
        
        const moods = Array.isArray(mood) ? mood : [mood];
        const records = await queryNeo4j(
            'MATCH (k:Key) WHERE any(m IN $moods WHERE m IN k.mood) RETURN k ORDER BY k.rootPitch',
            { moods }
        );
        const keys = records.map(record => record.get('k').properties);
        res.json(keys);
    } catch (error) {
        console.error('Error fetching keys by mood:', error);
        res.status(500).json({ error: 'Failed to fetch keys by mood' });
    }
});

// Create a new endpoint to get keys by root
app.get('/api/keys-by-root', async (req, res) => {
    try {
        const { root } = req.query;
        if (!root) {
            return res.status(400).json({ error: 'Root parameter is required' });
        }
        
        const records = await queryNeo4j(
            'MATCH (r:KeyRoot {id: $root})-[:HAS_SCALE]->(k:Key) RETURN k ORDER BY k.scaleType',
            { root }
        );
        const keys = records.map(record => record.get('k').properties);
        res.json(keys);
    } catch (error) {
        console.error('Error fetching keys by root:', error);
        res.status(500).json({ error: 'Failed to fetch keys by root' });
    }
});

// Create a new endpoint to get keys by genre
app.get('/api/keys-by-genre', async (req, res) => {
    try {
        const { genre } = req.query;
        if (!genre) {
            return res.status(400).json({ error: 'Genre parameter is required' });
        }
        
        const records = await queryNeo4j(
            'MATCH (g:Genre {id: $genre})-[:COMMONLY_USES]->(k:Key) RETURN k ORDER BY k.rootPitch, k.scaleType',
            { genre }
        );
        const keys = records.map(record => record.get('k').properties);
        res.json(keys);
    } catch (error) {
        console.error('Error fetching keys by genre:', error);
        res.status(500).json({ error: 'Failed to fetch keys by genre' });
    }
});

// Modify the setup-db endpoint to work with in-memory storage
app.post('/api/setup-db', async (req, res) => {
    try {
        if (useInMemory) {
            // Clear existing data
            inMemoryDb.keys = [];
            inMemoryDb.scales = [];
            inMemoryDb.chords = [];
            inMemoryDb.progressions = [];
            inMemoryDb.genres = [];
            
            // Create keys
            await setupMusicalKeys(null);
            
            // Create basic scales
            inMemoryDb.scales = [
                {
                    id: 'major',
                    name: 'Major Scale',
                    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                    type: 'major',
                    mood: ['Happy', 'Bright', 'Stable'],
                    commonRhythms: ['4/4', '3/4'],
                    preferredQuantization: 0.25
                },
                {
                    id: 'minor',
                    name: 'Natural Minor Scale',
                    notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
                    type: 'minor',
                    mood: ['Sad', 'Dark', 'Mysterious'],
                    commonRhythms: ['4/4', '6/8'],
                    preferredQuantization: 0.25
                },
                {
                    id: 'blues',
                    name: 'Blues Scale',
                    notes: ['C', 'Eb', 'F', 'F#', 'G', 'Bb'],
                    type: 'blues',
                    mood: ['Soulful', 'Expressive'],
                    commonRhythms: ['12/8', '4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true
                },
                {
                    id: 'pentatonic',
                    name: 'Major Pentatonic',
                    notes: ['C', 'D', 'E', 'G', 'A'],
                    type: 'pentatonic',
                    mood: ['Simple', 'Folk', 'Peaceful'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.25
                }
            ];
            
            // Create basic chords
            inMemoryDb.chords = [
                {
                    id: 'C',
                    name: 'C Major',
                    notes: ['C', 'E', 'G'],
                    type: 'major',
                    function: 'tonic',
                    voiceLeading: ['G->C', 'E->F', 'C->B']
                },
                {
                    id: 'Dm',
                    name: 'D Minor',
                    notes: ['D', 'F', 'A'],
                    type: 'minor',
                    function: 'supertonic',
                    voiceLeading: ['A->G', 'F->E', 'D->C']
                },
                {
                    id: 'G7',
                    name: 'G Dominant 7th',
                    notes: ['G', 'B', 'D', 'F'],
                    type: 'seventh',
                    function: 'dominant',
                    voiceLeading: ['F->E', 'B->C', 'D->C']
                }
            ];
            
            // Create basic genres
            inMemoryDb.genres = [
                {
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
                },
                {
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
                },
                {
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
                }
            ];
            
            // Create progressions
            inMemoryDb.progressions = [
                {
                    id: 'I-IV-V',
                    name: 'Basic Major Progression',
                    chords: ['C', 'F', 'G'],
                    genre: ['Pop', 'Rock', 'Folk'],
                    mood: ['Happy', 'Stable'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.25
                },
                {
                    id: 'ii-V-I',
                    name: 'Jazz Standard Progression',
                    chords: ['Dm7', 'G7', 'Cmaj7'],
                    genre: ['Jazz'],
                    mood: ['Sophisticated', 'Complex'],
                    commonRhythms: ['4/4'],
                    preferredQuantization: 0.125,
                    useSwing: true
                },
                {
                    id: 'I7-IV7-V7',
                    name: 'Blues Progression',
                    chords: ['C7', 'F7', 'G7'],
                    genre: ['Blues'],
                    mood: ['Soulful', 'Expressive'],
                    commonRhythms: ['12/8'],
                    preferredQuantization: 0.125,
                    useSwing: true
                }
            ];
            
            console.log('In-memory database initialized with:', {
                keys: inMemoryDb.keys.length,
                scales: inMemoryDb.scales.length,
                chords: inMemoryDb.chords.length,
                progressions: inMemoryDb.progressions.length,
                genres: inMemoryDb.genres.length
            });
            
            res.json({ message: 'Music theory knowledge graph initialized successfully in memory!' });
        } else {
            const session = neo4jDriver.session();
            
            try {
                await session.run(`
                    CALL db.constraints() YIELD name
                    CALL db.dropConstraint(name)
                  `);                  

                // Clear existing data
                await session.run('MATCH (n) DETACH DELETE n');
    
                // Create musical keys
                await setupMusicalKeys(session);
    
                // Original setup code with Neo4j
                // Create basic scales
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
                    CREATE (pentatonic:Scale {
                        id: 'pentatonic',
                        name: 'Major Pentatonic',
                        notes: ['C', 'D', 'E', 'G', 'A'],
                        type: 'pentatonic',
                        mood: ['Simple', 'Folk', 'Peaceful'],
                        commonRhythms: ['4/4'],
                        preferredQuantization: 0.25
                    })
                `);
                
                // Create basic chords
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
                
                // Create basic genres
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
                
                // Create progressions
                await session.run(`
                    CREATE (prog1:Progression {
                        id: 'I-IV-V',
                        name: 'Basic Major Progression',
                        chords: ['C', 'F', 'G'],
                        genre: ['Pop', 'Rock', 'Folk'],
                        mood: ['Happy', 'Stable'],
                        commonRhythms: ['4/4'],
                        preferredQuantization: 0.25
                    })
                    CREATE (prog2:Progression {
                        id: 'ii-V-I',
                        name: 'Jazz Standard Progression',
                        chords: ['Dm7', 'G7', 'Cmaj7'],
                        genre: ['Jazz'],
                        mood: ['Sophisticated', 'Complex'],
                        commonRhythms: ['4/4'],
                        preferredQuantization: 0.125,
                        useSwing: true
                    })
                    CREATE (prog3:Progression {
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
                
                // Create relationships
                await session.run(`
                    MATCH (jazz:Genre {id: 'jazz'})
                    MATCH (blues:Scale {id: 'blues'})
                    CREATE (jazz)-[:COMMONLY_USES]->(blues)
                `);
                
                await session.run(`
                    MATCH (rock:Genre {id: 'rock'})
                    MATCH (pent:Scale {id: 'pentatonic'})
                    CREATE (rock)-[:COMMONLY_USES]->(pent)
                `);
                
                await session.run(`
                    MATCH (blues:Genre {id: 'blues'})
                    MATCH (bluesScale:Scale {id: 'blues'})
                    CREATE (blues)-[:COMMONLY_USES]->(bluesScale)
                `);
    
                res.json({ message: 'Music theory knowledge graph initialized successfully!' });
            } finally {
                await session.close();
            }
        }
    } catch (error: any) {
        console.error('Error setting up database:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ error: 'Failed to set up database', details: error.message });
    }    
});

// Expand Neo4j endpoint
app.post('/api/expand-db', async (req, res) => {
    try {
        if (!neo4jDriver) {
            return res.status(500).json({ error: 'Neo4j driver is not initialized' });
        }
        
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
            `);
            
            // Add more complex chord types
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
            `);

            // Connect new scales to genres
            await session.run(`
                MATCH (g:Genre {id: 'jazz'})
                MATCH (s:Scale {id: 'dorian'})
                CREATE (g)-[:COMMONLY_USES]->(s)
            `);
            
            // Add mood entities
            await session.run(`
                CREATE (happy:Mood {id: 'happy', name: 'Happy', valence: 0.8, arousal: 0.6})
                CREATE (sad:Mood {id: 'sad', name: 'Sad', valence: 0.2, arousal: 0.3})
                CREATE (energetic:Mood {id: 'energetic', name: 'Energetic', valence: 0.7, arousal: 0.9})
                CREATE (calm:Mood {id: 'calm', name: 'Calm', valence: 0.5, arousal: 0.2})
                CREATE (tense:Mood {id: 'tense', name: 'Tense', valence: 0.4, arousal: 0.7})
            `);
            
            // Connect moods to scales
            await session.run(`
                MATCH (m:Mood {id: 'happy'})
                MATCH (s:Scale {id: 'major'})
                CREATE (m)-[:SUGGESTS]->(s)
            `);
            
            await session.run(`
                MATCH (m:Mood {id: 'sad'})
                MATCH (s:Scale {id: 'minor'})
                CREATE (m)-[:SUGGESTS]->(s)
            `);
            
            res.json({ message: 'Music theory knowledge graph expanded successfully!' });
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

// Fix the SIGTERM and SIGINT handlers at the end of the file
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing Neo4j driver');
    if (neo4jDriver) {
        await neo4jDriver.close();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing Neo4j driver');
    if (neo4jDriver) {
        await neo4jDriver.close();
    }
    process.exit(0);
});

// Fix KeyRoot unused error by removing it
// ... existing code ...
interface KeyOption {
    value: string;
    label: string;
}
// ... existing code ...

// Fix neo4jDriver null errors
// ... existing code ...
app.get('/api/related-topics', async (req, res) => {
    try {
        const topic = req.query.topic as string;
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        if (!neo4jDriver) {
            return res.status(500).json({ error: 'Neo4j driver is not initialized' });
        }

        const session = neo4jDriver.session();
        // ... existing code ...
    } catch (error) {
        console.error('Error getting related topics:', error);
        res.status(500).json({ error: 'Failed to get related topics' });
    }
});
// ... existing code ...

app.get('/api/knowledge-graph', async (req, res) => {
    try {
        const rootTopic = req.query.root as string || 'music';
        const depth = parseInt(req.query.depth as string || '2', 10);

        if (!neo4jDriver) {
            return res.status(500).json({ error: 'Neo4j driver is not initialized' });
        }

        const session = neo4jDriver.session();
        // ... existing code ...
    } catch (error) {
        console.error('Error getting knowledge graph:', error);
        res.status(500).json({ error: 'Failed to get knowledge graph' });
    }
});
// ... existing code ...

// Fix any type in the MusicResult by making it explicit
interface MusicResult {
    notes: Note[];
    key: string;
    timeSignature: string;
    tempo: number;
    instruments: string[];
}
// ... existing code ...

// Fix unused prop parameters in selectScale functions
function selectBasedOnComplexity(records: any[], complexity: number) {
    if (records.length === 0) {
        // Fallback to a default record if no records are available
        return {
            name: 'Default',
            notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], // C major scale notes
            genres: ['Classical'],
            moods: ['Neutral']
        };
    }
    
    // Sort records by estimated complexity
    const sortedRecords = [...records].sort((a, b) => {
        // Estimate complexity based on record properties
        const complexityA = estimateComplexity(a);
        const complexityB = estimateComplexity(b);
        
        // For lower requested complexity, prefer simpler records
        // For higher requested complexity, prefer more complex records
        return complexity <= 5 
            ? complexityA - complexityB  // Ascending order for low complexity
            : complexityB - complexityA; // Descending order for high complexity
    });
    
    // Select a record based on the complexity level
    const index = Math.min(
        Math.floor((complexity / 10) * sortedRecords.length),
        sortedRecords.length - 1
    );
    
    return sortedRecords[index];
}

// Helper function to estimate complexity of a record
function estimateComplexity(record: any): number {
    // Basic complexity estimation - can be expanded based on record properties
    let score = 5; // Default middle complexity
    
    if (record.notes) {
        // More notes generally means more complex
        score += record.notes.length - 7; // 7 is the standard major scale length
    }
    
    // Additional complexity factors can be added here
    
    return Math.max(1, Math.min(10, score)); // Ensure score is between 1-10
}

function selectScaleBasedOnComplexity(scaleRecords: any[], complexity: number) {
    return selectBasedOnComplexity(scaleRecords, complexity);
}

function selectChordProgressionBasedOnComplexity(chordRecords: any[], complexity: number) {
    return selectBasedOnComplexity(chordRecords, complexity);
}

function selectRhythmBasedOnComplexity(rhythmRecords: any[], complexity: number) {
    return selectBasedOnComplexity(rhythmRecords, complexity);
}

function selectHarmonyBasedOnComplexity(harmonyRecords: any[], complexity: number) {
    return selectBasedOnComplexity(harmonyRecords, complexity);
}

function selectMelodyBasedOnComplexity(melodyRecords: any[], complexity: number) {
    return selectBasedOnComplexity(melodyRecords, complexity);
}
// ... existing code ...