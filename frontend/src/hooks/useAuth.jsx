import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import pb from '../lib/pocketbase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setUser(record);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  const loginWithDiscord = useCallback(async () => {
    // PocketBase's built-in popup OAuth — handles redirect via /api/oauth2-redirect
    const authData = await pb.collection('users').authWithOAuth2({ provider: 'discord' });
    return authData;
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    return await pb.collection('users').authWithPassword(email, password);
  }, []);

  const register = useCallback(async (email, password, name) => {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
    });
    return loginWithEmail(email, password);
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
