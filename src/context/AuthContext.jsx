import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/configs/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem('auth_session');
        if (sessionData) {
          const { user: savedUser, expiresAt } = JSON.parse(sessionData);
          
          // Check if session is still valid (12 hours) and user is admin
          if (new Date().getTime() < expiresAt && savedUser?.role === 'admin') {
            setIsAuthenticated(true);
            setUser(savedUser);
          } else {
            // Session expired or not admin
            localStorage.removeItem('auth_session');
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('auth_session');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      // Call the admin login endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { 
          success: false, 
          message: data.message || 'Invalid email or password' 
        };
      }

      // Prepare user data
      const userData = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: 'Admin User',
        initials: 'AU',
        role: data.data.user.role,
        token: data.data.token, // Store JWT token
      };

      // Set session for 12 hours
      const expiresAt = new Date().getTime() + (12 * 60 * 60 * 1000); // 12 hours in milliseconds
      const sessionData = {
        user: userData,
        token: data.data.token,
        expiresAt: expiresAt
      };

      localStorage.setItem('auth_session', JSON.stringify(sessionData));
      setIsAuthenticated(true);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_session');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/auth/sign-in');
  };

  // Get the current auth token
  const getToken = () => {
    try {
      const sessionData = localStorage.getItem('auth_session');
      if (sessionData) {
        const { token } = JSON.parse(sessionData);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

AuthProvider.displayName = '/src/context/AuthContext.jsx';

