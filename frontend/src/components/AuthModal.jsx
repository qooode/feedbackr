import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X } from 'lucide-react';
import pb from '../lib/pocketbase';

export default function AuthModal({ onClose }) {
  const { loginWithDiscord, loginWithEmail, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(() => {
    const oauthErr = sessionStorage.getItem('oauth_error');
    if (oauthErr) {
      sessionStorage.removeItem('oauth_error');
      return oauthErr;
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);

  useEffect(() => {
    pb.collection('users').listAuthMethods().then((methods) => {
      setPasswordEnabled(methods.password?.enabled === true);
    }).catch(() => {});
  }, []);

  const handleDiscord = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithDiscord();
      onClose();
    } catch (err) {
      console.error('Discord OAuth error:', err);
      const msg = err?.data?.message || err?.message || 'Discord login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      const msg = err?.response?.message || err?.message || 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <button className="btn btn-ghost btn-icon-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <h2 className="modal-title">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="modal-subtitle">
          {mode === 'login'
            ? 'Sign in to submit feedback and vote'
            : 'Join to submit feedback and vote on ideas'}
        </p>

        <button
          className="btn btn-discord btn-lg"
          onClick={handleDiscord}
          disabled={loading}
          style={{ width: '100%' }}
        >
          <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          Continue with Discord
        </button>

        {passwordEnabled && (
          <>
            <div className="modal-divider">or</div>

            <form className="modal-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <input
                  className="input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <input
                className="input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />

              {error && <div className="error-message">{error}</div>}

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? <div className="spinner" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <p style={{
              textAlign: 'center',
              marginTop: 'var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--muted-foreground)',
            }}>
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setMode('register'); setError(''); }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setMode('login'); setError(''); }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {!passwordEnabled && error && (
          <div className="error-message" style={{ marginTop: 'var(--space-3)' }}>{error}</div>
        )}
      </div>
    </div>
  );
}

