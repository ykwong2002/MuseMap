from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import random
import time
import os
import torch
import uuid
import numpy as np
import scipy.io.wavfile as wavfile
from transformers import AutoProcessor, MusicgenForConditionalGeneration

app = FastAPI(title="MuseMap AI Service", 
              description="AI service for music generation")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create output directory if it doesn't exist
AUDIO_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated_audio")
os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

# Flag to indicate if we should use fallback generation
USE_FALLBACK = False

# Load MusicGen model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Define global variables
processor = None
model = None

# Use smaller model if memory is a concern
MODEL_ID = "facebook/musicgen-small"
try:
    print("Loading MusicGen processor...")
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    print("Loading MusicGen model...")
    model = MusicgenForConditionalGeneration.from_pretrained(MODEL_ID)
    model = model.to(device)
    print(f"Successfully loaded MusicGen model: {MODEL_ID}")
except Exception as e:
    print(f"Error loading MusicGen model: {e}")
    USE_FALLBACK = True
    print("Will use fallback audio generation")

class MusicGenerationRequest(BaseModel):
    key: str
    instruments: List[str]
    mood: str
    genre: str
    chords: Optional[str] = None
    tempo: int
    duration: int

class MusicGenerationResponse(BaseModel):
    audio_url: str
    duration_seconds: int
    generated_at: str

@app.get("/")
def read_root():
    return {"message": "MuseMap AI Service is running"}

@app.get("/health")
def health_check():
    """Provide detailed information about the service health and model status."""
    return {
        "status": "running",
        "model_id": MODEL_ID,
        "device": device,
        "model_loaded": model is not None and processor is not None,
        "using_fallback": USE_FALLBACK,
        "generated_audio_dir": AUDIO_OUTPUT_DIR
    }

def create_prompt(request: MusicGenerationRequest) -> str:
    """Create a detailed prompt for MusicGen based on user input parameters."""
    prompt = f"{request.mood} {request.genre} music"
    
    # Add key information
    prompt += f" in {request.key}"
    
    # Add tempo information
    if request.tempo < 80:
        prompt += ", slow tempo"
    elif request.tempo > 140:
        prompt += ", fast tempo"
    else:
        prompt += ", medium tempo"
    
    # Add instruments
    if request.instruments:
        instruments_text = ", ".join(request.instruments[:-1])
        if len(request.instruments) > 1:
            instruments_text += f" and {request.instruments[-1]}"
        else:
            instruments_text = request.instruments[0]
        prompt += f", with {instruments_text}"
    
    # Add chord progression if provided
    if request.chords:
        prompt += f", using chord progression {request.chords}"
    
    return prompt

def generate_fallback_audio(duration_seconds=10, sample_rate=32000):
    """Generate a simple sine wave as fallback when the model fails to load."""
    print("Using fallback audio generation")
    # Create a simple sine wave with some variations
    t = np.linspace(0, duration_seconds, int(duration_seconds * sample_rate), False)
    
    # Generate a chord-like sound with multiple frequencies
    frequencies = [440, 554.37, 659.25]  # A4, C#5, E5 (A major chord)
    
    # Create a decay envelope
    envelope = np.exp(-t)
    
    # Generate the composite signal
    signal = np.zeros_like(t)
    for freq in frequencies:
        signal += np.sin(2 * np.pi * freq * t)
    
    # Apply envelope and normalize
    signal = signal * envelope
    signal = signal / np.max(np.abs(signal)) * 0.9
    
    # Convert to 16-bit PCM
    return (signal * 32767).astype(np.int16), sample_rate

@app.post("/generate", response_model=MusicGenerationResponse)
async def generate_music(request: MusicGenerationRequest):
    """Generate music using MusicGen based on the provided parameters."""
    try:
        global model, processor
        print(f"Generating music with parameters: {request}")
        
        # Create a detailed prompt
        prompt = create_prompt(request)
        print(f"Generated prompt: '{prompt}'")
        
        # Set max duration - MusicGen typically generates up to 30 seconds
        max_duration = min(request.duration, 30)
        
        # Check if we need to use fallback
        if USE_FALLBACK:
            print("Using fallback audio generation due to model loading failure")
            audio_data, sampling_rate = generate_fallback_audio(max_duration)
        else:
            # Check if model is properly loaded
            if model is None or processor is None:
                raise HTTPException(status_code=500, detail="MusicGen model failed to load")
            
            # Generate the music
            inputs = processor(
                text=[prompt],
                padding=True,
                return_tensors="pt",
            ).to(device)
            
            # Set generation parameters
            sampling_rate = 32000  # MusicGen's sampling rate
            
            # Generate audio
            with torch.no_grad():
                generated_audio = model.generate(
                    **inputs,
                    max_new_tokens=256 * max_duration,  # Approximate token count for duration
                    do_sample=True,
                    guidance_scale=3.0,
                    temperature=1.0,
                )
            
            audio_data = generated_audio.cpu().numpy().squeeze()
            
            # Normalize the audio
            audio_data = audio_data / np.max(np.abs(audio_data))
            audio_data = (audio_data * 32767).astype(np.int16)
        
        # Save the audio file
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(AUDIO_OUTPUT_DIR, filename)
        
        # Save as WAV file
        wavfile.write(filepath, sampling_rate, audio_data)
        
        # Return the file URL - use relative path that Express will serve
        audio_url = f"/generated_audio/{filename}"
        
        return MusicGenerationResponse(
            audio_url=audio_url,
            duration_seconds=max_duration,
            generated_at=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
    except Exception as e:
        print(f"Error generating music: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate music: {str(e)}")

if __name__ == "__main__":
    # Run the FastAPI server
    port = int(os.getenv("AI_SERVICE_PORT", 5002))
    uvicorn.run(app, host="0.0.0.0", port=port) 