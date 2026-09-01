import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, logoutUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await getCurrentUser();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setInitialLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await loginUser(credentials);
      const { user: loggedInUser, accessToken } = res.data;
      setUser(loggedInUser);
      setToken(accessToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('token', accessToken);
      return { success: true, user: loggedInUser };
    } catch (err) {
      return {
        success: false,
        message: err?.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await registerUser(userData);
      const { user: registeredUser, accessToken } = res.data;
      setUser(registeredUser);
      setToken(accessToken);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      localStorage.setItem('token', accessToken);
      return { success: true, user: registeredUser };
    } catch (err) {
      return {
        success: false,
        message: err?.message || err?.errors?.join(', ') || 'Registration failed.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutUser();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initialLoading,
        login,
        register,
        logout,
        isAdmin,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
