import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, LayoutGrid, LogOut, LogIn, PenLine, Plus, Megaphone, Map, Menu, X, ChevronRight } from 'lucide-react';
import AuthModal from './AuthModal';
import UserAvatar from './UserAvatar';
import NotificationBell from './NotificationBell';
import { APP_NAME, LOGO_URL } from '../lib/config';
import { useState, useEffect, useCallback } from 'react';

const PAGE_LABELS = {
  '/': 'Board',
  '/submit': 'Submit',
  '/changelog': 'Updates',
  '/roadmap': 'Roadmap',
  '/admin': 'Admin',
  '/my-feedback': 'My Feedback',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/cookies': 'Cookie Policy',
};

function getPageLabel(pathname) {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.startsWith('/post/')) return 'Post';
  return null;
}

export default function Navbar() {
  const { user, isAdmin, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(() => {
    return !!sessionStorage.getItem('oauth_error');
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const currentLabel = getPageLabel(location.pathname);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = useCallback(() => {
    setMobileOpen(false);
    logout();
  }, [logout]);

  const NAV_ITEMS = [
    { path: '/', label: 'Board', icon: LayoutGrid },
    { path: '/submit', label: 'Submit', icon: PenLine },
    { path: '/changelog', label: 'Updates', icon: Megaphone },
    { path: '/roadmap', label: 'Roadmap', icon: Map },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Left: Brand */}
          <div className="navbar-left">
            <Link to="/" className="navbar-brand">
              {LOGO_URL ? (
                <img src={LOGO_URL} alt={APP_NAME} className="navbar-brand-logo" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
              )}
              <span className="navbar-brand-text">{APP_NAME}</span>
            </Link>

            {/* Mobile breadcrumb */}
            {currentLabel && location.pathname !== '/' && (
              <span className="navbar-breadcrumb">
                <ChevronRight size={14} />
                <span className="navbar-breadcrumb-label">{currentLabel}</span>
              </span>
            )}
          </div>

          {/* Center: Nav links */}
          <div className="navbar-links">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`navbar-link ${isActive(path) ? 'active' : ''}`}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
              >
                <LayoutDashboard size={13} />
                Admin
              </Link>
            )}
          </div>

          {/* Right: Compact actions */}
          <div className="navbar-actions">
            {isLoggedIn ? (
              <>
                <Link to="/submit" className="navbar-new-post-btn navbar-desktop-only" title="New Post">
                  <Plus size={16} strokeWidth={2.5} />
                </Link>
                <NotificationBell />
                <Link to="/my-feedback" className="navbar-avatar-link navbar-desktop-only" title="My Feedback">
                  <UserAvatar user={user} size="30px" />
                </Link>
                <button className="btn btn-ghost btn-icon-sm navbar-desktop-only" onClick={handleLogout} title="Log out">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm navbar-desktop-only" onClick={() => setShowAuth(true)}>
                Sign In
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="btn btn-ghost btn-icon-sm navbar-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out drawer */}
      <div className={`mobile-drawer-backdrop ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
            {LOGO_URL ? (
              <img src={LOGO_URL} alt={APP_NAME} className="navbar-brand-logo" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            )}
            {APP_NAME}
          </Link>
          <button className="btn btn-ghost btn-icon-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          <Link to="/" className={`mobile-drawer-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <LayoutGrid size={16} />
            Board
          </Link>
          <Link to="/submit" className={`mobile-drawer-link ${location.pathname === '/submit' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <PenLine size={16} />
            Submit Feedback
          </Link>
          <Link to="/changelog" className={`mobile-drawer-link ${location.pathname === '/changelog' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <Megaphone size={16} />
            Updates
          </Link>
          <Link to="/roadmap" className={`mobile-drawer-link ${location.pathname === '/roadmap' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <Map size={16} />
            Roadmap
          </Link>
          {isAdmin && (
            <Link to="/admin" className={`mobile-drawer-link ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={16} />
              Admin Dashboard
            </Link>
          )}
          {isLoggedIn && (
            <Link to="/my-feedback" className={`mobile-drawer-link ${location.pathname === '/my-feedback' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <UserAvatar user={user} size="20px" />
              My Feedback
            </Link>
          )}
        </nav>

        <div className="mobile-drawer-footer">
          {isLoggedIn ? (
            <>
              <div className="mobile-drawer-user">
                <UserAvatar user={user} size="32px" />
                <div className="mobile-drawer-user-info">
                  <span className="mobile-drawer-user-name">{user?.name || user?.username}</span>
                  <span className="mobile-drawer-user-email">{user?.email}</span>
                </div>
              </div>
              <div className="mobile-drawer-footer-actions">
                <Link to="/submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                  <Plus size={14} />
                  New Post
                </Link>
                <button className="btn btn-ghost btn-icon-sm" onClick={handleLogout} title="Log out">
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setMobileOpen(false); setShowAuth(true); }}>
              <LogIn size={14} />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
