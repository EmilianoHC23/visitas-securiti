import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
<<<<<<< HEAD
  login: (username: string, password: string, recaptchaToken?: string) => Promise<void>;
=======
  login: (email: string, password: string) => Promise<void>;
>>>>>>> ef0db9d98d173edacdb6f76c3e808da590df12a8
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('securitiToken');
      if (token) {
        try {
          const currentUser = await api.getMe();
          setUser(currentUser);
        } catch (error) {
          console.error("Failed to fetch user with token", error);
          localStorage.removeItem('securitiToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

<<<<<<< HEAD
  const login = useCallback(async (username: string, password: string, recaptchaToken?: string) => {
    setLoading(true);
    try {
      const { token, user: loggedInUser } = await api.login(username, password, recaptchaToken);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { token, user: loggedInUser } = await api.login(email, password);
>>>>>>> ef0db9d98d173edacdb6f76c3e808da590df12a8
      localStorage.setItem('securitiToken', token);
      setUser(loggedInUser);
    } catch (error) {
        console.error("Login failed:", error);
        throw error; // Re-throw to be caught in the component
    } finally {
        setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('securitiToken');
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
