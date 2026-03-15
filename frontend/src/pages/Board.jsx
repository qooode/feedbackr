import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Inbox, Loader } from 'lucide-react';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('-votes_count');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const sentinelRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Reset everything when filters change
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setTotalPages(1);
    setInitialLoading(true);
  }, [category, platform, status, sort, search]);

  // Fetch posts whenever page changes
  useEffect(() => {
    fetchPosts();
  }, [category, platform, status, sort, search, page]);

  const fetchPosts = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    const isFirstPage = page === 1;
    if (isFirstPage) setInitialLoading(true);
    else setLoadingMore(true);

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

      setPosts((prev) => isFirstPage ? result.items : [...prev, ...result.items]);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  // IntersectionObserver to trigger loading next page
  const hasMore = page < totalPages;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, totalPages]);

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

        {/* Posts */}
        {initialLoading ? (
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

            {/* Infinite scroll sentinel + loading indicator */}
            <div ref={sentinelRef} className="infinite-scroll-sentinel">
              {loadingMore && (
                <div className="infinite-scroll-loader">
                  <Loader size={18} className="infinite-scroll-spinner" />
                  <span>Loading more…</span>
                </div>
              )}
              {!hasMore && posts.length > PER_PAGE && (
                <div className="infinite-scroll-end">
                  You've seen all {totalItems.toLocaleString()} submissions
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
