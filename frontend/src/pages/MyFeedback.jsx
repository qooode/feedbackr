import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Inbox, Plus } from 'lucide-react';
import pb from '../lib/pocketbase';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

export default function MyFeedback() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (user) fetchMyPosts();
  }, [user, tab]);

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
      </div>
    </div>
  );
}
