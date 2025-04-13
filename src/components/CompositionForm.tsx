import React, { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Typography,
    Chip,
    Paper,
} from '@mui/material';
import { MusicalIdea } from '../types/music';

interface CompositionFormProps {
    onSubmit: (idea: MusicalIdea) => void;
}

const GENRES = [
    'Classical', 'Jazz', 'Rock', 'Pop', 'Electronic', 'Folk', 'Hip Hop', 'Blues'
];

const MOODS = [
    'Happy', 'Sad', 'Energetic', 'Calm', 'Mysterious', 'Epic', 'Romantic', 'Dark'
];

export const CompositionForm: React.FC<CompositionFormProps> = ({ onSubmit }) => {
    const [genre, setGenre] = useState<string>('');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [tempo, setTempo] = useState<number>(120);
    const [complexity, setComplexity] = useState<number>(5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            genre,
            mood: selectedMoods,
            tempo,
            complexity
        });
    };

    const handleMoodToggle = (mood: string) => {
        setSelectedMoods(prev => 
            prev.includes(mood)
                ? prev.filter(m => m !== mood)
                : [...prev, mood]
        );
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Genre</InputLabel>
                <Select
                    value={genre}
                    label="Genre"
                    onChange={(e) => setGenre(e.target.value)}
                >
                    {GENRES.map(g => (
                        <MenuItem key={g} value={g}>{g}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Mood</Typography>
                <Paper sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {MOODS.map(mood => (
                        <Chip
                            key={mood}
                            label={mood}
                            onClick={() => handleMoodToggle(mood)}
                            color={selectedMoods.includes(mood) ? "primary" : "default"}
                            sx={{ m: 0.5 }}
                        />
                    ))}
                </Paper>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Tempo (BPM)</Typography>
                <Slider
                    value={tempo}
                    onChange={(_, value) => setTempo(value as number)}
                    valueLabelDisplay="auto"
                    min={40}
                    max={200}
                    marks={[
                        { value: 40, label: '40' },
                        { value: 120, label: '120' },
                        { value: 200, label: '200' },
                    ]}
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Complexity</Typography>
                <Slider
                    value={complexity}
                    onChange={(_, value) => setComplexity(value as number)}
                    valueLabelDisplay="auto"
                    min={1}
                    max={10}
                    marks={[
                        { value: 1, label: 'Simple' },
                        { value: 5, label: 'Moderate' },
                        { value: 10, label: 'Complex' },
                    ]}
                />
            </Box>

            <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={!genre || selectedMoods.length === 0}
            >
                Generate Music
            </Button>
        </Box>
    );
};