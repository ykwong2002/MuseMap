# MuseMap 🎵 AI Music Generation

MuseMap is a web application that leverages artificial intelligence to generate original music based on user-specified parameters. With an intuitive interface, users can create custom musical compositions by selecting key, instruments, mood, genre, and more.

## 🚀 Features

- **AI-Powered Music Generation**: Create original music compositions using advanced AI models
- **Customizable Parameters**: Select key, instruments, mood, genre, tempo, and duration
- **Real-time Preview**: Listen to generated music directly in the browser
- **Music Library**: Save and organize your AI-generated compositions
- **Download & Share**: Export your creations for use in other projects

## 🔧 Tech Stack

### Frontend
- React with TypeScript
- Chakra UI & Tailwind CSS for styling
- Framer Motion for animations
- Tone.js for audio playback

### Backend
- Node.js with Express for API routing
- Python with FastAPI for AI model service
- Firebase for data storage (future implementation)

## 📋 Prerequisites

- Node.js (v16 or later)
- Python 3.8+ (for AI service)
- npm or yarn

## 🛠️ Installation

### Clone the repository
```bash
git clone https://github.com/yourusername/musemap.git
cd musemap
```

### Install dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install Python dependencies (optional for demo)
pip install -r requirements.txt
```

## 🚀 Running the Application

### Development mode

```bash
# Start frontend and backend concurrently
npm run dev:all

# Or start them separately
npm run dev        # Frontend
npm run server     # Backend
```

### Production build

```bash
npm run build
cd backend
npm start
```

## 🔍 API Endpoints

- `GET /api/creations`: Get all saved music creations
- `GET /api/creations/:id`: Get a specific music creation
- `POST /api/generate`: Generate a new music composition
- `DELETE /api/creations/:id`: Delete a saved creation

## 🎵 How Music Generation Works

1. **Parameter Selection**: User selects musical parameters (key, mood, instruments, etc.)
2. **AI Processing**: Parameters are sent to the AI model
3. **Generation**: The AI model creates original music based on the parameters
4. **Delivery**: The generated audio is returned and played in the browser

## 🔜 Future Enhancements

- Fine-tuned AI models for different musical styles
- Advanced editing capabilities for generated music
- Collaborative features for multiple users
- Mobile application

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Credits

- Music generation powered by [MusicGen](https://github.com/facebookresearch/audiocraft) / [Magenta](https://github.com/magenta/magenta)
- Audio processing with [Tone.js](https://tonejs.github.io/) 