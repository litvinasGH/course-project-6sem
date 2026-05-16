import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function readStoredUser() {
  try {
    const value = localStorage.getItem('user');
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      if (!localStorage.getItem('token')) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authApi.me();

        if (active) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        logger.warn('session_restore_failed', { error });

        if (active) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleExpiredSession() {
      clearSession();
      setUser(null);
      logger.warn('session_expired');
    }

    window.addEventListener('auth:expired', handleExpiredSession);

    return () => {
      window.removeEventListener('auth:expired', handleExpiredSession);
    };
  }, []);

  async function login(credentials) {
    logger.action('login_attempt', { email: credentials.email });
    const { data } = await authApi.login(credentials);
    saveSession(data.token, data.user);
    setUser(data.user);
    logger.action('login_success', {
      user_id: data.user?.user_id,
      role: data.user?.role,
    });
    return data.user;
  }

  async function register(payload) {
    logger.action('register_attempt', {
      email: payload.email,
      role: payload.role,
    });
    const { data } = await authApi.register(payload);
    saveSession(data.token, data.user);
    setUser(data.user);
    logger.action('register_success', {
      user_id: data.user?.user_id,
      role: data.user?.role,
    });
    return data.user;
  }

  function logout() {
    clearSession();
    setUser(null);
    logger.action('logout');
  }

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
