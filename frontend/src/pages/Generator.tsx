import { useState, useEffect } from 'react';
import { auth, saveUserMusic, getCurrentUser } from '../services/firebase';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [musicName, setMusicName] = useState('');
  const [savingToAccount, setSavingToAccount] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

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
    setSavedSuccess(false);
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
      
      // Generate a default name based on mood and genre
      setMusicName(`${mood} ${genre}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToAccount = async () => {
    if (!isLoggedIn || !audioUrl) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setError('You must be logged in to save music');
      return;
    }
    
    setSavingToAccount(true);
    try {
      // Create a description based on the parameters
      const description = `A ${mood.toLowerCase()} ${genre.toLowerCase()} track with ${selectedInstruments.join(', ')} at ${tempo.toLowerCase()} tempo`;
      
      // Save the music data to Firestore
      await saveUserMusic({
        userId: currentUser.uid,
        name: musicName,
        description,
        mood,
        genre,
        instruments: selectedInstruments.join(', '),
        tempo,
        duration,
        audioUrl
      });
      
      setSavedSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save music';
      setError(errorMessage);
    } finally {
      setSavingToAccount(false);
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
          
          {isLoggedIn && (
            <div className="save-music-section">
              <div className="form-group">
                <label>Name your music:</label>
                <input 
                  type="text" 
                  value={musicName} 
                  onChange={e => setMusicName(e.target.value)} 
                  placeholder="Give your music a name"
                />
              </div>
              <button 
                className="save-btn" 
                onClick={handleSaveToAccount} 
                disabled={savingToAccount || !musicName.trim() || savedSuccess}
              >
                {savingToAccount ? 'Saving...' : savedSuccess ? 'Saved to Account' : 'Save to My Account'}
              </button>
              {savedSuccess && <p className="success-message">Music saved successfully! Visit your profile to access it.</p>}
            </div>
          )}
          
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
          {!isLoggedIn && <li>Sign in to save your music to your account for easy access later</li>}
        </ul>
      </div>
    </div>
  );
};

export default Generator; 