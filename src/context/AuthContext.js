import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, genderService } from '../api';

/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 * Single Responsibility: Auth state management
 */
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch current user and status
   */
  const fetchUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
      setStatus(data.status);
      return data;
    } catch (error) {
      // Token invalid, clear state
      authService.logout();
      setUser(null);
      setStatus(null);
      throw error;
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await fetchUser();
        } catch {
          // Ignore - user will be logged out
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  /**
   * Register new user
   */
  const register = async (email, password) => {
    const data = await authService.register(email, password);
    setUser(data.user);
    setStatus({ isSet: false, isLocked: false, isRevealed: false });
    return data;
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    // Fetch full status
    const statusData = await genderService.getMyStatus();
    setStatus(statusData);
    return data;
  };

  /**
   * Logout user
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setStatus(null);
  };

  /**
   * Refresh status
   */
  const refreshStatus = async () => {
    if (user) {
      const statusData = await genderService.getMyStatus();
      setStatus(statusData);
    }
  };

  const value = {
    user,
    status,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    refreshStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
