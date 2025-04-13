import React, { useEffect, useState } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

interface MIDIPlayerProps {
    midiData: string; // Base64 encoded MIDI data
    tempo: number;
}

export const MIDIPlayer: React.FC<MIDIPlayerProps> = ({ midiData, tempo }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [synth, setSynth] = useState<Tone.PolySynth | null>(null);

    useEffect(() => {
        // Initialize Tone.js synth
        const newSynth = new Tone.PolySynth().toDestination();
        setSynth(newSynth);

        return () => {
            newSynth.dispose();
        };
    }, []); // Empty dependency array is fine here as we only want to initialize once

    const playMIDI = async () => {
        if (!synth) return;

        try {
            // Decode base64 MIDI data
            const midiArrayBuffer = Uint8Array.from(atob(midiData), c => c.charCodeAt(0)).buffer;
            const midi = new Midi(midiArrayBuffer);

            // Set tempo
            Tone.Transport.bpm.value = tempo;

            // Schedule notes
            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    synth.triggerAttackRelease(
                        note.name,
                        note.duration,
                        note.time + Tone.now(),
                        note.velocity
                    );
                });
            });

            setDuration(midi.duration);
            setIsPlaying(true);
            await Tone.start();
            Tone.Transport.start();

            // Update progress
            const interval = setInterval(() => {
                setProgress(Tone.Transport.seconds);
                if (Tone.Transport.seconds >= midi.duration) {
                    stopPlayback();
                    clearInterval(interval);
                }
            }, 100);

        } catch (error) {
            console.error('Error playing MIDI:', error);
        }
    };

    const pausePlayback = () => {
        Tone.Transport.pause();
        setIsPlaying(false);
    };

    const stopPlayback = () => {
        Tone.Transport.stop();
        setIsPlaying(false);
        setProgress(0);
    };

    const handleProgressChange = (_: Event, newValue: number | number[]) => {
        const time = newValue as number;
        Tone.Transport.seconds = time;
        setProgress(time);
    };

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={isPlaying ? pausePlayback : playMIDI}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={stopPlayback}>
                    <StopIcon />
                </IconButton>
                <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Slider
                        value={progress}
                        max={duration}
                        onChange={handleProgressChange}
                        aria-labelledby="playback-progress"
                    />
                </Box>
                <Typography sx={{ ml: 2, minWidth: 60 }}>
                    {Math.floor(progress)}s / {Math.floor(duration)}s
                </Typography>
            </Box>
        </Box>
    );
};