import { useState, useEffect } from 'react';
import { Search, Plus, Inbox } from 'lucide-react';
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
        <div className="card filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
          {/* Search */}
          <div className="search-input" style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
              }}
            />
            <input
              className="input"
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
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
            style={{ width: 'auto', minWidth: '130px' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter row */}
        <div className="status-filters">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`status-filter-btn ${status === s ? 'active' : ''}`}
              onClick={() => setStatus(s)}
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
              <Inbox size={40} strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">No feedback yet</h3>
            <p className="empty-state-text">
              Be the first to share your thoughts.
            </p>
            <Link to="/submit" className="btn btn-primary btn-lg">
              <Plus size={15} />
              Submit Feedback
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
