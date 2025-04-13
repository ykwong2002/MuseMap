# MuseMap

MuseMap is a modern web application that combines music composition, AI-powered music generation, and MIDI playback capabilities. Built with React, TypeScript, and Material-UI, it provides an intuitive interface for creating and exploring musical compositions.

## Features

- **AI-Powered Music Generation**: Leverages OpenAI's API to generate musical compositions
- **MIDI Playback**: Built-in MIDI player for listening to generated compositions
- **Neo4j Database Integration**: Stores and manages musical data and relationships
- **Modern UI**: Clean and responsive interface built with Material-UI
- **Error Handling**: Robust error boundary implementation for graceful error management

## Tech Stack

- **Frontend**:
  - React 19
  - TypeScript
  - Material-UI
  - Framer Motion
  - Tone.js
  - @tonejs/midi

- **Backend**:
  - Neo4j Database
  - OpenAI API

## Prerequisites

- Node.js (latest LTS version recommended)
- Neo4j Database
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MuseMap.git
   cd MuseMap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_NEO4J_URI=your_neo4j_uri
   VITE_NEO4J_USER=your_neo4j_username
   VITE_NEO4J_PASSWORD=your_neo4j_password
   ```

4. Initialize the database:
   ```bash
   npm run setup-db
   ```

## Development

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build
- `npm run lint`: Run ESLint for code quality checks
- `npm run setup-db`: Initialize the Neo4j database
- `npm run init`: Install dependencies and set up the database

## Project Structure

- `src/`
  - `components/`: Reusable UI components
  - `pages/`: Main application pages
  - `services/`: Backend service integrations
  - `utils/`: Utility functions
  - `hooks/`: Custom React hooks
  - `context/`: React context providers
  - `types/`: TypeScript type definitions
  - `assets/`: Static assets
  - `config/`: Configuration files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
