# MuseMap: Music Composition Assistant with Knowledge Graphs and RAG

MuseMap is an intelligent music composition assistant that harnesses the power of Knowledge Graphs and Retrieval-Augmented Generation (RAG) to help composers create musically coherent and innovative pieces based on music theory principles.

## Concept Overview

MuseMap develops a comprehensive knowledge graph of music theory elements — such as scales, chords, progressions, rhythmic patterns, instrumentation, and genre conventions — to assist composers in generating new musical pieces. When a user supplies a seed (for example, a chord progression, a desired genre, or mood), the system retrieves relevant nodes from the knowledge graph and uses this structured context to generate musically coherent compositions.

## Key Features

### Knowledge Graph
- **Entities**: Chords, scales, motifs, time signatures, instruments, and genres
- **Relationships**: How scales lead to specific chord progressions, typical rhythmic patterns for different genres, and common modulatory transitions
- **Musical Rules**: Voice leading, harmonic resolution, and other music theory principles

### Retrieval-Augmented Generation
- Context-aware music generation based on the knowledge graph
- Genre and mood-appropriate musical suggestions
- Configurable complexity levels for different user needs

### User Experience
- Interactive interface for customizing parameters such as genre, emotional tone, and complexity
- Real-time MIDI playback
- Simple and intuitive design

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Material-UI for components
  - Tone.js for audio synthesis
  - @tonejs/midi for MIDI file manipulation

- **Backend**:
  - Express.js server
  - Neo4j database for knowledge graph
  - OpenAI API for generative capabilities

## Getting Started

### Prerequisites
- Node.js (v16+)
- Neo4j Database (local or cloud instance)
- OpenAI API key

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
   OPENAI_API_KEY=your_openai_api_key
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

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Navigate to the application in your browser (default: http://localhost:5173)
2. Select a musical genre, mood, and desired complexity
3. Click "Generate Music" to create a new composition
4. Play back the MIDI using the built-in player
5. Adjust parameters and regenerate as needed

## Knowledge Graph Structure

MuseMap's knowledge graph includes the following key components:

- **Scales**: Major, minor, pentatonic, blues, etc. with mood associations
- **Chords**: Major, minor, seventh, etc. with functional relationships
- **Progressions**: Common chord sequences with genre associations
- **Genres**: Musical styles with typical tempo ranges, rhythms, and progressions

The relationships between these components form the foundation for musically intelligent generation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to music theory educators and resources that informed our knowledge graph
- The Neo4j and OpenAI communities for their excellent tools and documentation
