import { useState } from 'react';

// Mock data for discover page
const MOCK_TRACKS = [
  {
    id: 1,
    title: 'Summer Vibes',
    creator: 'MuseMap User',
    mood: 'Happy',
    genre: 'Pop',
    instruments: 'Piano, Guitar, Drums',
    likes: 324,
    plays: 1250,
    audioUrl: '#',
  },
  {
    id: 2,
    title: 'Midnight Jazz',
    creator: 'JazzMaster',
    mood: 'Calm',
    genre: 'Jazz',
    instruments: 'Saxophone, Piano, Bass',
    likes: 187,
    plays: 860,
    audioUrl: '#',
  },
  {
    id: 3,
    title: 'Electronic Dreams',
    creator: 'TechBeats',
    mood: 'Energetic',
    genre: 'Electronic',
    instruments: 'Synth, Drums',
    likes: 452,
    plays: 1890,
    audioUrl: '#',
  },
  {
    id: 4,
    title: 'Melancholy Rain',
    creator: 'SadSongs',
    mood: 'Sad',
    genre: 'Classical',
    instruments: 'Piano, Violin',
    likes: 215,
    plays: 920,
    audioUrl: '#',
  },
  {
    id: 5,
    title: 'Rock Anthem',
    creator: 'RockStar',
    mood: 'Energetic',
    genre: 'Rock',
    instruments: 'Guitar, Drums, Bass',
    likes: 378,
    plays: 1620,
    audioUrl: '#',
  },
  {
    id: 6,
    title: 'Hip-Hop Beats',
    creator: 'BeatMaker',
    mood: 'Energetic',
    genre: 'Hip-Hop',
    instruments: 'Drums, Synth',
    likes: 502,
    plays: 2150,
    audioUrl: '#',
  },
];

const Discover = () => {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Filter tracks based on search input
  const filteredTracks = MOCK_TRACKS.filter(
    (track) =>
      track.title.toLowerCase().includes(filter.toLowerCase()) ||
      track.mood.toLowerCase().includes(filter.toLowerCase()) ||
      track.genre.toLowerCase().includes(filter.toLowerCase()) ||
      track.instruments.toLowerCase().includes(filter.toLowerCase())
  );

  // Sort tracks based on selected option
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'popular') return b.likes - a.likes;
    if (sortBy === 'recent') return b.id - a.id;
    if (sortBy === 'plays') return b.plays - a.plays;
    return 0;
  });

  return (
    <div className="discover-container">
      <section className="discover-header">
        <h1>Discover Music</h1>
        <p>Explore AI-generated music created by the MuseMap community</p>
      </section>

      <section className="discover-tools">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by title, mood, genre, or instruments..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="sort-options">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="plays">Most Played</option>
          </select>
        </div>
      </section>

      <section className="tracks-grid">
        {sortedTracks.length > 0 ? (
          sortedTracks.map((track) => (
            <div key={track.id} className="track-card">
              <div className="track-info">
                <h3>{track.title}</h3>
                <p className="track-creator">by {track.creator}</p>
                <div className="track-details">
                  <span className="track-mood">{track.mood}</span>
                  <span className="track-genre">{track.genre}</span>
                </div>
                <p className="track-instruments">{track.instruments}</p>
              </div>
              <div className="track-controls">
                <audio controls src={track.audioUrl}>
                  Your browser does not support the audio element.
                </audio>
                <div className="track-stats">
                  <span>{track.likes} likes</span>
                  <span>{track.plays} plays</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No tracks found matching your search criteria.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Discover; 