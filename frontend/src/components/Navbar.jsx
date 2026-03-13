import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, LayoutDashboard, LogOut, LogIn, Plus } from 'lucide-react';
import AuthModal from './AuthModal';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAdmin, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);

  const isActive = (path) => location.pathname === path ? 'navbar-link active' : 'navbar-link';

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <MessageSquare size={24} />
            Feedbackr
          </Link>

          <div className="navbar-links">
            <Link to="/" className={isActive('/')}>Board</Link>
            <Link to="/submit" className={isActive('/submit')}>Submit</Link>
            {isAdmin && (
              <Link to="/admin" className={isActive('/admin')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LayoutDashboard size={14} />
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
                  Submit Feedback
                </Link>
                <div className="navbar-user">
                  <div className="navbar-avatar">
                    {(user?.name || user?.email || '?')[0].toUpperCase()}
                  </div>
                  <span>{user?.name || user?.email}</span>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={logout} title="Log out">
                  <LogOut size={16} />
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
