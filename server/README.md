# MuseMap Server

This is the backend server for MuseMap, a music composition assistant that uses knowledge graphs and retrieval-augmented generation.

## Features

- Neo4j knowledge graph for music theory relationships
- OpenAI integration for intelligent music generation
- REST API for client interaction
- Express.js server with TypeScript

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   OPENAI_API_KEY=your_openai_api_key
   PORT=3001
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

4. Initialize the database:
   ```bash
   curl -X POST http://localhost:3001/api/setup-db
   ```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/scales` - Get all scales
- `GET /api/chords` - Get all chords
- `GET /api/progressions` - Get all progressions
- `GET /api/genres` - Get all genres
- `GET /api/scales-by-mood?mood=Happy` - Get scales by mood
- `GET /api/chords-by-scale?scaleId=major` - Get chords by scale
- `GET /api/progressions-by-genre?genre=Jazz` - Get progressions by genre
- `POST /api/generate-music` - Generate music with AI
- `POST /api/setup-db` - Initialize the database

## Knowledge Graph Structure

The Neo4j database contains the following node types:
- Scales (Major, Minor, Blues, etc.)
- Chords (Major, Minor, 7th, etc.)
- Progressions (I-IV-V, ii-V-I, etc.) 
- Genres (Jazz, Rock, Blues, etc.)

With relationships between them:
- CONTAINS (Scale to Chord)
- COMMONLY_USES (Genre to Progression)
- SUGGESTS (Scale to Progression)

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm test` - Run tests 