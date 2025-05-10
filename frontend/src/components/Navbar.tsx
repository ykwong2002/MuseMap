import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, logoutUser } from '../services/firebase';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          MuseMap
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link">
              About
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/discover" className="nav-link">
              Discover
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/generator" className="nav-link">
              Generator
            </Link>
          </li>
        </ul>
        <div className="auth-buttons">
          {isLoggedIn ? (
            <button className="auth-button logout" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="auth-button login">
                Login
              </Link>
              <Link to="/signup" className="auth-button signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 