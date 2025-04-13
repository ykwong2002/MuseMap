import React, { useState } from 'react';
import { Container, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { CompositionForm } from '../components/CompositionForm';
import { MIDIPlayer } from '../components/MIDIPlayer';
import { openAiService } from '../services/openAiService';
import { MusicalIdea, GeneratedMusic } from '../types/music';
import * as Tone from 'tone';

export const CompositionPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic | null>(null);

    const handleGenerateMusic = async (idea: MusicalIdea) => {
        setLoading(true);
        try {
            const result = await openAiService.generateMusic(idea);
            setGeneratedMusic(result);
            
            // Initialize Tone.js
            await Tone.start();
            const synth = new Tone.PolySynth().toDestination();
            
            // Convert MIDI data to playable notes
            // This is a placeholder - you'll need to implement actual MIDI parsing
            const notes = ['C4', 'E4', 'G4'];
            const now = Tone.now();
            notes.forEach((note, i) => {
                synth.triggerAttackRelease(note, "8n", now + i * 0.5);
            });
        } catch (error) {
            console.error('Error generating music:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h2" component="h1" gutterBottom align="center">
                    MuseMap Composer
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
                    Create music using AI and music theory
                </Typography>

                <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
                    <CompositionForm onSubmit={handleGenerateMusic} />
                </Paper>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {generatedMusic && !loading && (
                    <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Generated Music
                        </Typography>
                        <Box>
                            <Typography>
                                Genre: {generatedMusic.metadata.genre}
                            </Typography>
                            <Typography>
                                Mood: {generatedMusic.metadata.mood.join(', ')}
                            </Typography>
                            <Typography>
                                Key: {generatedMusic.metadata.key}
                            </Typography>
                            <Typography>
                                Time Signature: {generatedMusic.metadata.timeSignature}
                            </Typography>
                            <Typography>
                                Tempo: {generatedMusic.metadata.tempo} BPM
                            </Typography>
                            <MIDIPlayer 
                                midiData={generatedMusic.midi}
                                tempo={generatedMusic.metadata.tempo}
                            />
                        </Box>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};