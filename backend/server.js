import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5002';

// Setup file upload storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const generatedAudioDir = path.join(__dirname, 'generated_audio');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use('/generated_audio', express.static(generatedAudioDir));

// Sample user creations (in-memory database for demo)
let userCreations = [
  {
    id: '1',
    title: 'Upbeat Summer Melody',
    date: '2023-05-15',
    key: 'C Major',
    genre: 'Pop',
    mood: 'Happy',
    duration: '2:45',
    instruments: ['Piano', 'Guitar', 'Drums'],
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    audioUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
  },
  {
    id: '2',
    title: 'Melancholic Autumn',
    date: '2023-06-02',
    key: 'A Minor',
    genre: 'Classical',
    mood: 'Sad',
    duration: '3:12',
    instruments: ['Piano', 'Strings'],
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/forest_ambience.ogg',
  },
  {
    id: '3',
    title: 'Electronic Fusion',
    date: '2023-06-10',
    key: 'F# Minor',
    genre: 'Electronic',
    mood: 'Energetic',
    duration: '4:05',
    instruments: ['Synth', 'Drums', 'Bass'],
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/alien_beam.ogg',
  }
];

// Routes
app.get('/', (req, res) => {
  res.send('MuseMap API is running');
});

// Get all user creations
app.get('/api/creations', (req, res) => {
  res.json(userCreations);
});

// Get a specific creation
app.get('/api/creations/:id', (req, res) => {
  const creation = userCreations.find(c => c.id === req.params.id);
  if (!creation) return res.status(404).json({ message: 'Creation not found' });
  res.json(creation);
});

// Create a new music generation
app.post('/api/generate', async (req, res) => {
  try {
    const { key, instruments, mood, genre, chords, tempo, duration } = req.body;
    
    console.log('Received generation request:', { key, instruments, mood, genre });
    
    // Call the Python AI service to generate music
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
        key,
        instruments,
        mood,
        genre,
        chords,
        tempo,
        duration
      });
      
      // Get generated audio URL and metadata from AI service
      const { audio_url, duration_seconds, generated_at } = aiResponse.data;
      
      // Generate a placeholder image based on genre and mood
      const imageMap = {
        'Happy': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
        'Sad': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6',
        'Energetic': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
        'Calm': 'https://images.unsplash.com/photo-1506050691795-acc4668f54b2',
        'Romantic': 'https://images.unsplash.com/photo-1518510878872-2f23a0dd9544',
        'default': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d'
      };
      
      const imageUrl = imageMap[mood] || imageMap.default;
      
      // Create a new creation entry
      const newCreation = {
        id: uuidv4(),
        title: `${mood} ${genre} in ${key}`,
        date: new Date().toISOString().split('T')[0],
        key,
        genre,
        mood,
        duration: `${Math.floor(duration_seconds / 60)}:${(duration_seconds % 60).toString().padStart(2, '0')}`,
        instruments,
        imageUrl: `${imageUrl}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80`,
        audioUrl: audio_url,
      };
      
      // Add to our in-memory database
      userCreations.push(newCreation);
      
      res.status(201).json({
        message: 'Music generated successfully',
        creation: newCreation
      });
    } catch (aiError) {
      console.error('AI Service error:', aiError.message);
      if (aiError.response) {
        console.error('AI Service response:', aiError.response.data);
      }
      throw new Error(`AI Service error: ${aiError.message}`);
    }
  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ message: 'Failed to generate music', error: error.message });
  }
});

// Delete a creation
app.delete('/api/creations/:id', (req, res) => {
  const creationIndex = userCreations.findIndex(c => c.id === req.params.id);
  if (creationIndex === -1) return res.status(404).json({ message: 'Creation not found' });
  
  userCreations.splice(creationIndex, 1);
  res.json({ message: 'Creation deleted successfully' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Connected to AI Service at ${AI_SERVICE_URL}`);
}); 