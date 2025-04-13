import { neo4jService } from '../services/neo4jService';

async function setupMusicTheoryGraph() {
    const session = await neo4jService.getSession();
    try {
        // Clear existing data
        await session.run('MATCH (n) DETACH DELETE n');

        // Create scales
        await session.run(`
            CREATE (major:Scale {
                id: 'major',
                name: 'Major Scale',
                notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                type: 'major',
                mood: ['Happy', 'Bright', 'Stable']
            })
            CREATE (minor:Scale {
                id: 'minor',
                name: 'Natural Minor Scale',
                notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
                type: 'minor',
                mood: ['Sad', 'Dark', 'Mysterious']
            })
            CREATE (pent:Scale {
                id: 'pentatonic',
                name: 'Major Pentatonic',
                notes: ['C', 'D', 'E', 'G', 'A'],
                type: 'pentatonic',
                mood: ['Simple', 'Folk', 'Peaceful']
            })
        `);

        // Create basic chords
        await session.run(`
            CREATE (cmaj:Chord {
                id: 'C',
                name: 'C Major',
                notes: ['C', 'E', 'G'],
                type: 'major',
                function: 'tonic'
            })
            CREATE (dmin:Chord {
                id: 'Dm',
                name: 'D Minor',
                notes: ['D', 'F', 'A'],
                type: 'minor',
                function: 'supertonic'
            })
            CREATE (gmaj:Chord {
                id: 'G7',
                name: 'G Dominant 7th',
                notes: ['G', 'B', 'D', 'F'],
                type: 'seventh',
                function: 'dominant'
            })
        `);

        // Create common progressions
        await session.run(`
            CREATE (p1:Progression {
                id: 'I-IV-V',
                name: 'Basic Major Progression',
                chords: ['C', 'F', 'G'],
                genre: ['Pop', 'Rock', 'Folk'],
                mood: ['Happy', 'Stable']
            })
            CREATE (p2:Progression {
                id: 'ii-V-I',
                name: 'Jazz Standard Progression',
                chords: ['Dm7', 'G7', 'Cmaj7'],
                genre: ['Jazz'],
                mood: ['Sophisticated', 'Complex']
            })
        `);

        // Create genres with characteristics
        await session.run(`
            CREATE (jazz:Genre {
                id: 'jazz',
                name: 'Jazz',
                commonProgressions: ['ii-V-I'],
                commonScales: ['major', 'minor'],
                tempoMin: 80,
                tempoMax: 160
            })
            CREATE (rock:Genre {
                id: 'rock',
                name: 'Rock',
                commonProgressions: ['I-IV-V'],
                commonScales: ['major', 'pentatonic'],
                tempoMin: 100,
                tempoMax: 180
            })
        `);

        // Create relationships - now split into separate queries
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