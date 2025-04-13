import React, { useState, useCallback } from 'react';
import { Box, IconButton, Slider, Typography, FormControl, InputLabel, Select, MenuItem, Stack, Switch, FormControlLabel, FormGroup, SelectChangeEvent } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import LoopIcon from '@mui/icons-material/Loop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { formatDuration } from '../utils/midiUtils';
import { useSynth } from '../hooks/useSynth';
import { EffectType, SynthType } from '../hooks/useSynth';

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
    const [loop, setLoop] = useState(false);
    const [quantizeValue, setQuantizeValue] = useState<QuantizeValue>(0.25);
    const [swing, setSwing] = useState(false);

    const { synth, settings, updateSettings } = useSynth({
        type: 'basic',
        effects: [],
        volume: 0
    });

    const handleSynthTypeChange = (event: SelectChangeEvent<SynthType>) => {
        updateSettings({ type: event.target.value as SynthType });
    };

    const handleEffectToggle = (effect: EffectType) => {
        updateSettings({
            effects: settings.effects.includes(effect)
                ? settings.effects.filter(e => e !== effect)
                : [...settings.effects, effect]
        });
    };

    const handleVolumeChange = (_: Event, value: number | number[]) => {
        updateSettings({ volume: value as number });
    };

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

            Tone.Transport.bpm.value = tempo;
            Tone.Transport.cancel();

            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    const time = Tone.Time(note.time).toSeconds();
                    Tone.Transport.schedule(time => {
                        synth.triggerAttackRelease(
                            note.name,
                            note.duration,
                            time,
                            note.velocity
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

    const handleQuantizeChange = (event: SelectChangeEvent<QuantizeValue>) => {
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
                        {formatDuration(progress)} / {formatDuration(duration)}
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Synth Type</InputLabel>
                        <Select
                            value={settings.type}
                            label="Synth Type"
                            onChange={handleSynthTypeChange}
                        >
                            <MenuItem value="basic">Basic</MenuItem>
                            <MenuItem value="fm">FM</MenuItem>
                            <MenuItem value="am">AM</MenuItem>
                            <MenuItem value="mono">Mono</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VolumeUpIcon />
                        <Slider
                            value={settings.volume}
                            min={-60}
                            max={0}
                            onChange={handleVolumeChange}
                            aria-label="Volume"
                            sx={{ width: 100 }}
                        />
                    </Box>
                </Box>

                <FormGroup row>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.effects.includes('reverb')}
                                onChange={() => handleEffectToggle('reverb')}
                            />
                        }
                        label="Reverb"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.effects.includes('delay')}
                                onChange={() => handleEffectToggle('delay')}
                            />
                        }
                        label="Delay"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.effects.includes('distortion')}
                                onChange={() => handleEffectToggle('distortion')}
                            />
                        }
                        label="Distortion"
                    />
                </FormGroup>
            </Stack>
        </Box>
    );
};