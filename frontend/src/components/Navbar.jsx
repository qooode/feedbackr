import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, LogOut, LogIn, Plus } from 'lucide-react';
import AuthModal from './AuthModal';
import UserAvatar from './UserAvatar';
import { APP_NAME, LOGO_URL } from '../lib/config';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAdmin, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(() => {
    return !!sessionStorage.getItem('oauth_error');
  });

  const isActive = (path) => location.pathname === path ? 'navbar-link active' : 'navbar-link';

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            {LOGO_URL ? (
              <img src={LOGO_URL} alt={APP_NAME} className="navbar-brand-logo" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            )}
            {APP_NAME}
          </Link>

          <div className="navbar-links">
            <Link to="/" className={isActive('/')}>Board</Link>
            <Link to="/submit" className={isActive('/submit')}>Submit</Link>
            {isAdmin && (
              <Link to="/admin" className={isActive('/admin')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LayoutDashboard size={13} />
                  Admin
                </span>
              </Link>
            )}
          </div>

          <div className="navbar-actions">
            {isLoggedIn ? (
              <>
                <Link to="/submit" className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  New Post
                </Link>
                <div className="navbar-user">
                  <UserAvatar user={user} size="28px" />
                  <span>{user?.name || user?.email}</span>
                </div>
                <button className="btn btn-ghost btn-icon-sm" onClick={logout} title="Log out" style={{ borderRadius: 'var(--radius-md)' }}>
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAuth(true)}>
                <LogIn size={14} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
