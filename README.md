# MusicGen Script

This script uses Meta's MusicGen model via HuggingFace to generate music based on text prompts.

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Basic usage:

```bash
python generate_music.py "A cheerful jazz melody with piano and saxophone"
```

This will generate an 8-second audio file and save it as `output.wav` in the current directory.

### Options

- `--output` or `-o`: Specify the output file path (default: `output.wav`)
- `--model` or `-m`: Specify the MusicGen model to use (default: `facebook/musicgen-small`)
- `--duration` or `-d`: Specify the duration of the generated audio in seconds (default: 8.0)

### Example with options

```bash
python generate_music.py "An electronic dance beat with synths and a heavy bass" --output my_music.wav --model facebook/musicgen-medium --duration 15.0
```

## Available Models

- `facebook/musicgen-small`: Smaller model, faster generation
- `facebook/musicgen-medium`: Medium-sized model, better quality
- `facebook/musicgen-large`: Large model, best quality but slower and requires more memory

## Note

The first time you run the script, it will download the model which might take some time depending on your internet connection and the model size. 