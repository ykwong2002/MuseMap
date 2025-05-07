# MuseMap AI Music Generation Backend

This backend provides an Express server that communicates with a Python AI service running MusicGen for high-quality AI music generation.

## Requirements

- Node.js (v14 or later)
- Python (3.8 or later)
- PyTorch
- CUDA-compatible GPU (recommended, but CPU will work)

## Installation

### 1. Install Node.js dependencies

```bash
npm install
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

This will install the required Python packages including:
- FastAPI for the AI service API
- PyTorch and torchaudio for audio processing
- Transformers for the Hugging Face MusicGen model
- Other necessary dependencies

## Running the Services

### Option 1: Start both services with the script (recommended)

```bash
./start.sh
```

This script will:
1. Start the Python AI service
2. Wait for it to initialize
3. Start the Express server
4. Set up proper shutdown for both services

### Option 2: Start services individually

Terminal 1 - Start the AI service:
```bash
python ai_service.py
```

Terminal 2 - Start the Express server:
```bash
npm start
```

## How it Works

1. The React frontend sends music generation parameters to the Express server
2. The Express server forwards these parameters to the Python AI service
3. The AI service uses MusicGen to generate music based on these parameters
4. The generated audio is saved as a WAV file
5. The Express server serves the audio file to the frontend

## Configuration

You can configure the services using environment variables:

- `PORT`: Express server port (default: 8000)
- `AI_SERVICE_URL`: URL for the AI service (default: http://localhost:5000)
- `AI_SERVICE_PORT`: Port for the AI service (default: 5000)

## Troubleshooting

- If you encounter memory issues, try using the smaller MusicGen models
- The first generation might take longer as the model is downloaded from Hugging Face
- Ensure you have proper CUDA drivers installed if using GPU acceleration 