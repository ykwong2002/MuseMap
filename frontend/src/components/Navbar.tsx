import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, logoutUser } from '../services/firebase';
import useWindowSize from '../hooks/useWindowSize';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLUListElement>(null);
  const menuIconRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useWindowSize();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Close menu when switching from mobile to desktop
    if (!isMobile && menuOpen) {
      setMenuOpen(false);
    }
  }, [isMobile, menuOpen]);

  useEffect(() => {
    // Add or remove body class to prevent scrolling when menu is open
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    // Handle clicks outside of menu to close it
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuIconRef.current &&
        !menuIconRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Layout of auth buttons differs between mobile and desktop
  const renderAuthButtons = () => {
    if (isLoggedIn) {
      return (
        <>
          <Link to="/profile" className="auth-button profile" onClick={closeMenu}>
            My Profile
          </Link>
          <button className="auth-button logout" onClick={handleLogout}>
            Logout
          </button>
        </>
      );
    } else {
      return (
        <>
          <Link to="/login" className="auth-button login" onClick={closeMenu}>
            Login
          </Link>
          <Link to="/signup" className="auth-button signup" onClick={closeMenu}>
            Sign Up
          </Link>
        </>
      );
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container navbar-flex">
        {/* Left: Logo */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            MuseMap
          </Link>
        </div>
        {/* Center: Nav Tabs */}
        <div className="navbar-center">
          <ul className="nav-menu desktop-nav">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={closeMenu}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link" onClick={closeMenu}>
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/discover" className="nav-link" onClick={closeMenu}>
                Discover
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/generator" className="nav-link" onClick={closeMenu}>
                Generator
              </Link>
            </li>
          </ul>
        </div>
        {/* Right: Auth Buttons */}
        <div className="navbar-right">
          <div className="auth-buttons desktop-auth">
            {renderAuthButtons()}
          </div>
          {/* Hamburger menu icon for mobile */}
          <div 
            ref={menuIconRef}
            className="menu-icon" 
            onClick={toggleMenu}
          >
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: menuOpen ? '0' : '1' }}></span>
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none' }}></span>
          </div>
        </div>
        {/* Mobile Drawer */}
        {menuOpen && <div className="menu-backdrop" onClick={closeMenu} />}
        <ul ref={menuRef} className={`nav-menu mobile-nav ${menuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link" onClick={closeMenu}>
              About
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/discover" className="nav-link" onClick={closeMenu}>
              Discover
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/generator" className="nav-link" onClick={closeMenu}>
              Generator
            </Link>
          </li>
          {isLoggedIn && (
            <li className="nav-item">
              <Link to="/profile" className="nav-link" onClick={closeMenu}>
                My Music
              </Link>
            </li>
          )}
          <div className="auth-buttons mobile-auth">
            {renderAuthButtons()}
          </div>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 