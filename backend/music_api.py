from fastapi import FastAPI, Form, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
from generate_music import generate_music

app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
def generate(
    mood: str = Form(...),
    genre: str = Form(...),
    instruments: str = Form(...),  # comma-separated string
    tempo: str = Form(...),
    duration: float = Form(8.0)
):
    """
    Generate music based on user input and return the audio file.
    """
    prompt = f"A {mood} {genre} song with {instruments} at {tempo} tempo."
    output_path = "output.wav"
    try:
        generate_music(prompt, output_path=output_path, duration=duration)
        return FileResponse(output_path, media_type="audio/wav", filename="music.wav")
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)}) 