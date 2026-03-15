import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Inbox, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import pb from '../lib/pocketbase';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['all', 'bug', 'feature', 'improvement'];
const PLATFORMS = ['all', 'iOS', 'iPadOS', 'macOS', 'tvOS'];
const STATUSES = ['all', 'new', 'in_review', 'processing', 'done', 'dropped', 'later', 'released'];
const SORT_OPTIONS = [
  { value: '-votes_count', label: 'Most Voted' },
  { value: '-created', label: 'Newest' },
  { value: 'created', label: 'Oldest' },
];
const PER_PAGE = 20;

export default function Board() {
  const { isLoggedIn } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('-votes_count');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const listTopRef = useRef(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [category, platform, status, sort, search]);

  useEffect(() => {
    fetchPosts();
  }, [category, platform, status, sort, search, page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const filters = [];
      if (category !== 'all') filters.push(`category = "${category}"`);
      if (platform !== 'all') filters.push(`platform = "${platform}"`);
      if (status !== 'all') filters.push(`status = "${status}"`);
      if (search.trim()) {
        const sanitized = search.trim().replace(/[^\w\s]/g, '').slice(0, 100);
        if (sanitized) filters.push(`(title ~ "${sanitized}" || body ~ "${sanitized}")`);
      }

      const result = await pb.collection('posts').getList(page, PER_PAGE, {
        filter: filters.join(' && '),
        sort: sort,
        expand: 'author',
      });

      setPosts(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p) => {
    const target = Math.max(1, Math.min(p, totalPages));
    if (target === page) return;
    setPage(target);
    // Scroll to the top of the post list
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Generate page numbers to show (with ellipsis)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const hasFilters = category !== 'all' || platform !== 'all' || status !== 'all' || search.trim();

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Feedback Board</h1>
          <p className="page-subtitle">
            Browse ideas, report bugs, and vote on what matters most.
            {!loading && totalItems > 0 && (
              <span className="board-total-pill">
                {totalItems.toLocaleString()} {hasFilters ? 'results' : (totalItems === 1 ? 'submission' : 'submissions')}
              </span>
            )}
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

          {/* Platform filter */}
          <div className="filter-group">
            {PLATFORMS.map((plat) => (
              <button
                key={plat}
                className={`filter-btn ${platform === plat ? 'active' : ''}`}
                onClick={() => setPlatform(plat)}
              >
                {plat === 'all' ? 'All' : plat}
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

        {/* Scroll anchor */}
        <div ref={listTopRef} style={{ scrollMarginTop: 'calc(var(--navbar-height) + 16px)' }} />

        {/* Posts */}
        {loading ? (
          <div className="loading-page" style={{ minHeight: '40vh' }}>
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
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, totalItems)} of {totalItems.toLocaleString()}
                </div>

                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    onClick={() => goToPage(1)}
                    disabled={page === 1}
                    title="First page"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-btn pagination-num ${page === p ? 'active' : ''}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="pagination-btn"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => goToPage(totalPages)}
                    disabled={page === totalPages}
                    title="Last page"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
