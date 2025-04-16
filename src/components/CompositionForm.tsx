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

// Define interface for key objects returned from the API
interface KeyOption {
    id: string;
    name: string;
    rootPitch: number;
    scaleType: string;
    notes: string[];
    mood: string[];
}

export const CompositionForm: React.FC<CompositionFormProps> = ({ onSubmit }) => {
    const [loading, setLoading] = useState(true);
    const [genres, setGenres] = useState<string[]>([]);
    const [moods, setMoods] = useState<string[]>([]);
    const [keys, setKeys] = useState<KeyOption[]>([]);
    const [filteredKeys, setFilteredKeys] = useState<KeyOption[]>([]);
    const [genre, setGenre] = useState<string>('');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState<string>('');
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
                
                // Fetch all available keys
                const keysResult = await session.run(
                    'MATCH (k:Key) RETURN k ORDER BY k.rootPitch, k.scaleType'
                );
                const keyOptions = keysResult.records.map(record => record.get('k').properties);
                setKeys(keyOptions);
                setFilteredKeys(keyOptions);

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

    // Filter keys based on genre and mood selections
    useEffect(() => {
        const filterKeys = async () => {
            try {
                if (!genre && selectedMoods.length === 0) {
                    // No filters applied, show all keys
                    setFilteredKeys(keys);
                    return;
                }

                // Start with all keys
                let filtered = [...keys];

                // Filter by genre if selected
                if (genre) {
                    const genreKeysResponse = await fetch(`/api/keys-by-genre?genre=${encodeURIComponent(genre.toLowerCase())}`);
                    if (genreKeysResponse.ok) {
                        const genreKeys = await genreKeysResponse.json();
                        const genreKeyIds = genreKeys.map((k: KeyOption) => k.id);
                        filtered = filtered.filter(k => genreKeyIds.includes(k.id));
                    }
                }

                // Filter by mood if any selected
                if (selectedMoods.length > 0) {
                    const moodKeysResponse = await fetch(
                        `/api/keys-by-mood?${selectedMoods.map(m => `mood=${encodeURIComponent(m)}`).join('&')}`
                    );
                    if (moodKeysResponse.ok) {
                        const moodKeys = await moodKeysResponse.json();
                        const moodKeyIds = moodKeys.map((k: KeyOption) => k.id);
                        filtered = filtered.filter(k => moodKeyIds.includes(k.id));
                    }
                }

                setFilteredKeys(filtered);
                
                // If the previously selected key is no longer in the filtered set, clear it
                if (selectedKey && !filtered.some(k => k.id === selectedKey)) {
                    setSelectedKey('');
                }
            } catch (error) {
                console.error('Error filtering keys:', error);
            }
        };

        filterKeys();
    }, [genre, selectedMoods, keys]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            genre,
            mood: selectedMoods,
            tempo,
            complexity,
            key: selectedKey
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

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Key</InputLabel>
                <Select
                    value={selectedKey}
                    label="Key"
                    onChange={(e) => setSelectedKey(e.target.value)}
                >
                    <MenuItem value="">
                        <em>Let the algorithm choose</em>
                    </MenuItem>
                    {filteredKeys.map(key => (
                        <MenuItem key={key.id} value={key.id}>
                            {key.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

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