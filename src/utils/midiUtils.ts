import { Midi } from '@tonejs/midi';

// Interface matching the API response format
interface APINote {
    pitch: number;      // MIDI note number (e.g., 60 for C4)
    startTime: number;  // in beats
    duration: number;   // in beats
    velocity: number;   // 0-127
}

// Browser-compatible base64 encoding function
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Create MIDI file from API response format
export function createMIDIFile(
    notes: APINote[], 
    tempo: number = 120, 
    key: string = 'C', 
    timeSignatureStr: string = '4/4'
): string {
    const midi = new Midi();
    
    // Set metadata
    midi.header.name = `MuseMap Composition in ${key}`;
    midi.header.setTempo(tempo);
    
    // Parse time signature
    const [numerator, denominator] = timeSignatureStr.split('/').map(Number);
    if (numerator && denominator) {
        midi.header.timeSignatures.push({
            ticks: 0,
            timeSignature: [numerator, denominator]
        });
    }
    
    // Add track with instrument
    const track = midi.addTrack();
    track.name = 'MuseMap Generated';
    track.instrument.name = 'Grand Piano';
    
    // Add notes to the track
    notes.forEach(note => {
        track.addNote({
            midi: typeof note.pitch === 'number' ? note.pitch : getMIDINoteNumber(note.pitch),
            time: note.startTime,
            duration: note.duration,
            velocity: note.velocity / 127 // Normalize to 0-1 for Tone.js
        });
    });

    // Use browser-compatible base64 encoding
    return arrayBufferToBase64(midi.toArray());
}

// Convert note names to MIDI numbers
function getMIDINoteNumber(noteName: string): number {
    // If already a number, return directly
    if (!isNaN(Number(noteName))) {
        return Number(noteName);
    }
    
    const noteMap: { [key: string]: number } = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) {
        throw new Error(`Invalid note name: ${noteName}. Expected format: C4, F#3, etc.`);
    }

    const [, note, octave] = match;
    const noteNumber = noteMap[note];
    if (noteNumber === undefined) {
        throw new Error(`Invalid note name: ${note}`);
    }

    const octaveNum = parseInt(octave);
    if (octaveNum < -1 || octaveNum > 9) {
        throw new Error(`Octave out of range: ${octaveNum}. Must be between -1 and 9.`);
    }

    return noteNumber + ((octaveNum + 1) * 12);
}

// Utility function to format duration in time format
export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Extract key and time signature from string format
export function parseMusicalAttributes(keySignature: string): {key: string, mode: 'major' | 'minor'} {
    const keyMatch = keySignature.match(/([A-G][#b]?)\s*(major|minor|maj|min|M|m)/i);
    
    if (!keyMatch) {
        return {key: 'C', mode: 'major'};
    }
    
    const keyName = keyMatch[1];
    const keyMode = keyMatch[2].toLowerCase();
    
    return {
        key: keyName,
        mode: keyMode.startsWith('m') && keyMode !== 'major' ? 'minor' : 'major'
    };
}

// Helper function to convert from MIDI note number to note name
export function midiNoteToName(midiNote: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = notes[midiNote % 12];
    return `${note}${octave}`;
}