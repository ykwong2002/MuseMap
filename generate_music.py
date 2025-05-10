#!/usr/bin/env python3
import os
import argparse
import torch
import torchaudio
from transformers import AutoProcessor, MusicgenForConditionalGeneration
import numpy as np

def generate_music(prompt, output_path="output.wav", model_name="facebook/musicgen-small", duration=8.0):
    """
    Generate music based on a text prompt using MusicGen
    
    Args:
        prompt (str): Text description of the music to generate
        output_path (str): Path to save the generated audio
        model_name (str): MusicGen model to use
        duration (float): Duration of the generated audio in seconds
    """
    print(f"Loading model: {model_name}...")
    
    # Load model and processor
    processor = AutoProcessor.from_pretrained(model_name)
    model = MusicgenForConditionalGeneration.from_pretrained(model_name)
    
    # Set device (use CUDA if available)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    
    print(f"Generating music based on prompt: '{prompt}'")
    print(f"Using device: {device}")
    
    # Process the prompt
    inputs = processor(
        text=[prompt],
        padding=True,
        return_tensors="pt",
    ).to(device)
    
    # Generate audio
    # Fixed calculation - 50 tokens per second is a reasonable approximation
    # for the default model settings
    max_new_tokens = int(duration * 50)
    
    with torch.no_grad():
        generated_audio = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            guidance_scale=3.0
        )
    
    # Get the audio data
    sampling_rate = model.config.audio_encoder.sampling_rate
    
    # Get the audio tensor directly
    audio_values = processor.batch_decode(
        generated_audio, 
        output_type="pt",
        sampling_rate=sampling_rate
    )[0]
    
    # Convert float32 [-1, 1] to int16 for WAV
    audio_values = (audio_values * 32767.0).clip(-32768, 32767).astype(np.int16)
    if audio_values.ndim == 1:
        audio_values = np.expand_dims(audio_values, axis=0)
    audio_values = torch.from_numpy(audio_values)
    
    # Save the audio using torchaudio
    torchaudio.save(output_path, audio_values, sampling_rate)
    
    print(f"Generated audio saved to: {output_path}")
    return output_path

def main():
    parser = argparse.ArgumentParser(description="Generate music using MusicGen based on a text prompt")
    parser.add_argument("prompt", type=str, help="Text prompt describing the music to generate")
    parser.add_argument("--output", "-o", type=str, default="output.wav", help="Output file path (default: output.wav)")
    parser.add_argument("--model", "-m", type=str, default="facebook/musicgen-small", 
                        help="MusicGen model to use (default: facebook/musicgen-small)")
    parser.add_argument("--duration", "-d", type=float, default=8.0, 
                        help="Duration of the generated audio in seconds (default: 8.0)")
    
    args = parser.parse_args()
    
    generate_music(
        prompt=args.prompt,
        output_path=args.output,
        model_name=args.model,
        duration=args.duration
    )

if __name__ == "__main__":
    main() 