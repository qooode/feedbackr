import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Inbox, Plus, Bookmark, Bell } from 'lucide-react';
import pb from '../lib/pocketbase';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

const PAGE_TABS = [
  { value: 'my-posts', label: 'My Posts', icon: null },
  { value: 'favorites', label: 'Favorites', icon: Bookmark },
  { value: 'activity', label: 'Activity', icon: Bell },
];

const STATUS_LABELS = {
  new: 'New',
  in_review: 'In Review',
  processing: 'Processing',
  done: 'Done',
  dropped: 'Dropped',
  later: 'Later',
  released: 'Released',
};

export default function MyFeedback() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [pageTab, setPageTab] = useState('my-posts');

  // Favorites state
  const [favPosts, setFavPosts] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  // Activity state
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (user) fetchMyPosts();
  }, [user, tab]);

  useEffect(() => {
    if (user && pageTab === 'favorites') fetchFavorites();
  }, [user, pageTab]);

  useEffect(() => {
    if (user && pageTab === 'activity') fetchActivity();
  }, [user, pageTab]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const filters = [`author = "${user.id}"`];

      if (tab === 'active') {
        filters.push('(status = "new" || status = "in_review" || status = "processing")');
      } else if (tab === 'done') {
        filters.push('(status = "done" || status = "released")');
      } else if (tab === 'closed') {
        filters.push('(status = "dropped" || status = "later")');
      }

      const result = await pb.collection('posts').getList(1, 50, {
        filter: filters.join(' && '),
        sort: '-created',
        expand: 'author',
      });

      setPosts(result.items);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setFavLoading(true);
    try {
      const result = await pb.collection('favorites').getList(1, 50, {
        filter: `user = "${user.id}"`,
        sort: '-created',
        expand: 'post,post.author',
      });

      // Extract posts from expanded favorites
      const extracted = result.items
        .map(fav => fav.expand?.post)
        .filter(Boolean);

      setFavPosts(extracted);
    } catch (err) {
      console.warn('Favorites fetch error:', err?.message);
      setFavPosts([]);
    } finally {
      setFavLoading(false);
    }
  };

  const fetchActivity = async () => {
    setNotifLoading(true);
    try {
      const result = await pb.collection('notifications').getList(1, 50, {
        filter: `user = "${user.id}"`,
        sort: '-created',
        expand: 'post',
      });
      setNotifications(result.items);

      // Mark all as read
      const unread = result.items.filter(n => !n.read);
      if (unread.length > 0) {
        await Promise.all(
          unread.map(n => pb.collection('notifications').update(n.id, { read: true }))
        );
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err?.message);
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
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

  if (authLoading) {
    return (
      <div className="page">
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const stats = {
    total: posts.length,
    votes: posts.reduce((sum, p) => sum + (p.votes_count || 0), 0),
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Feedback</h1>
          <p className="page-subtitle">
            Track the status of everything you've submitted.
          </p>
        </div>

        {/* Page-level tabs (My Posts / Favorites / Activity) */}
        <div className="my-feedback-page-tabs">
          {PAGE_TABS.map((t) => (
            <button
              key={t.value}
              className={`my-feedback-page-tab ${pageTab === t.value ? 'active' : ''}`}
              onClick={() => setPageTab(t.value)}
            >
              {t.icon && <t.icon size={13} />}
              {t.label}
            </button>
          ))}
        </div>

        {/* === MY POSTS TAB === */}
        {pageTab === 'my-posts' && (
          <>
            {/* Status Tabs */}
            <div className="my-feedback-tabs">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  className={`filter-btn ${tab === t.value ? 'active' : ''}`}
                  onClick={() => setTab(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Posts */}
            {loading ? (
              <div className="loading-page">
                <div className="spinner" />
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Inbox size={40} strokeWidth={1.5} />
                </div>
                <h3 className="empty-state-title">
                  {tab === 'all' ? 'No feedback yet' : `No ${STATUS_TABS.find(t => t.value === tab)?.label.toLowerCase()} feedback`}
                </h3>
                <p className="empty-state-text">
                  {tab === 'all'
                    ? "You haven't submitted any feedback yet."
                    : 'Nothing in this category right now.'}
                </p>
                {tab === 'all' && (
                  <Link to="/submit" className="btn btn-primary btn-lg">
                    <Plus size={15} />
                    Submit Feedback
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="my-feedback-stats">
                  <span>{stats.total} {stats.total === 1 ? 'post' : 'posts'}</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span>{stats.votes} {stats.votes === 1 ? 'vote' : 'votes'} received</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* === FAVORITES TAB === */}
        {pageTab === 'favorites' && (
          <>
            {favLoading ? (
              <div className="loading-page">
                <div className="spinner" />
              </div>
            ) : favPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Bookmark size={40} strokeWidth={1.5} />
                </div>
                <h3 className="empty-state-title">No favorites yet</h3>
                <p className="empty-state-text">
                  Save posts you want to keep track of by clicking the bookmark icon.
                </p>
                <Link to="/" className="btn btn-primary btn-lg">
                  Browse Board
                </Link>
              </div>
            ) : (
              <>
                <div className="my-feedback-stats">
                  <span>{favPosts.length} saved {favPosts.length === 1 ? 'post' : 'posts'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {favPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* === ACTIVITY TAB === */}
        {pageTab === 'activity' && (
          <>
            {notifLoading ? (
              <div className="loading-page">
                <div className="spinner" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Bell size={40} strokeWidth={1.5} />
                </div>
                <h3 className="empty-state-title">No activity yet</h3>
                <p className="empty-state-text">
                  You'll see status updates on your posts here.
                </p>
              </div>
            ) : (
              <div className="activity-timeline">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to={`/post/${notif.post}`}
                    className="activity-item"
                  >
                    <div className="activity-item-dot" />
                    <div className="activity-item-content">
                      <span className="activity-item-title">
                        {notif.expand?.post?.title || 'Untitled Post'}
                      </span>
                      <div className="activity-item-change">
                        <span className={`badge badge-${notif.old_status}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {STATUS_LABELS[notif.old_status] || notif.old_status}
                        </span>
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>→</span>
                        <span className={`badge badge-${notif.new_status}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {STATUS_LABELS[notif.new_status] || notif.new_status}
                        </span>
                      </div>
                    </div>
                    <span className="activity-item-time">{timeAgo(notif.created)}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
