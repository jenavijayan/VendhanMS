

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { APP_NAME, THEME } from '../constants';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app'); // Navigate to the main app dashboard area
    }
  }, [isAuthenticated, navigate]);
  
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!username || !password) {
        return; 
    }
    await login({ username, password });
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-${THEME.accent} via-white to-${THEME.accent} p-6`}>
      <div className={`w-full max-w-md bg-white p-8 rounded-xl shadow-2xl relative z-10`}> {/* Ensure content is above potential pseudo-elements from welcome page */}
        <div className="text-center mb-2">
          <Link to="/welcome" className={`text-sm text-${THEME.secondary} hover:text-opacity-80`}>
            &larr; Back to Welcome
          </Link>
        </div>
        <h1 className={`text-4xl font-bold text-center text-${THEME.primary} mb-2`}>{APP_NAME}</h1>
        <h2 className={`text-2xl font-semibold text-center text-${THEME.secondary} mb-8`}>Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className={`block text-sm font-medium text-${THEME.accentText}`}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError(); }}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`}
              placeholder="admin or employee1"
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium text-${THEME.accentText}`}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`}
              placeholder="admin123 or emp123"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p>{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition duration-150 ease-in-out`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign in'}
            </button>
          </div>
        </form>
         {/* Public registration link removed */}
      </div>
       <footer className="mt-8 text-center text-sm text-gray-500 z-10">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <p className="text-xs mt-1">Mock API. For demonstration purposes only.</p>
      </footer>
    </div>
  );
};

export default Login;