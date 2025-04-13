# MuseMap: Music Composition Assistant with Knowledge Graphs

MuseMap is a music composition assistant that uses a Neo4j knowledge graph to help composers create music based on music theory principles. The application allows users to specify a genre, mood, and complexity level to generate MIDI compositions.

## Current Capabilities

- **Music Generation**: Creates melodies based on specified genre, mood, and complexity
- **Knowledge Graph**: Stores music theory relationships in Neo4j (scales, chords, progressions, genres)
- **MIDI Playback**: Built-in player for listening to generated compositions
- **Parameter Customization**: Select genre, mood, and complexity levels

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Material-UI for components
  - Tone.js for audio synthesis
  - @tonejs/midi for MIDI file manipulation

- **Backend**:
  - Express.js server
  - Neo4j database for knowledge graph
  - Custom algorithmic composition engine

## Getting Started

### Prerequisites
- Node.js (v16+)
- Neo4j Database (local or cloud instance)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/musemap.git
   cd musemap
   ```

2. Install dependencies:
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. Configure environment variables:
   Create `.env` files in both the root and server directories with the following variables:
   ```
   # Root .env
   VITE_API_BASE_URL=http://localhost:3001
   
   # Server .env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   PORT=3001
   ```

4. Initialize the Neo4j database:
   Start your Neo4j instance, then run:
   ```bash
   # Run the server
   cd server
   npm run dev
   
   # In another terminal, initialize the database
   curl -X POST http://localhost:3001/api/setup-db
   ```

5. Start both the server and frontend:
   ```bash
   npm run dev:all
   ```

## Usage

1. Navigate to the application in your browser (default: http://localhost:5173)
2. Select a musical genre (Jazz, Rock, Blues, or Classical)
3. Choose mood options (Happy, Sad, Soulful, etc.)
4. Set the complexity level (1-10)
5. Click "Generate Music" to create a new composition
6. Use the built-in MIDI player to listen to your composition

## Music Generation Process

The current version uses a deterministic algorithm that:
1. Selects appropriate scales based on the requested mood
2. Uses genre characteristics to determine note density, velocity, and rhythm
3. Applies a simple harmonic progression (I-IV-V pattern)
4. Adjusts complexity by varying note count and rhythmic patterns
5. Generates MIDI data that can be played in the browser

## Knowledge Graph Structure

MuseMap's knowledge graph contains:

- **Scales**: Major, minor, pentatonic, blues with mood associations
- **Chords**: Major, minor, seventh with functional relationships
- **Progressions**: Common chord sequences with genre associations
- **Genres**: Musical styles with typical tempo ranges and rhythms

## Future Development

- Add AI-powered generation capabilities
- Expand the music theory knowledge graph
- Support for more complex musical structures
- Add harmonic analysis features
- Support exporting to different file formats

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to music theory educators and resources that informed our knowledge graph
- The Neo4j community for their excellent tools and documentation
