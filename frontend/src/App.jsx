import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Board from './pages/Board';
import Submit from './pages/Submit';
import PostDetail from './pages/PostDetail';
import AdminKanban from './pages/AdminKanban';

function OAuthStatusBanner() {
  const { oauthStatus, clearOauthStatus } = useAuth();

  if (!oauthStatus) return null;

  if (oauthStatus === 'processing') {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 99999, flexDirection: 'column', gap: '16px',
      }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'white', fontSize: '1.1rem' }}>Completing Discord login...</p>
      </div>
    );
  }

  if (oauthStatus.startsWith('error:')) {
    const msg = oauthStatus.slice(6);
    return (
      <div style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        background: '#e53e3e', color: 'white', padding: '16px 24px', borderRadius: '12px',
        zIndex: 99999, maxWidth: '90vw', fontSize: '0.9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex', gap: '16px', alignItems: 'center',
      }}>
        <div>
          <strong>Discord login failed:</strong><br />{msg}
        </div>
        <button onClick={clearOauthStatus} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
          cursor: 'pointer', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px',
          flexShrink: 0,
        }}>✕</button>
      </div>
    );
  }

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OAuthStatusBanner />
        <Navbar />
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/admin" element={<AdminKanban />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
