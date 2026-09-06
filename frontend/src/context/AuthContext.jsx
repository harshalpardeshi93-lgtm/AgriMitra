import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('agrimitra_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('agrimitra_token') || null;
  });

  const [loading, setLoading] = useState(false);



  const login = async (phone, password) => {
    setLoading(true);
    try {
      const data = await loginApi(phone, password);
      localStorage.setItem('agrimitra_user', JSON.stringify(data.user));
      localStorage.setItem('agrimitra_token', data.token);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await registerApi(userData);
      localStorage.setItem('agrimitra_user', JSON.stringify(data.user));
      localStorage.setItem('agrimitra_token', data.token);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agrimitra_user');
    localStorage.removeItem('agrimitra_token');
  };

  useEffect(() => {
    const handleAuthError = (e) => {
      if (e.detail === 401) {
        logout();
      }
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
