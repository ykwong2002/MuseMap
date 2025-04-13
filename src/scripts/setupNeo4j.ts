import { neo4jService } from '../services/neo4jService';
import { nodeConfig } from '../config/node-env';

// Initialize neo4jService with node config
neo4jService.initialize(nodeConfig.neo4j);

async function setupMusicTheoryGraph() {
    const session = await neo4jService.getSession();
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

        console.log('Music theory knowledge graph initialized successfully!');
    } catch (error) {
        console.error('Error initializing knowledge graph:', error);
    } finally {
        await session.close();
        await neo4jService.close();
    }
}

// Run the setup
setupMusicTheoryGraph().then(() => {
    console.log('Setup complete');
    process.exit(0);
}).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});