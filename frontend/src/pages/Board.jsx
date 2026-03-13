import { useState, useEffect } from 'react';
import { Search, MessageSquarePlus, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import pb from '../lib/pocketbase';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['all', 'bug', 'feature', 'improvement'];
const STATUSES = ['all', 'new', 'in_review', 'processing', 'done', 'dropped', 'later'];
const SORT_OPTIONS = [
  { value: '-votes_count', label: 'Most Voted' },
  { value: '-created', label: 'Newest' },
  { value: 'created', label: 'Oldest' },
];

export default function Board() {
  const { isLoggedIn } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('-votes_count');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [category, status, sort, search]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const filters = [];
      if (category !== 'all') filters.push(`category = "${category}"`);
      if (status !== 'all') filters.push(`status = "${status}"`);
      if (search.trim()) {
        const escaped = search.trim().replace(/"/g, '\\"');
        filters.push(`(title ~ "${escaped}" || body ~ "${escaped}")`);
      }

      const result = await pb.collection('posts').getList(1, 50, {
        filter: filters.join(' && '),
        sort: sort,
        expand: 'author',
      });

      setPosts(result.items);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Feedback Board</h1>
          <p className="page-subtitle">
            Browse ideas, report bugs, and vote on what matters most.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="card filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
          {/* Search */}
          <div className="search-input" style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              className="input"
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Category filter */}
          <div className="filter-group">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`filter-btn ${status === s ? 'active' : ''}`}
              onClick={() => setStatus(s)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                background: status === s ? 'var(--accent)' : 'var(--bg-glass)',
                color: status === s ? 'white' : 'var(--text-secondary)',
              }}
            >
              {s === 'all' ? 'All Status' : s.replace('_', ' ')}
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
              <Inbox size={48} />
            </div>
            <h3 className="empty-state-title">No feedback yet</h3>
            <p className="empty-state-text">
              Be the first to share your thoughts!
            </p>
            <Link to="/submit" className="btn btn-primary btn-lg">
              <MessageSquarePlus size={18} />
              Submit Feedback
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
