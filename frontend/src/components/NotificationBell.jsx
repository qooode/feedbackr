import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';

const STATUS_LABELS = {
  new: 'New',
  in_review: 'In Review',
  processing: 'Processing',
  done: 'Done',
  dropped: 'Dropped',
  later: 'Later',
  released: 'Released',
};

export default function NotificationBell() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await pb.collection('notifications').getList(1, 30, {
        filter: `user = "${user.id}"`,
        sort: '-created',
        expand: 'post',
      });
      setNotifications(result.items);
      setUnreadCount(result.items.filter(n => !n.read).length);
    } catch (err) {
      // Notifications collection may not exist yet
      console.warn('Notifications fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount and periodically
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markAsRead = async (notifId) => {
    try {
      await pb.collection('notifications').update(notifId, { read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    try {
      await Promise.all(
        unread.map(n => pb.collection('notifications').update(n.id, { read: true }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
    setOpen(false);
    navigate(`/post/${notif.post}`);
  };

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
  };

  if (!isLoggedIn) return null;

  return (
    <div className="notif-wrapper" ref={panelRef}>
      <button
        className="btn btn-ghost btn-icon-sm notif-bell-btn"
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notif-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="notif-mark-all-btn"
                onClick={markAllRead}
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-panel-body">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="spinner" style={{ width: 16, height: 16 }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={20} strokeWidth={1.5} style={{ color: 'var(--muted-foreground)' }} />
                <span>No notifications yet</span>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleNotifClick(notif)}
                >
                  <div className="notif-item-indicator">
                    {!notif.read && <span className="notif-unread-dot" />}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-text">
                      <span className="notif-item-post-title">
                        {notif.expand?.post?.title || 'Untitled Post'}
                      </span>
                      <span className="notif-item-status-change">
                        <span className={`badge badge-${notif.old_status}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {STATUS_LABELS[notif.old_status] || notif.old_status}
                        </span>
                        <ArrowRight size={10} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                        <span className={`badge badge-${notif.new_status}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {STATUS_LABELS[notif.new_status] || notif.new_status}
                        </span>
                      </span>
                    </div>
                    <span className="notif-item-time">{timeAgo(notif.created)}</span>
                  </div>
                  {!notif.read && (
                    <button
                      className="notif-read-btn"
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                      title="Mark as read"
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
