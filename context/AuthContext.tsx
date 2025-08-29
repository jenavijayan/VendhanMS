
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { apiLogin, apiRegister, apiLogout, ParsedLoginCredentials, ParsedRegisterData, apiFetchCurrentUser } from '../services/api'; 

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: ParsedLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: ParsedRegisterData) => Promise<void>; 
  updateUserInContext: (updatedUser: User) => void; 
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Validate token with the backend and fetch fresh user data.
          const freshUser = await apiFetchCurrentUser();
          setUser(freshUser);
          setIsAuthenticated(true);
          // Also update the stored user object to keep it fresh for next quick load
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (e) {
          // Token is invalid or expired
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    attemptAutoLogin();
  }, []);

  const login = async (credentials: ParsedLoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: loggedInUser, token } = await apiLogin(credentials); 
      setUser(loggedInUser);
      setIsAuthenticated(true);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: ParsedRegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiRegister(userData);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      throw err; 
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiLogout(); 
    } catch (err: any) {
      console.error("Logout API call error (if any):", err.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setIsLoading(false);
    }
  };

  const updateUserInContext = (updatedUser: User) => {
    setUser(prevUser => {
      const newUserState = prevUser ? { ...prevUser, ...updatedUser } : updatedUser;
      localStorage.setItem('user', JSON.stringify(newUserState)); // Update stored user object
      return newUserState;
    });
  };
  
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, register, error, clearError, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
};
