import React, { useEffect, useState, useCallback } from 'react';
import { Box, IconButton, Slider, Typography, FormControl, InputLabel, Select, MenuItem, Stack, Switch, FormControlLabel } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import LoopIcon from '@mui/icons-material/Loop';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { formatDuration } from '../utils/midiUtils';

interface MIDIPlayerProps {
    midiData: string;
    tempo: number;
    onQuantizeChange?: (value: number) => void;
}

type QuantizeValue = 1 | 0.5 | 0.25 | 0.125;

export const MIDIPlayer: React.FC<MIDIPlayerProps> = ({ midiData, tempo, onQuantizeChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
    const [loop, setLoop] = useState(false);
    const [quantizeValue, setQuantizeValue] = useState<QuantizeValue>(0.25);
    const [swing, setSwing] = useState(false);

    useEffect(() => {
        const newSynth = new Tone.PolySynth(Tone.Synth, {
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }
        }).toDestination();

        setSynth(newSynth);

        return () => {
            newSynth.dispose();
        };
    }, []);

    const resetPlayback = useCallback(() => {
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        setProgress(0);
    }, []);

    const playMIDI = async () => {
        if (!synth) return;

        try {
            const midiArrayBuffer = Uint8Array.from(atob(midiData), c => c.charCodeAt(0)).buffer;
            const midi = new Midi(midiArrayBuffer);

            // Set tempo
            Tone.Transport.bpm.value = tempo;

            // Clear any existing events
            Tone.Transport.cancel();

            // Schedule notes with quantization
            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    const time = Tone.Time(note.time).toSeconds();
                    const duration = note.duration;
                    const velocity = note.velocity;

                    Tone.Transport.schedule(time => {
                        synth.triggerAttackRelease(
                            note.name,
                            duration,
                            time,
                            velocity
                        );
                    }, time);
                });
            });

            setDuration(midi.duration);
            setIsPlaying(true);
            
            if (loop) {
                Tone.Transport.loop = true;
                Tone.Transport.loopEnd = midi.duration;
            }

            await Tone.start();
            Tone.Transport.start();

            // Update progress
            const intervalId = setInterval(() => {
                setProgress(Tone.Transport.seconds);
                if (Tone.Transport.seconds >= midi.duration && !loop) {
                    stopPlayback();
                    clearInterval(intervalId);
                }
            }, 100);

            return () => clearInterval(intervalId);
        } catch (error) {
            console.error('Error playing MIDI:', error);
        }
    };

    const pausePlayback = () => {
        Tone.Transport.pause();
        setIsPlaying(false);
    };

    const stopPlayback = () => {
        resetPlayback();
        setIsPlaying(false);
    };

    const handleProgressChange = (_: Event, newValue: number | number[]) => {
        const time = newValue as number;
        Tone.Transport.seconds = time;
        setProgress(time);
    };

    const handleQuantizeChange = (event: any) => {
        const value = event.target.value as QuantizeValue;
        setQuantizeValue(value);
        onQuantizeChange?.(value);
    };

    const toggleLoop = () => {
        setLoop(!loop);
        Tone.Transport.loop = !loop;
        if (!loop) {
            Tone.Transport.loopEnd = duration;
        }
    };

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={isPlaying ? pausePlayback : playMIDI}>
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <IconButton onClick={stopPlayback}>
                        <StopIcon />
                    </IconButton>
                    <IconButton 
                        onClick={toggleLoop}
                        color={loop ? "primary" : "default"}
                    >
                        <LoopIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1, mx: 2 }}>
                        <Slider
                            value={progress}
                            max={duration}
                            onChange={handleProgressChange}
                            aria-labelledby="playback-progress"
                        />
                    </Box>
                    <Typography sx={{ minWidth: 100 }}>
                        {formatDuration(progress, tempo)} / {formatDuration(duration, tempo)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Quantize</InputLabel>
                        <Select
                            value={quantizeValue}
                            label="Quantize"
                            onChange={handleQuantizeChange}
                        >
                            <MenuItem value={1}>Whole Note</MenuItem>
                            <MenuItem value={0.5}>Half Note</MenuItem>
                            <MenuItem value={0.25}>Quarter Note</MenuItem>
                            <MenuItem value={0.125}>Eighth Note</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={swing}
                                onChange={(e) => setSwing(e.target.checked)}
                            />
                        }
                        label="Swing"
                    />
                </Box>
            </Stack>
        </Box>
    );
};