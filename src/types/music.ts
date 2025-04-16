export interface Scale {
    id: string;
    name: string;
    notes: string[];
    type: 'major' | 'minor' | 'pentatonic' | 'modal';
    mood: string[];
}

export interface Chord {
    id: string;
    name: string;
    notes: string[];
    type: 'major' | 'minor' | 'diminished' | 'augmented' | 'seventh';
    function: string; // tonic, subdominant, dominant, etc.
}

export interface Progression {
    id: string;
    name: string;
    chords: string[]; // References to chord IDs
    genre: string[];
    mood: string[];
}

export interface Genre {
    id: string;
    name: string;
    commonProgressions: string[]; // References to progression IDs
    commonScales: string[]; // References to scale IDs
    tempoMin: number;
    tempoMax: number;
    typicalTempo?: {
        min: number;
        max: number;
    };
}

export interface MusicalIdea {
    genre?: string;
    mood?: string[];
    tempo?: number;
    scale?: string;
    progression?: string[];
    complexity?: number; // 1-10
    key?: string; // Key in format 'root_scaletype' (e.g., 'C_major')
}

export interface GeneratedMusic {
    midi: string; // Base64 encoded MIDI data
    notation?: string; // Musical notation (if applicable)
    metadata: {
        genre: string;
        mood: string[];
        tempo: number;
        key: string;
        timeSignature: string;
    };
}