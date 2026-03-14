import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import pb from '../lib/pocketbase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);
  const [oauthStatus, setOauthStatus] = useState(''); // '', 'processing', 'error:message'
  const oauthAttempted = useRef(false);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setUser(record);
    });

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state && !oauthAttempted.current) {
      oauthAttempted.current = true;
      setOauthStatus('processing');
      completeOAuthRedirect(code, state);
    } else if (pb.authStore.isValid) {
      // Validate the stored token against the server — catches stale
      // tokens after a server restart or deploy.
      pb.collection('users').authRefresh()
        .catch(() => {
          pb.authStore.clear();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const completeOAuthRedirect = async (code, state) => {
    try {
      const stored = localStorage.getItem('oauth_provider');
      if (!stored) {
        setOauthStatus('error:No OAuth session found. Try logging in again.');
        setLoading(false);
        return;
      }

      const provider = JSON.parse(stored);
      if (provider.state !== state) {
        setOauthStatus('error:OAuth state mismatch. Try logging in again.');
        setLoading(false);
        return;
      }

      const result = await pb.collection('users').authWithOAuth2Code(
        provider.name,
        code,
        provider.codeVerifier,
        provider.redirectUrl,
        { name: '' },
      );

      localStorage.removeItem('oauth_provider');
      window.history.replaceState({}, '', window.location.pathname);
      setOauthStatus('');
      setLoading(false);
    } catch (err) {
      console.error('OAuth error details:', JSON.stringify(err, null, 2));
      const msg = err?.response?.message || err?.data?.message || err?.message || 'Unknown error';
      setOauthStatus('error:' + msg);
      localStorage.removeItem('oauth_provider');
      window.history.replaceState({}, '', window.location.pathname);
      setLoading(false);
    }
  };

  const loginWithDiscord = useCallback(async () => {
    const methods = await pb.collection('users').listAuthMethods();
    const discord = methods.oauth2?.providers?.find(p => p.name === 'discord');

    if (!discord) throw new Error('Discord not configured in PocketBase.');

    const redirectUrl = window.location.origin + '/';

    localStorage.setItem('oauth_provider', JSON.stringify({
      name: discord.name,
      state: discord.state,
      codeVerifier: discord.codeVerifier,
      redirectUrl: redirectUrl,
    }));

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

  const clearOauthStatus = useCallback(() => {
    setOauthStatus('');
  }, []);

  const value = {
    user,
    loading,
    oauthStatus,
    clearOauthStatus,
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
