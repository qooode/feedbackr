import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import pb from '../lib/pocketbase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState('');
  const oauthAttempted = useRef(false);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setUser(record);
    });

    // Check if we're returning from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state && !oauthAttempted.current) {
      oauthAttempted.current = true;
      completeOAuthRedirect(code, state);
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const completeOAuthRedirect = async (code, state) => {
    try {
      const provider = JSON.parse(localStorage.getItem('oauth_provider') || '{}');

      if (!provider.name || !provider.state || !provider.codeVerifier) {
        throw new Error('Missing OAuth provider data. Please try logging in again.');
      }

      if (provider.state !== state) {
        throw new Error('OAuth state mismatch. Please try logging in again.');
      }

      const redirectUrl = window.location.origin + '/';

      await pb.collection('users').authWithOAuth2Code(
        provider.name,
        code,
        provider.codeVerifier,
        redirectUrl,
      );

      localStorage.removeItem('oauth_provider');
      window.history.replaceState({}, '', '/');
    } catch (err) {
      console.error('OAuth error:', err);
      setOauthError(err?.data?.message || err?.message || 'OAuth login failed.');
      localStorage.removeItem('oauth_provider');
      window.history.replaceState({}, '', '/');
    } finally {
      setLoading(false);
    }
  };

  const loginWithDiscord = useCallback(async () => {
    const methods = await pb.collection('users').listAuthMethods();
    const discord = methods.oauth2?.providers?.find(p => p.name === 'discord');

    if (!discord) {
      throw new Error('Discord provider not configured in PocketBase.');
    }

    localStorage.setItem('oauth_provider', JSON.stringify({
      name: discord.name,
      state: discord.state,
      codeVerifier: discord.codeVerifier,
    }));

    const redirectUrl = window.location.origin + '/';
    window.location.href = discord.authURL + encodeURIComponent(redirectUrl);
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    try {
      return await pb.collection('users').authWithPassword(email, password);
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
      return loginWithEmail(email, password);
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  }, [loginWithEmail]);

  const logout = useCallback(() => {
    pb.authStore.clear();
  }, []);

  const clearOauthError = useCallback(() => {
    setOauthError('');
  }, []);

  const value = {
    user,
    loading,
    isAdmin: user?.is_admin === true,
    isLoggedIn: !!user,
    oauthError,
    clearOauthError,
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
