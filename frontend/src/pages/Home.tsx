import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>MuseMap: AI-Powered Music Generation</h1>
          <p>Unleash your creativity with our AI music generation tool. Create custom tracks based on your mood, genre, and instruments.</p>
          <div className="hero-buttons">
            <Link to="/generator" className="primary-button">
              Create Music Now
            </Link>
            <Link to="/discover" className="secondary-button">
              Explore Music
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>What Can MuseMap Do?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎵</div>
            <h3>AI Music Generation</h3>
            <p>Create custom music tracks with our state-of-the-art AI model tailored to your preferences.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎛️</div>
            <h3>Custom Parameters</h3>
            <p>Control mood, genre, instruments, tempo, and duration to craft the perfect sound.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Save & Share</h3>
            <p>Save your favorite generations and share them with friends and collaborators.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Discover</h3>
            <p>Explore a library of AI-generated music created by our community of users.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Choose Your Parameters</h3>
            <p>Select mood, genre, instruments, and other settings.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Generate</h3>
            <p>Our AI creates your custom music in seconds.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Listen & Download</h3>
            <p>Enjoy your creation and download the audio file.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Create?</h2>
        <p>Join MuseMap today and start creating AI-generated music that matches your vision.</p>
        <div className="cta-buttons">
          <Link to="/signup" className="primary-button">
            Sign Up Free
          </Link>
          <Link to="/login" className="secondary-button">
            Login
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 