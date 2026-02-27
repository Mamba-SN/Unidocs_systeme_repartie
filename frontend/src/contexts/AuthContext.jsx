import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      authAPI
        .me()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, mot_de_passe) => {
    const res = await authAPI.login({ email, mot_de_passe });
    const { token, utilisateur } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(utilisateur));
    setUser(utilisateur);
    return utilisateur;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { token, utilisateur } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(utilisateur));
    setUser(utilisateur);
    return utilisateur;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
