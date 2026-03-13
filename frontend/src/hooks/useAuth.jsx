import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import pb from '../lib/pocketbase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setUser(record);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  const loginWithDiscord = useCallback(async () => {
    try {
      const authData = await pb.collection('users').authWithOAuth2({ provider: 'discord' });
      return authData;
    } catch (err) {
      console.error('Discord login failed:', err);
      throw err;
    }
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return authData;
    } catch (err) {
      console.error('Email login failed:', err);
      throw err;
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      });
      // Auto-login after registration
      return loginWithEmail(email, password);
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  }, [loginWithEmail]);

  const logout = useCallback(() => {
    pb.authStore.clear();
  }, []);

  const value = {
    user,
    loading,
    isAdmin: user?.is_admin === true,
    isLoggedIn: !!user,
    loginWithDiscord,
    loginWithEmail,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
