import React, { useState } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { CompositionForm } from '../components/CompositionForm';
import { MIDIPlayer } from '../components/MIDIPlayer';
import { MainLayout } from '../components/MainLayout';
import { openAiService } from '../services/openAiService';
import { MusicalIdea, GeneratedMusic } from '../types/music';
import { motion } from 'framer-motion';

export const CompositionPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic | null>(null);
    const { enqueueSnackbar } = useSnackbar();

    const handleGenerateMusic = async (idea: MusicalIdea) => {
        setLoading(true);
        try {
            const result = await openAiService.generateMusic(idea);
            setGeneratedMusic(result);
            enqueueSnackbar('Music generated successfully!', { variant: 'success' });
        } catch (error) {
            console.error('Error generating music:', error);
            enqueueSnackbar(
                error instanceof Error ? error.message : 'Failed to generate music',
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout loading={loading}>
            <Box
                component={motion.div}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Typography variant="h2" component="h1" gutterBottom align="center">
                    MuseMap Composer
                </Typography>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom 
                    align="center" 
                    color="text.secondary"
                    sx={{ mb: 4 }}
                >
                    Create music using AI and music theory
                </Typography>

                <Paper 
                    elevation={3} 
                    sx={{ 
                        mt: 4, 
                        p: 3,
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    <CompositionForm onSubmit={handleGenerateMusic} />
                </Paper>

                {generatedMusic && !loading && (
                    <Paper 
                        component={motion.div}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        elevation={3} 
                        sx={{ 
                            mt: 4, 
                            p: 3,
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
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
        </MainLayout>
    );
};