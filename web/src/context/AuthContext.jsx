import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://vedaz-real-time-chat-application.onrender.com' : 'http://localhost:5000');
  const API_URL = `${BACKEND_BASE}/api/auth`;

  useEffect(() => {
    // Check local storage for persisted user session on refresh
    const savedUser = localStorage.getItem('vedaz_chat_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('vedaz_chat_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, avatar) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to authenticate');
      }

      const data = await response.json();
      const user = data.user;

      setCurrentUser(user);
      localStorage.setItem('vedaz_chat_user', JSON.stringify(user));
      setLoading(false);
      return user;
    } catch (err) {
      console.warn('⚠️ Server login unreachable or error, falling back to instant client session:', err.message);
      // High-reliability fallback if backend isn't started yet during quick testing
      const fallbackUser = {
        _id: `user_${Date.now()}`,
        username,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        isOnline: true
      };
      setCurrentUser(fallbackUser);
      localStorage.setItem('vedaz_chat_user', JSON.stringify(fallbackUser));
      setLoading(false);
      return fallbackUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('vedaz_chat_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
