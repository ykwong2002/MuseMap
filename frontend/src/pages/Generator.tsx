import { useState } from 'react';

const MOODS = ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Dark'];
const GENRES = ['Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop'];
const INSTRUMENTS = ['Piano', 'Guitar', 'Drums', 'Violin', 'Saxophone', 'Synth', 'Bass'];
const TEMPOS = ['Slow', 'Medium', 'Fast'];

const Generator = () => {
  const [mood, setMood] = useState('Happy');
  const [genre, setGenre] = useState('Pop');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [tempo, setTempo] = useState('Medium');
  const [duration, setDuration] = useState(8);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInstrumentChange = (instrument: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrument)
        ? prev.filter((i) => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAudioUrl(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('mood', mood);
      formData.append('genre', genre);
      formData.append('instruments', selectedInstruments.join(', '));
      formData.append('tempo', tempo);
      formData.append('duration', duration.toString());
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to generate music');
      const blob = await response.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generator-container">
      <h1>MuseMap: AI Music Generator</h1>
      <p className="generator-description">
        Create custom music by selecting your preferences below. Our AI will generate a unique track based on your choices.
      </p>
      
      <form className="music-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mood:</label>
          <select value={mood} onChange={e => setMood(e.target.value)}>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Genre:</label>
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Instruments:</label>
          <div className="instruments-list">
            {INSTRUMENTS.map(inst => (
              <label key={inst} className="instrument-checkbox">
                <input
                  type="checkbox"
                  checked={selectedInstruments.includes(inst)}
                  onChange={() => handleInstrumentChange(inst)}
                />
                {inst}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Tempo:</label>
          <select value={tempo} onChange={e => setTempo(e.target.value)}>
            {TEMPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Duration (seconds):</label>
          <input
            type="number"
            min={4}
            max={30}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
          />
        </div>
        <button type="submit" disabled={loading} className="generate-btn">
          {loading ? 'Generating...' : 'Generate Music'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {audioUrl && (
        <div className="audio-player">
          <h2>Your AI-Generated Music</h2>
          <audio controls src={audioUrl} />
          <button className="download-btn" onClick={() => window.open(audioUrl)}>
            Download Audio
          </button>
        </div>
      )}
      
      <div className="generator-tips">
        <h3>Tips for Great Results</h3>
        <ul>
          <li>Select multiple instruments for richer compositions</li>
          <li>Match your tempo to your mood for more cohesive results</li>
          <li>Longer durations allow for more musical development</li>
        </ul>
      </div>
    </div>
  );
};

export default Generator; 