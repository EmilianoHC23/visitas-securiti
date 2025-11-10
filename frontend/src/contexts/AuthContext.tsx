import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  // loading: true during login/logout actions
  loading: boolean;
  // initializing: true while performing initial token check on app startup
  initializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // 'initializing' is true while we check local token on startup
  const [initializing, setInitializing] = useState(true);
  // 'loading' indicates an auth action in progress (login/logout)
  const [loading, setLoading] = useState(false);

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
      setInitializing(false);
    };

    checkUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const { token, user: loggedInUser } = await api.login(username, password);
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

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    // expose both flags: 'initializing' for app startup, 'loading' for auth actions
    initializing,
    loading,
  } as any;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
