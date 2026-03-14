import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Board from './pages/Board';
import Submit from './pages/Submit';
import PostDetail from './pages/PostDetail';
import AdminKanban from './pages/AdminKanban';
import Changelog from './pages/Changelog';
import MyFeedback from './pages/MyFeedback';

function OAuthStatusBanner() {
  const { oauthStatus, clearOauthStatus } = useAuth();

  if (!oauthStatus) return null;

  if (oauthStatus === 'processing') {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 99999, flexDirection: 'column', gap: '12px',
      }}>
        <div className="spinner" style={{ width: 20, height: 20 }} />
        <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--font-size-sm)' }}>
          Completing Discord login...
        </p>
      </div>
    );
  }

  if (oauthStatus.startsWith('error:')) {
    const msg = oauthStatus.slice(6);
    return (
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--background)', color: 'var(--foreground)',
        padding: '12px 20px', borderRadius: 'var(--radius-lg)', zIndex: 99999,
        maxWidth: '90vw', fontSize: 'var(--font-size-sm)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        display: 'flex', gap: '12px', alignItems: 'center',
      }}>
        <div>
          <strong>Discord login failed:</strong><br />{msg}
        </div>
        <button onClick={clearOauthStatus} style={{
          background: 'var(--secondary)', border: '1px solid var(--border)',
          color: 'var(--foreground)', cursor: 'pointer', fontWeight: '500',
          padding: '4px 10px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
          fontSize: 'var(--font-size-xs)',
        }}>✕</button>
      </div>
    );
  }

  return null;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--background)',
      }}>
        <div className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    );
  }

  return (
    <>
      <OAuthStatusBanner />
      <Navbar />
      <Routes>
        <Route path="/" element={<Board />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/my-feedback" element={<MyFeedback />} />
        <Route path="/admin" element={<AdminKanban />} />
        <Route path="/changelog" element={<Changelog />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
