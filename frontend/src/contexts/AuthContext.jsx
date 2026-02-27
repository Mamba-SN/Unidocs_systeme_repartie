import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';
import { AuthContext } from './AuthContextContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // CORRECTION : On détermine si on charge dès le départ
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    // On ne charge que si on a un token mais pas encore les données utilisateur
    return !!(token && !localStorage.getItem('user'));
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Si on a un token et pas d'utilisateur, on lance l'appel API
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
    }
    // Note : Le bloc "else { setLoading(false); }" a été supprimé ici
    // car l'état loading est déjà correct par défaut grâce à l'initialisation ci-dessus.
  }, [user]); 

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