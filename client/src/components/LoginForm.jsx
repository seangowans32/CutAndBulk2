import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useNavigate } from 'react-router-dom';
import { AuthAPI } from '../api.js';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // AOS Animations
  useEffect(() => {
    AOS.init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await AuthAPI.login({
        email,
        password
      });
      
      // Save user data to localStorage for quick access
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        // Dispatch custom event to update Header
        window.dispatchEvent(new Event('authChange'));
      }
      
      setMessage('Login successful! Redirecting...');
      
      // Redirect to home page after successful login
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      setMessage(error.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="App-body login-form">
        <div className='container container-2' data-aos="zoom-in-up">
          <div className="form-container">
            <h2>Login Form</h2>

            {message && (
              <p className={`info-box ${message.includes('successful') ? '' : 'error'}`}>
                {message}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Email' 
                  required 
                />
              </div>

              <div className='form-group'>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Password' 
                  required 
                />
              </div>

              <button className='frontend-button' type='submit' disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;