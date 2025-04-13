import React, { useState, useEffect } from 'react';
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
    CircularProgress,
} from '@mui/material';
import { MusicalIdea } from '../types/music';
import { neo4jService } from '../services/neo4jService';

interface CompositionFormProps {
    onSubmit: (idea: MusicalIdea) => void;
}

export const CompositionForm: React.FC<CompositionFormProps> = ({ onSubmit }) => {
    const [loading, setLoading] = useState(true);
    const [genres, setGenres] = useState<string[]>([]);
    const [moods, setMoods] = useState<string[]>([]);
    const [genre, setGenre] = useState<string>('');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [tempo, setTempo] = useState<number>(120);
    const [complexity, setComplexity] = useState<number>(5);
    const [tempoRange, setTempoRange] = useState<{ min: number; max: number }>({ min: 40, max: 200 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const session = await neo4jService.getSession();
                
                // Fetch unique genres
                const genresResult = await session.run(
                    'MATCH (g:Genre) RETURN DISTINCT g.name as name'
                );
                setGenres(genresResult.records.map(record => record.get('name')));

                // Fetch unique moods from scales
                const moodsResult = await session.run(
                    'MATCH (s:Scale) UNWIND s.mood as mood RETURN DISTINCT mood'
                );
                setMoods(moodsResult.records.map(record => record.get('mood')));

                await session.close();
            } catch (error) {
                console.error('Error fetching form data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const updateTempoRange = async () => {
            if (genre) {
                const genreData = await neo4jService.getGenreCharacteristics(genre);
                if (genreData?.typicalTempo) {
                    const min = Number(genreData.typicalTempo.min);
                    const max = Number(genreData.typicalTempo.max);
                    setTempoRange({ min, max });
                    setTempo(Math.floor((min + max) / 2));
                }
            }
        };

        updateTempoRange();
    }, [genre]);

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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Genre</InputLabel>
                <Select
                    value={genre}
                    label="Genre"
                    onChange={(e) => setGenre(e.target.value)}
                >
                    {genres.map(g => (
                        <MenuItem key={g} value={g}>{g}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Mood</Typography>
                <Paper sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {moods.map(mood => (
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
                    min={tempoRange.min}
                    max={tempoRange.max}
                    marks={[
                        { value: tempoRange.min, label: tempoRange.min.toString() },
                        { value: tempoRange.max, label: tempoRange.max.toString() },
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