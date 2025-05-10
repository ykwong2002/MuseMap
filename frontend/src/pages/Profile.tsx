import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, getUserMusic, updateUserMusic } from '../services/firebase';
import type { MusicData } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';

const Profile = () => {
  const [userMusic, setUserMusic] = useState<MusicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, fetch their music
        try {
          const music = await getUserMusic(user.uid);
          setUserMusic(music);
        } catch (err) {
          setError('Failed to load your music collection');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        // User is signed out, redirect to login
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEdit = (music: MusicData) => {
    setEditingId(music.id || null);
    setEditName(music.name);
    setEditDescription(music.description);
  };

  const handleSaveEdit = async (musicId: string) => {
    if (!musicId) return;
    
    try {
      await updateUserMusic(musicId, {
        name: editName,
        description: editDescription
      });
      
      // Update local state
      setUserMusic(prev => prev.map(item => 
        item.id === musicId 
          ? { ...item, name: editName, description: editDescription } 
          : item
      ));
      
      setEditingId(null);
    } catch (err) {
      setError('Failed to update music');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (loading) {
    return <div className="loading">Loading your music collection...</div>;
  }

  return (
    <div className="profile-container">
      <h1>My Music Collection</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {userMusic.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any music yet.</p>
          <p>Head over to the <a href="/generator">Generator</a> to create your first piece!</p>
        </div>
      ) : (
        <div className="music-collection">
          {userMusic.map((music) => (
            <div key={music.id} className="music-card">
              {editingId === music.id ? (
                <div className="edit-music-form">
                  <div className="form-group">
                    <label>Name:</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea 
                      value={editDescription} 
                      onChange={(e) => setEditDescription(e.target.value)} 
                    />
                  </div>
                  <div className="edit-actions">
                    <button onClick={() => handleSaveEdit(music.id || '')}>Save</button>
                    <button onClick={handleCancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="music-info">
                    <h3>{music.name}</h3>
                    <p className="music-description">{music.description}</p>
                    <div className="music-details">
                      <span className="music-mood">{music.mood}</span>
                      <span className="music-genre">{music.genre}</span>
                      <span className="music-tempo">{music.tempo}</span>
                    </div>
                    <p className="music-instruments">{music.instruments}</p>
                    <p className="music-date">Created: {music.created instanceof Date 
                      ? music.created.toLocaleDateString() 
                      : new Date((music.created as Timestamp).seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="music-controls">
                    <audio controls src={music.audioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                    <div className="music-actions">
                      <button 
                        className="edit-btn" 
                        onClick={() => handleEdit(music)}
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile; 