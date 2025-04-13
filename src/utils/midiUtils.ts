import { Midi } from '@tonejs/midi';

interface MIDINote {
    pitch: string;
    time: number;
    duration: number;
    velocity: number;
}

interface TimeSignature {
    numerator: number;
    denominator: number;
}

interface QuantizeOptions {
    gridSize: number; // in beats (e.g., 1/4 for quarter notes)
    swing?: number;   // 0-1, where 0.5 is straight timing
}

export function createMIDIFile(
    notes: MIDINote[], 
    tempo: number, 
    timeSignature: TimeSignature = { numerator: 4, denominator: 4 },
    quantizeOpts?: QuantizeOptions
): string {
    const midi = new Midi();
    const track = midi.addTrack();

    // Set tempo and time signature
    midi.header.setTempo(tempo);
    midi.header.timeSignatures.push({
        ticks: 0,
        timeSignature: [timeSignature.numerator, timeSignature.denominator]
    });

    // Convert tempo to seconds per beat
    const secondsPerBeat = 60 / tempo;

    // Quantize notes if options are provided
    const processedNotes = quantizeOpts 
        ? quantizeNotes(notes, quantizeOpts, secondsPerBeat) 
        : notes;

    // Add notes to the track
    processedNotes.forEach(note => {
        track.addNote({
            midi: getMIDINoteNumber(note.pitch),
            time: note.time,
            duration: note.duration,
            velocity: note.velocity
        });
    });

    return Buffer.from(midi.toArray()).toString('base64');
}

function quantizeNotes(
    notes: MIDINote[], 
    options: QuantizeOptions,
    secondsPerBeat: number
): MIDINote[] {
    const { gridSize, swing = 0.5 } = options;
    const gridInSeconds = gridSize * secondsPerBeat;

    return notes.map(note => {
        // Calculate the nearest grid position
        const gridPosition = Math.round(note.time / gridInSeconds) * gridInSeconds;
        
        // Apply swing if it's an off-beat position
        const isOffBeat = (gridPosition / gridInSeconds) % 2 === 1;
        const swingOffset = isOffBeat ? (swing - 0.5) * gridInSeconds : 0;

        return {
            ...note,
            time: gridPosition + swingOffset,
            // Quantize duration to avoid overlaps
            duration: Math.max(
                0.1, // Minimum duration
                Math.round(note.duration / (gridInSeconds / 4)) * (gridInSeconds / 4)
            )
        };
    });
}

// Improved MIDI note number conversion with error handling
function getMIDINoteNumber(noteName: string): number {
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

// Utility function to format duration in musical terms
export function formatDuration(seconds: number, tempo: number): string {
    const beatsPerSecond = tempo / 60;
    const beats = seconds * beatsPerSecond;
    
    if (beats === 1) return 'quarter note';
    if (beats === 0.5) return 'eighth note';
    if (beats === 0.25) return 'sixteenth note';
    if (beats === 2) return 'half note';
    if (beats === 4) return 'whole note';
    
    return `${beats} beats`;
}