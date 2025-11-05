import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in on component mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!user);
    };

    // Check on mount
    checkAuthStatus();

    // Listen for storage changes (e.g., when user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);

    // Custom event listener for login/logout within same tab
    window.addEventListener('authChange', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', checkAuthStatus);
    };
  }, []);

  return(
    <>
      <header className="header">
        <div className="container">
          <nav className="flex gap-20">
            <span className="logo">SG</span>
            <Link to="/">Home</Link>
            {!isLoggedIn ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/registration">Registration</Link>
              </>
            ) : (
              <Link to="/logout">Logout</Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}