import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Use relative URL for production (nginx proxy) or env var for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('planed_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('planed_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('planed_token', response.data.access_token);
    setToken(response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name, invitationCode) => {
    const response = await axios.post(`${API}/auth/register`, { 
      email, 
      password, 
      name, 
      invitation_code: invitationCode 
    });
    localStorage.setItem('planed_token', response.data.access_token);
    setToken(response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('planed_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (newUser) => setUser(newUser);

  const authAxios = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  });

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, authAxios, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
