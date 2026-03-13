import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import pb from '../lib/pocketbase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);
  const oauthAttempted = useRef(false);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setUser(record);
    });

    // Check if returning from OAuth redirect
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
      const stored = localStorage.getItem('oauth_provider');
      if (!stored) throw new Error('No OAuth session found. Please try again.');

      const provider = JSON.parse(stored);
      if (provider.state !== state) throw new Error('OAuth state mismatch.');

      await pb.collection('users').authWithOAuth2Code(
        provider.name,
        code,
        provider.codeVerifier,
        provider.redirectUrl,
        // createData — tells PocketBase to auto-create user on first login
        { name: '' },
      );

      localStorage.removeItem('oauth_provider');
    } catch (err) {
      console.error('OAuth completion error:', err);
      // Store error so AuthModal can show it
      sessionStorage.setItem('oauth_error', err?.data?.message || err?.message || 'OAuth login failed.');
      localStorage.removeItem('oauth_provider');
    } finally {
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
      setLoading(false);
    }
  };

  const loginWithDiscord = useCallback(async () => {
    const methods = await pb.collection('users').listAuthMethods();
    const discord = methods.oauth2?.providers?.find(p => p.name === 'discord');

    if (!discord) throw new Error('Discord not configured in PocketBase.');

    // The redirect comes back to the current page
    const redirectUrl = window.location.origin + '/';

    localStorage.setItem('oauth_provider', JSON.stringify({
      name: discord.name,
      state: discord.state,
      codeVerifier: discord.codeVerifier,
      redirectUrl: redirectUrl,
    }));

    // discord.authURL ends with "&redirect_uri=" — append our URL
    window.location.href = discord.authURL + encodeURIComponent(redirectUrl);
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
