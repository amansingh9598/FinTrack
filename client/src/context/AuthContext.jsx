import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('fintrack_token'));

  useEffect(() => {
    if (!localStorage.getItem('fintrack_token')) return;
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('fintrack_token'))
      .finally(() => setLoading(false));
  }, []);

  const handle = (res) => {
    localStorage.setItem('fintrack_token', res.data.token);
    setUser(res.data.user);
  };

  const login = async (email, password) => handle(await api.post('/auth/login', { email, password }));
  const register = async (name, email, password) => handle(await api.post('/auth/register', { name, email, password }));
  const demo = async () => handle(await api.post('/auth/demo'));
  const logout = () => {
    localStorage.removeItem('fintrack_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
