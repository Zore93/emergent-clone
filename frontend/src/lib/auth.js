import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const apiClient = axios.create({ baseURL: API });
apiClient.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ec_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('ec_token');
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const r = await apiClient.get('/auth/me');
      setUser(r.data);
    } catch {
      localStorage.removeItem('ec_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const r = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('ec_token', r.data.access_token);
    setUser(r.data.user);
    return r.data.user;
  };
  const signup = async (email, password, name) => {
    const r = await apiClient.post('/auth/signup', { email, password, name });
    localStorage.setItem('ec_token', r.data.access_token);
    setUser(r.data.user);
    return r.data.user;
  };
  const logout = () => { localStorage.removeItem('ec_token'); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, refresh, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
